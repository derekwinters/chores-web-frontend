import "@testing-library/jest-dom";
import { vi, afterEach } from "vitest";

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
