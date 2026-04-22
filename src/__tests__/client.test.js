import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Reset modules so VITE_API_URL env var is fresh for each test
beforeEach(() => {
  vi.resetModules();
  mockFetch.mockReset();
});

function mockOk(data, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status,
    json: () => Promise.resolve(data),
  });
}

function mockError(detail, status = 400) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ detail }),
  });
}

describe("API client", () => {
  it("getChores calls GET /chores", async () => {
    mockOk([]);
    const { getChores } = await import("../api/client");
    const result = await getChores();
    expect(result).toEqual([]);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/chores"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("completeChore calls POST /chores/:id/complete with body", async () => {
    mockOk({ state: "complete" });
    const { completeChore } = await import("../api/client");
    await completeChore("vacuum", "Alice");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/chores/vacuum/complete"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ completed_by: "Alice" }),
      })
    );
  });

  it("throws on non-ok response", async () => {
    mockError("Chore not found", 404);
    const { getChores } = await import("../api/client");
    await expect(getChores()).rejects.toThrow("Chore not found");
  });

  it("deleteChore returns null on 204", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    const { deleteChore } = await import("../api/client");
    const result = await deleteChore("vacuum");
    expect(result).toBeNull();
  });

  it("getPeople calls GET /people", async () => {
    mockOk([{ id: 1, name: "Alice" }]);
    const { getPeople } = await import("../api/client");
    const result = await getPeople();
    expect(result[0].name).toBe("Alice");
  });

  it("getLeaderboard calls GET /points", async () => {
    mockOk([{ person: "Alice", total_points: 10 }]);
    const { getLeaderboard } = await import("../api/client");
    const result = await getLeaderboard();
    expect(result[0].person).toBe("Alice");
  });
});
