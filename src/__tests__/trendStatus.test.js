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
    it("returns success CSS variable for ahead status", () => {
      expect(getTrendColor("ahead")).toBe("var(--success)");
    });

    it("returns warning CSS variable for on-track status", () => {
      expect(getTrendColor("on-track")).toBe("var(--warning)");
    });

    it("returns error CSS variable for behind status", () => {
      expect(getTrendColor("behind")).toBe("var(--error)");
    });

    it("returns text CSS variable for unknown status", () => {
      expect(getTrendColor("unknown")).toBe("var(--text)");
      expect(getTrendColor(undefined)).toBe("var(--text)");
    });

    it("returns different CSS variables for different statuses", () => {
      const ahead = getTrendColor("ahead");
      const onTrack = getTrendColor("on-track");
      const behind = getTrendColor("behind");

      expect(ahead).not.toBe(onTrack);
      expect(onTrack).not.toBe(behind);
      expect(ahead).not.toBe(behind);
    });
  });
});
