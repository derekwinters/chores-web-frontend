// Iteration 2 of the design-token rollout (derekwinters/chores-web-docs#11,
// this repo's #22): the CSS custom-property layer comes from
// @derekwinters/design-tokens; the runtime theme override keeps working.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import themes from "@derekwinters/design-tokens/themes.json";
import { color } from "@derekwinters/design-tokens";
import { DEFAULT_THEME_COLORS, applyTheme } from "../utils/theme";

const read = (rel) => readFileSync(`${process.cwd()}/src/${rel}`, "utf8");

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

  it("keeps only the documented legacy vars as literals (removed in Iteration 4)", () => {
    // --border and --accent-btn intentionally stay literal for visual parity
    expect(css).toMatch(/--border:\s*#2c3f58/);
    expect(css).toMatch(/--accent-btn:\s*#3574B3/i);
    expect(css).toMatch(/--shadow:/);
    expect(css).toMatch(/--shadow-lg:/);
    // aliases bind legacy names to token vars
    expect(css).toMatch(/--gold:\s*var\(--points\)/);
    expect(css).toMatch(/--radius:\s*var\(--radius-md\)/);
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
