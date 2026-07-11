import { describe, it, expect, vi, beforeEach } from "vitest";
import packageJson from "../../package.json";
import { getCurrentVersion, checkForUpdate, CACHE_KEY } from "../utils/appVersion";

const GITHUB_URL =
  "https://api.github.com/repos/derekwinters/chores-web-frontend/releases/latest";

describe("appVersion util", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("getCurrentVersion", () => {
    it("returns the build-injected version, matching package.json (not hardcoded)", () => {
      expect(getCurrentVersion()).toBe(packageJson.version);
    });
  });

  describe("checkForUpdate", () => {
    it("fetches the GitHub releases API and reports no update when versions match", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tag_name: `v${packageJson.version}` }),
      });

      const result = await checkForUpdate();

      expect(global.fetch).toHaveBeenCalledWith(
        GITHUB_URL,
        expect.any(Object)
      );
      expect(result.currentVersion).toBe(packageJson.version);
      expect(result.latestVersion).toBe(packageJson.version);
      expect(result.updateAvailable).toBe(false);
    });

    it("strips a leading v from tag_name and reports an update when newer", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tag_name: "v999.0.0" }),
      });

      const result = await checkForUpdate();

      expect(result.latestVersion).toBe("999.0.0");
      expect(result.updateAvailable).toBe(true);
    });

    it("does not report an update when the latest release is older than current", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tag_name: "v0.0.1" }),
      });

      const result = await checkForUpdate();

      expect(result.updateAvailable).toBe(false);
    });

    it("caches the result in localStorage and does not re-fetch within the TTL", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tag_name: "v999.0.0" }),
      });

      await checkForUpdate();
      await checkForUpdate();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem(CACHE_KEY)).toBeTruthy();
    });

    it("re-fetches when force is passed even if cache is fresh", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tag_name: "v999.0.0" }),
      });

      await checkForUpdate();
      await checkForUpdate({ force: true });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("degrades gracefully without throwing when the fetch fails", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("network down"));

      const result = await checkForUpdate();

      expect(result.currentVersion).toBe(packageJson.version);
      expect(result.latestVersion).toBeNull();
      expect(result.updateAvailable).toBe(false);
      expect(result.error).toBe(true);
    });

    it("degrades gracefully when GitHub responds with a non-ok status", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });

      const result = await checkForUpdate();

      expect(result.latestVersion).toBeNull();
      expect(result.updateAvailable).toBe(false);
      expect(result.error).toBe(true);
    });
  });
});
