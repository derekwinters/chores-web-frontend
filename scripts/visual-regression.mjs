#!/usr/bin/env node
/**
 * Visual regression for the Storybook catalog (design-token guardrail,
 * iteration 5 of derekwinters/chores-web-docs#11).
 *
 * Serves storybook-static, screenshots every story under the two gated
 * themes (dark + paper — the mapping-matrix parity themes) at a fixed
 * 800x600 viewport, and compares against the committed PNGs in
 * .visual-baselines/ with pixelmatch.
 *
 *   node scripts/visual-regression.mjs            # verify (CI gate)
 *   node scripts/visual-regression.mjs --update   # (re)record baselines
 *
 * Naming matches the Android Roborazzi goldens for the cross-repo gallery
 * (chores-web-design-tokens#6): story id "pillbadge--variants" + theme
 * "dark" → pillbadge_variants_dark.png.
 */

import { createServer } from "node:http";
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATIC_DIR = path.join(ROOT, "storybook-static");
const BASELINE_DIR = path.join(ROOT, ".visual-baselines");
const DIFF_DIR = path.join(ROOT, ".visual-diffs");

const UPDATE = process.argv.includes("--update");
const THEMES = ["dark", "paper"];
const VIEWPORT = { width: 800, height: 600 };
// pixelmatch per-pixel color threshold (0..1); AA pixels are auto-detected
// and ignored by pixelmatch itself.
const PIXEL_THRESHOLD = 0.1;
// Allowed fraction of differing pixels (anti-aliasing headroom).
const MAX_DIFF_RATIO = Number(process.env.VISUAL_DIFF_RATIO ?? "0.001");
const SETTLE_MS = 300;

/** Story id → gallery basename: "pillbadge--variants" → "pillbadge_variants". */
function baseName(storyId) {
  return storyId.replace("--", "_").replace(/[^a-z0-9_]/g, "");
}

/* ------------------------------------------------------------------ */
/* Storybook build + static server                                     */
/* ------------------------------------------------------------------ */

function ensureStorybookBuilt() {
  if (existsSync(path.join(STATIC_DIR, "index.json"))) return;
  console.log("storybook-static/ not found — running `npm run build-storybook`...");
  execSync("npm run build-storybook", { cwd: ROOT, stdio: "inherit" });
}

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function startServer() {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let filePath = path.join(STATIC_DIR, urlPath === "/" ? "index.html" : urlPath);
    if (!filePath.startsWith(STATIC_DIR) || !existsSync(filePath)) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    try {
      const body = readFileSync(filePath);
      res.writeHead(200, {
        "content-type": MIME[path.extname(filePath)] ?? "application/octet-stream",
      });
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end("error");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

/* ------------------------------------------------------------------ */
/* Browser resolution                                                  */
/* ------------------------------------------------------------------ */

/**
 * Prefer Playwright's own registry (CI: `npx playwright install chromium`
 * puts the pinned build where chromium.executablePath() expects it). If
 * that build is missing (e.g. a sandbox that pre-bakes a different
 * revision under PLAYWRIGHT_BROWSERS_PATH), fall back to any chromium
 * build found there — headless shell first, to match Playwright's default
 * headless engine.
 */
function resolveExecutablePath() {
  try {
    const expected = chromium.executablePath();
    if (expected && existsSync(expected)) return undefined; // default resolution works
  } catch {
    /* fall through to scan */
  }
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;
  const dirs = readdirSync(root).sort().reverse();
  const candidates = [];
  for (const prefix of ["chromium_headless_shell-", "chromium-"]) {
    for (const dir of dirs) {
      if (!dir.startsWith(prefix)) continue;
      for (const bin of [
        path.join(root, dir, "chrome-linux", "headless_shell"),
        path.join(root, dir, "chrome-linux", "chrome"),
      ]) {
        if (existsSync(bin)) candidates.push(bin);
      }
    }
  }
  return candidates[0];
}

/* ------------------------------------------------------------------ */
/* Screenshot + compare                                                */
/* ------------------------------------------------------------------ */

async function screenshotStory(page, origin, storyId, theme) {
  const url = `${origin}/iframe.html?id=${storyId}&viewMode=story&globals=theme:${theme}`;
  await page.goto(url, { waitUntil: "networkidle" });
  // Deterministic rendering: no animations/transitions, no caret.
  await page.addStyleTag({
    content:
      "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
  });
  await page.evaluate(() => document.fonts.ready);
  const errored = await page.evaluate(
    () => document.body.classList.contains("sb-show-errordisplay") || !document.querySelector("#storybook-root > *"),
  );
  if (errored) throw new Error(`story ${storyId} failed to render (theme=${theme})`);
  await page.waitForTimeout(SETTLE_MS);
  return page.screenshot({ animations: "disabled", caret: "hide" });
}

function compare(baselinePath, actualBuffer, diffPath) {
  const baseline = PNG.sync.read(readFileSync(baselinePath));
  const actual = PNG.sync.read(actualBuffer);
  if (baseline.width !== actual.width || baseline.height !== actual.height) {
    return { pass: false, reason: `size ${actual.width}x${actual.height} != baseline ${baseline.width}x${baseline.height}` };
  }
  const { width, height } = baseline;
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(baseline.data, actual.data, diff.data, width, height, {
    threshold: PIXEL_THRESHOLD,
  });
  const ratio = diffPixels / (width * height);
  if (ratio > MAX_DIFF_RATIO) {
    mkdirSync(path.dirname(diffPath), { recursive: true });
    writeFileSync(diffPath, PNG.sync.write(diff));
    writeFileSync(diffPath.replace(/\.diff\.png$/, ".actual.png"), actualBuffer);
    return { pass: false, reason: `${diffPixels}px differ (${(ratio * 100).toFixed(3)}% > ${MAX_DIFF_RATIO * 100}%)` };
  }
  return { pass: true };
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  ensureStorybookBuilt();

  const index = JSON.parse(readFileSync(path.join(STATIC_DIR, "index.json"), "utf8"));
  const storyIds = Object.values(index.entries)
    .filter((e) => e.type === "story")
    .map((e) => e.id)
    .sort();
  if (storyIds.length === 0) throw new Error("no stories found in storybook-static/index.json");

  rmSync(DIFF_DIR, { recursive: true, force: true });
  mkdirSync(BASELINE_DIR, { recursive: true });

  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}`;

  const executablePath = resolveExecutablePath();
  if (executablePath) console.log(`using chromium executable: ${executablePath}`);
  const browser = await chromium.launch({ executablePath });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  const failures = [];
  let updated = 0;
  let checked = 0;

  try {
    for (const storyId of storyIds) {
      for (const theme of THEMES) {
        const name = `${baseName(storyId)}_${theme}.png`;
        const baselinePath = path.join(BASELINE_DIR, name);
        const actual = await screenshotStory(page, origin, storyId, theme);
        if (UPDATE) {
          writeFileSync(baselinePath, actual);
          updated += 1;
          console.log(`recorded ${name}`);
          continue;
        }
        checked += 1;
        if (!existsSync(baselinePath)) {
          mkdirSync(DIFF_DIR, { recursive: true });
          writeFileSync(path.join(DIFF_DIR, name.replace(/\.png$/, ".actual.png")), actual);
          failures.push({ name, reason: "missing baseline (run `npm run visual:update`)" });
          console.log(`FAIL ${name}: missing baseline`);
          continue;
        }
        const result = compare(baselinePath, actual, path.join(DIFF_DIR, name.replace(/\.png$/, ".diff.png")));
        if (result.pass) {
          console.log(`ok   ${name}`);
        } else {
          failures.push({ name, reason: result.reason });
          console.log(`FAIL ${name}: ${result.reason}`);
        }
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (UPDATE) {
    console.log(`\n${updated} baseline(s) written to ${path.relative(ROOT, BASELINE_DIR)}/`);
    return;
  }
  if (failures.length > 0) {
    console.error(`\n${failures.length}/${checked} snapshot(s) failed; diffs in ${path.relative(ROOT, DIFF_DIR)}/`);
    for (const f of failures) console.error(`  - ${f.name}: ${f.reason}`);
    process.exit(1);
  }
  console.log(`\nall ${checked} snapshots match.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
