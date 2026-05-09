import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdminPanel from "../pages/AdminPanel";
import * as client from "../api/client";

vi.mock("../api/client");
vi.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { username: "admin", is_admin: true }, logout: vi.fn() }),
}));

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe("AdminPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getLogRetention.mockResolvedValue({ retention_days: 90 });
    client.getConfig.mockResolvedValue({
      due_soon_days: 3,
      update_check_enabled: false,
      update_check_interval: 12,
    });
    client.getUpdateCheckStatus.mockResolvedValue({
      current_version: "1.0.0",
      latest_version: "1.0.0",
      update_available: false,
      last_checked_at: null,
    });
  });

  it("pre-populates the log retention input with the value from the API response", async () => {
    wrap(<AdminPanel />);
    await waitFor(() => {
      const input = screen.getByLabelText(/keep logs for/i);
      expect(input.value).toBe("90");
    });
  });

  it("does not leave the log retention input empty after data loads", async () => {
    wrap(<AdminPanel />);
    await waitFor(() => {
      const input = screen.getByLabelText(/keep logs for/i);
      expect(input.value).not.toBe("");
    });
  });

  it("pre-populates the due soon threshold input with the value from the API response", async () => {
    wrap(<AdminPanel />);
    await waitFor(() => {
      const input = screen.getByLabelText(/notify when due in/i);
      expect(input.value).toBe("3");
    });
  });

  it("does not leave the due soon threshold input empty after data loads", async () => {
    wrap(<AdminPanel />);
    await waitFor(() => {
      const input = screen.getByLabelText(/notify when due in/i);
      expect(input.value).not.toBe("");
    });
  });

  it("pre-populates update check enabled checkbox from the API response", async () => {
    wrap(<AdminPanel />);
    await waitFor(() => {
      const checkbox = screen.getByLabelText(/enable update checking/i);
      expect(checkbox.checked).toBe(false);
    });
  });

  it("pre-populates update check interval input from the API response", async () => {
    wrap(<AdminPanel />);
    await waitFor(() => {
      const input = screen.getByLabelText(/check interval/i);
      expect(input.value).toBe("12");
    });
  });

  it("reflects different API values when retention_days changes", async () => {
    client.getLogRetention.mockResolvedValue({ retention_days: 30 });
    wrap(<AdminPanel />);
    await waitFor(() => {
      const input = screen.getByLabelText(/keep logs for/i);
      expect(input.value).toBe("30");
    });
  });

  it("reflects different API values when config changes", async () => {
    client.getConfig.mockResolvedValue({
      due_soon_days: 7,
      update_check_enabled: true,
      update_check_interval: 48,
    });
    wrap(<AdminPanel />);
    await waitFor(() => {
      expect(screen.getByLabelText(/notify when due in/i).value).toBe("7");
      expect(screen.getByLabelText(/enable update checking/i).checked).toBe(true);
      expect(screen.getByLabelText(/check interval/i).value).toBe("48");
    });
  });
});
