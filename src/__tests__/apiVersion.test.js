import { describe, it, expect } from "vitest";
import { EXPECTED_API_MAJOR, parseApiMajor } from "../config/apiVersion";

describe("apiVersion config", () => {
  it("EXPECTED_API_MAJOR matches the /api/v1 base the client is built against", () => {
    expect(EXPECTED_API_MAJOR).toBe(1);
  });

  it("parses the backend's 'vN' api_version shape", () => {
    expect(parseApiMajor("v1")).toBe(1);
    expect(parseApiMajor("v2")).toBe(2);
    expect(parseApiMajor("v13")).toBe(13);
  });

  it("tolerates bare and dotted version strings", () => {
    expect(parseApiMajor("1")).toBe(1);
    expect(parseApiMajor("2.4.0")).toBe(2);
  });

  it("returns null for missing or unparseable values", () => {
    expect(parseApiMajor(null)).toBeNull();
    expect(parseApiMajor(undefined)).toBeNull();
    expect(parseApiMajor("")).toBeNull();
    expect(parseApiMajor("latest")).toBeNull();
  });
});
