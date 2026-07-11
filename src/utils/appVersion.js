// Client-side "is a newer frontend release available" check.
//
// The backend has no way to know what version of the frontend a browser
// actually has loaded — only the frontend itself knows that. So this check
// is fully client-side: it compares the version baked into this build
// (from package.json, injected via Vite's `define`, see vite.config.js)
// against chores-web-frontend's own GitHub releases.

const GITHUB_RELEASES_URL =
  "https://api.github.com/repos/derekwinters/chores-web-frontend/releases/latest";

// localStorage key + TTL for caching the GitHub check. GitHub's
// unauthenticated rate limit is 60 requests/hour/IP, so we don't want to
// re-check on every mount/render — once every few hours is plenty.
export const CACHE_KEY = "chores-web:app-version-check";
export const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * The version of this frontend build, injected at build time from
 * package.json (see the `define` block in vite.config.js). Falls back to
 * "0.0.0" if somehow unset (e.g. a non-Vite execution context).
 */
export function getCurrentVersion() {
  // eslint-disable-next-line no-undef
  return typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
}

function normalizeVersion(tagName) {
  if (typeof tagName !== "string") return null;
  return tagName.startsWith("v") ? tagName.slice(1) : tagName;
}

// Simple numeric segment comparison (x.y.z). Falls back to a straight
// inequality check for anything that doesn't look like plain semver.
function isNewerVersion(latest, current) {
  if (!latest || !current) return false;
  const a = latest.split(".").map((n) => parseInt(n, 10));
  const b = current.split(".").map((n) => parseInt(n, 10));
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (Number.isNaN(x) || Number.isNaN(y)) return latest !== current;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.checkedAt !== "number") return null;
    if (Date.now() - parsed.checkedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(result) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
  } catch {
    // localStorage may be unavailable (private mode, quota) — non-fatal.
  }
}

/**
 * Checks chores-web-frontend's GitHub releases for a newer version than
 * this build. Cached in localStorage for CACHE_TTL_MS unless `force` is
 * passed. Never throws — network/parse failures resolve to a result with
 * `error: true` and a null latestVersion instead.
 */
export async function checkForUpdate({ force = false } = {}) {
  const currentVersion = getCurrentVersion();

  if (!force) {
    const cached = readCache();
    if (cached) return cached;
  }

  try {
    const res = await fetch(GITHUB_RELEASES_URL, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) {
      throw new Error(`GitHub releases API error: ${res.status}`);
    }
    const data = await res.json();
    const latestVersion = normalizeVersion(data.tag_name);
    const result = {
      currentVersion,
      latestVersion,
      updateAvailable: isNewerVersion(latestVersion, currentVersion),
      checkedAt: Date.now(),
    };
    writeCache(result);
    return result;
  } catch {
    return {
      currentVersion,
      latestVersion: null,
      updateAvailable: false,
      checkedAt: Date.now(),
      error: true,
    };
  }
}
