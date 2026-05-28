import "@testing-library/jest-dom";
import { vi, afterEach, beforeEach } from "vitest";

// Mock window.matchMedia — jsdom does not implement it.
// Default: matches = false (desktop viewport). Tests that need mobile override this.
// Uses a plain function (not vi.fn) so vi.resetAllMocks() in test suites cannot break it.
// Individual tests that need to intercept the change listener should override window.matchMedia
// directly with their own vi.fn() mock before rendering.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: function matchMedia(_query) {
    return {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  },
});

// Mock fetch for /status/db-status to simulate ready database
const mockFetch = vi.fn((url) => {
  if (typeof url === "string" && url.includes("/status/db-status")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ status: "ready", migrations_in_progress: false }),
    });
  }
  // For other requests, return a rejected promise (tests will handle actual API mocking via mocked client)
  return Promise.reject(new Error(`Fetch not mocked for: ${url}`));
});

global.fetch = mockFetch;

// Reset mocks after each test
afterEach(() => {
  mockFetch.mockClear();
});
