import { describe, it, expect } from "vitest";
import { getTrendStatus, getTrendColor } from "../utils/trendStatus";

describe("trendStatus", () => {
  describe("getTrendStatus", () => {
    it("returns 'ahead' when points/goal > 0.8", () => {
      expect(getTrendStatus(20, 20)).toBe("ahead");
      expect(getTrendStatus(25, 30)).toBe("ahead");
      expect(getTrendStatus(16, 20)).toBe("ahead");
    });

    it("returns 'behind' when points/goal < 0.5", () => {
      expect(getTrendStatus(5, 20)).toBe("behind");
      expect(getTrendStatus(9, 20)).toBe("behind");
      expect(getTrendStatus(0, 20)).toBe("behind");
    });

    it("returns 'on-track' when points/goal is between 0.5 and 0.8", () => {
      expect(getTrendStatus(10, 20)).toBe("on-track");
      expect(getTrendStatus(14, 20)).toBe("on-track");
      expect(getTrendStatus(12, 20)).toBe("on-track");
    });

    it("handles zero goal", () => {
      expect(getTrendStatus(0, 0)).toBe("ahead");
      expect(getTrendStatus(5, 0)).toBe("ahead");
    });
  });

  describe("getTrendColor", () => {
    it("returns green for ahead status", () => {
      const color = getTrendColor("ahead");
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("returns yellow for on-track status", () => {
      const color = getTrendColor("on-track");
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("returns red for behind status", () => {
      const color = getTrendColor("behind");
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("returns different colors for different statuses", () => {
      const ahead = getTrendColor("ahead");
      const onTrack = getTrendColor("on-track");
      const behind = getTrendColor("behind");

      expect(ahead).not.toBe(onTrack);
      expect(onTrack).not.toBe(behind);
      expect(ahead).not.toBe(behind);
    });
  });
});
