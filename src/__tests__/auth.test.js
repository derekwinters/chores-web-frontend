import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setToken, getToken, clearToken, isAuthenticated } from "../utils/auth";

describe("JWT Token Storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("stores token in localStorage", () => {
    const token = "test_token_123";
    setToken(token);

    expect(localStorage.getItem("auth_token")).toBe(token);
  });

  it("retrieves token from localStorage", () => {
    const token = "test_token_456";
    setToken(token);

    const retrieved = getToken();
    expect(retrieved).toBe(token);
  });

  it("returns null when no token exists", () => {
    const token = getToken();
    expect(token).toBeNull();
  });

  it("clears token from localStorage", () => {
    setToken("test_token");
    expect(getToken()).toBe("test_token");

    clearToken();
    expect(getToken()).toBeNull();
  });

  it("isAuthenticated returns true when token exists", () => {
    setToken("test_token");
    expect(isAuthenticated()).toBe(true);
  });

  it("isAuthenticated returns false when no token", () => {
    expect(isAuthenticated()).toBe(false);
  });
});
