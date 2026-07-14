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

  it("completeChore calls POST /chores/:id/complete", async () => {
    mockOk({ state: "complete" });
    const { completeChore } = await import("../api/client");
    await completeChore("vacuum");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/chores/vacuum/complete"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({}),
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

  it("createPerson never sends color in request body", async () => {
    mockOk({ id: 1, name: "Alice", username: "alice" });
    const { createPerson } = await import("../api/client");
    // Call with a color value to prove the function ignores it entirely
    await createPerson("Alice", "password123", "#ff0000");
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body).not.toHaveProperty("color");
  });

  it("getBackendVersion calls GET /version (unversioned root path)", async () => {
    mockOk({ version: "2.2.0", latest_version: null, update_available: false, checked_at: null });
    const { getBackendVersion } = await import("../api/client");
    const result = await getBackendVersion();
    expect(result.version).toBe("2.2.0");
    expect(mockFetch).toHaveBeenCalledWith("/version");
  });

  it("getBackendVersion throws on a non-ok response so callers can degrade gracefully", async () => {
    mockError("Not Found", 404);
    const { getBackendVersion } = await import("../api/client");
    await expect(getBackendVersion()).rejects.toThrow();
  });

  it("getNotifications calls GET /notifications with no query string when no filters", async () => {
    mockOk([]);
    const { getNotifications } = await import("../api/client");
    const result = await getNotifications();
    expect(result).toEqual([]);
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("/notifications");
    expect(url).not.toContain("?");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("getNotifications appends since and include_dismissed only when provided", async () => {
    mockOk([]);
    const { getNotifications } = await import("../api/client");
    await getNotifications({ since: "2026-07-14T00:00:00Z", include_dismissed: true });
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("since=2026-07-14T00%3A00%3A00Z");
    expect(url).toContain("include_dismissed=true");
  });

  it("getNotifications appends include_dismissed=false when explicitly provided", async () => {
    mockOk([]);
    const { getNotifications } = await import("../api/client");
    await getNotifications({ include_dismissed: false });
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("include_dismissed=false");
    expect(url).not.toContain("since=");
  });

  it("ackNotification calls POST /notifications/:id/ack", async () => {
    mockOk({ id: "n1", acknowledged_at: "2026-07-14T00:00:00Z" });
    const { ackNotification } = await import("../api/client");
    const result = await ackNotification("n1");
    expect(result.id).toBe("n1");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/notifications/n1/ack"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("ackNotification surfaces backend errors (404 for another person's notification)", async () => {
    mockError("Not found", 404);
    const { ackNotification } = await import("../api/client");
    await expect(ackNotification("nope")).rejects.toThrow("Not found");
  });

  it("getNotificationPreferences calls GET /notifications/preferences and returns the map", async () => {
    mockOk({ chore_due: true });
    const { getNotificationPreferences } = await import("../api/client");
    const result = await getNotificationPreferences();
    expect(result).toEqual({ chore_due: true });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/notifications/preferences"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("putNotificationPreferences calls PUT /notifications/preferences with the map body", async () => {
    mockOk({ chore_due: false });
    const { putNotificationPreferences } = await import("../api/client");
    const result = await putNotificationPreferences({ chore_due: false });
    expect(result).toEqual({ chore_due: false });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/notifications/preferences"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ chore_due: false }),
      })
    );
  });
});
