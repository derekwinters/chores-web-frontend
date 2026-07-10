// Iteration 2 of the design-token rollout (derekwinters/chores-web-docs#11,
// this repo's #22): the CSS custom-property layer comes from
// @derekwinters/design-tokens; the runtime theme override keeps working.
// Iteration 4 (#24) extends the contract to the component tokens and the
// Android-preferred design decisions (borderless, flat cards, elevation-*).
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import themes from "@derekwinters/design-tokens/themes.json";
import { color } from "@derekwinters/design-tokens";
import { DEFAULT_THEME_COLORS, applyTheme } from "../utils/theme";

const read = (rel) => readFileSync(`${process.cwd()}/src/${rel}`, "utf8");

const walk = (dir, ext) =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && ext.some((x) => e.name.endsWith(x)))
    .map((e) => join(e.parentPath ?? e.path, e.name))
    .filter((p) => !p.includes("__tests__"));

const srcDir = `${process.cwd()}/src`;
const allCss = () => walk(srcDir, [".css"]);
const allSource = () => walk(srcDir, [".css", ".jsx", ".js"]);

describe("index.css token layer", () => {
  const css = read("index.css");

  it("imports the generated tokens.css instead of hand-authoring :root", () => {
    expect(css).toMatch(/@import\s+"@derekwinters\/design-tokens\/tokens\.css"/);
  });

  it("contains no hand-authored slot values (dark palette hex)", () => {
    // every dark-set slot/derived value must come from the package
    for (const hex of [
      "#080c14",
      "#16202e",
      "#1e2d40",
      "#73B1DD",
      "#dce8f5",
      "#7899b8",
      "#e05c6a",
      "#e8a930",
      "#3db87a",
      "#4a5568",
      "#c9a84c",
    ]) {
      expect(css.toLowerCase()).not.toContain(hex.toLowerCase());
    }
  });

  it("contains no legacy block (deleted in Iteration 4, #24)", () => {
    // decisions of record: borderless design, elevation-* shadows, token slots
    expect(css).not.toMatch(/--border:/);
    expect(css).not.toMatch(/--accent-btn:/);
    expect(css).not.toMatch(/--accent-bg:/);
    expect(css).not.toMatch(/--gold:/);
    expect(css).not.toMatch(/--gold-bg:/);
    expect(css).not.toMatch(/--radius:\s/);
    expect(css).not.toMatch(/--shadow:/);
    expect(css).not.toMatch(/--shadow-lg:/);
  });

  it("binds the global button base to the button component tokens", () => {
    expect(css).toMatch(/var\(--component-button-radius\)/);
    expect(css).toMatch(
      /var\(--component-button-padding-y\)\s+var\(--component-button-padding-x\)/
    );
    expect(css).toMatch(/var\(--component-button-disabled-alpha\)/);
    expect(css).toMatch(/var\(--component-button-hover-alpha\)/);
  });
});

describe("iteration 4 component convergence (#24)", () => {
  it("no CSS file references the deleted legacy vars", () => {
    for (const file of allSource()) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toMatch(/var\(--border\)/);
      expect(src, file).not.toMatch(/var\(--accent-btn\)/);
      expect(src, file).not.toMatch(/var\(--accent-bg\)/);
      expect(src, file).not.toMatch(/var\(--gold\)/);
      expect(src, file).not.toMatch(/var\(--gold-bg\)/);
      expect(src, file).not.toMatch(/var\(--radius\)/);
      expect(src, file).not.toMatch(/var\(--shadow\)/);
      expect(src, file).not.toMatch(/var\(--shadow-lg\)/);
    }
  });

  it("no decorative 1px borders remain (borderless flat-surface design)", () => {
    for (const file of allSource()) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toMatch(/1px solid var\(--border\)/);
    }
  });

  it("box-shadows come from the elevation scale (cards flat by default)", () => {
    for (const file of allCss()) {
      const src = readFileSync(file, "utf8");
      for (const line of src.split("\n")) {
        if (!line.includes("box-shadow")) continue;
        expect(line, `${file}: ${line.trim()}`).toMatch(
          /var\(--elevation-[1-4]\)|var\(--shadow-accent-glow\)|var\(--component-form-field-focus-ring-width\)|box-shadow var\(/
        );
      }
    }
  });

  it("Modal.css uses the modal component tokens", () => {
    const css = read("components/Modal.css");
    expect(css).toMatch(/max-width:\s*var\(--component-modal-max-width\)/);
    expect(css).toMatch(/var\(--component-modal-radius\)/);
    expect(css).toMatch(/var\(--component-modal-padding\)/);
    expect(css).toMatch(/z-index:\s*var\(--z-modal\)/);
  });

  it("RedemptionModal is unified onto the shared modal treatment", () => {
    const css = read("components/RedemptionModal.css");
    expect(css).toMatch(/max-width:\s*var\(--component-modal-max-width\)/);
    expect(css).toMatch(/z-index:\s*var\(--z-modal\)/);
    expect(css).toMatch(/var\(--elevation-3\)/);
  });

  it("chore rows use the chore-row component tokens", () => {
    const css = read("components/ChoreCard.css");
    expect(css).toMatch(/var\(--component-chore-row-accent-bar-width\)/);
    expect(css).toMatch(/var\(--component-chore-row-padding-inner\)/);
    expect(css).toMatch(/var\(--component-chore-row-padding-inner-with-bar\)/);
    expect(css).toMatch(/var\(--component-chore-row-action-gap\)/);
  });

  it("badges use the pill-badge component tokens", () => {
    for (const rel of ["components/ChoreList.css", "components/Log.css"]) {
      const css = read(rel);
      expect(css, rel).toMatch(/var\(--component-pill-badge-radius\)/);
      expect(css, rel).toMatch(
        /var\(--component-pill-badge-padding-y\)\s+var\(--component-pill-badge-padding-x\)/
      );
      expect(css, rel).toMatch(/var\(--component-pill-badge-fill-alpha\)/);
    }
  });

  it("target badges use the decided Android mapping (person → secondary, chore → primary)", () => {
    const css = read("components/Log.css");
    expect(css).toMatch(/target-badge--chore[^}]*var\(--primary\)/);
    expect(css).toMatch(/target-badge--user[^}]*var\(--secondary\)/);
  });

  it("nav and top bar bind to the nav/top-bar component tokens", () => {
    const css = read("App.css");
    expect(css).toMatch(/var\(--component-nav-sidebar-width\)/);
    expect(css).toMatch(/var\(--component-nav-sidebar-collapsed-width\)/);
    expect(css).toMatch(/var\(--component-nav-item-radius\)/);
    expect(css).toMatch(/var\(--component-nav-item-padding\)/);
    expect(css).toMatch(/var\(--component-top-bar-height\)/);
    expect(css).not.toMatch(/56px/);
  });

  it("layer stack uses the z-index scale (nav < drawer < modal < toast)", () => {
    const app = read("App.css");
    expect(app).toMatch(/z-index:\s*var\(--z-nav\)/);
    expect(app).toMatch(/z-index:\s*var\(--z-drawer\)/);
    expect(app).toMatch(/calc\(var\(--z-drawer\) - 1\)/);
    for (const rel of [
      "components/ChoreForm.css",
      "components/UserManagement.css",
      "components/ThemeSettings.css",
    ]) {
      expect(read(rel), rel).toMatch(/z-index:\s*var\(--z-modal\)/);
    }
    expect(read("components/Toast.jsx")).toMatch(/var\(--z-toast\)/);
    for (const file of allSource()) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toMatch(/z-index:\s*\d/);
      expect(src, file).not.toMatch(/zIndex:\s*\d/);
    }
  });

  it("form max-widths use size.form-max; no unresolved iteration-4 markers remain", () => {
    expect(read("pages/Setup.css")).toMatch(/max-width:\s*var\(--size-form-max\)/);
    expect(read("pages/Login.css")).toMatch(/max-width:\s*var\(--size-form-max\)/);
    for (const file of allSource()) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/iteration-4 \(#24\)/);
    }
  });
});

describe("theme.js single source of palettes", () => {
  it("DEFAULT_THEME_COLORS is the package's paper palette (backend site default)", () => {
    expect(DEFAULT_THEME_COLORS).toEqual(themes.paper);
  });

  it("applyTheme derives text colors from the token sets", () => {
    applyTheme(themes.paper);
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--text")).toBe(color.light.text);
    expect(root.style.getPropertyValue("--text-muted")).toBe(color.light["text-muted"]);

    applyTheme(themes.dark);
    expect(root.style.getPropertyValue("--text")).toBe(color.dark.text);
    expect(root.style.getPropertyValue("--text-muted")).toBe(color.dark["text-muted"]);
  });

  it("applyTheme still writes the slot vars and -rgb triplets", () => {
    applyTheme(themes.frog);
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--bg")).toBe(themes.frog.bg);
    expect(root.style.getPropertyValue("--surface2")).toBe(themes.frog.surface2);
    expect(root.style.getPropertyValue("--accent-rgb")).toBe("200,230,201"); // #c8e6c9
  });
});

describe("MUIDatePicker token bridge", () => {
  it("has no raw hex fallbacks — fallbacks come from the token module", () => {
    const src = read("components/MUIDatePicker.jsx");
    expect(src).not.toMatch(/#[0-9a-fA-F]{6}/);
    expect(src).toMatch(/@derekwinters\/design-tokens/);
  });
});
