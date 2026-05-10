import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import SettingsData from "../pages/SettingsData";
import * as client from "../api/client";

vi.mock("../api/client");
vi.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { username: "admin", is_admin: true }, logout: vi.fn() }),
}));

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SettingsData />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SettingsData", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getLogRetention.mockResolvedValue({ retention_days: 90 });
    client.exportConfig.mockResolvedValue({ data: [] });
    client.importConfig.mockResolvedValue({});
  });

  it("renders the Export & Import section heading", () => {
    wrap();
    // Use getAllByText since ExportImport component also renders "Export Data" heading
    expect(screen.getAllByText(/export/i).length).toBeGreaterThan(0);
  });

  it("renders the Log Retention section heading", () => {
    wrap();
    expect(screen.getByText("Log Retention")).toBeInTheDocument();
  });

  it("pre-populates the log retention input from the API response", async () => {
    wrap();
    await waitFor(() => {
      const input = screen.getByLabelText(/keep logs for/i);
      expect(input.value).toBe("90");
    });
  });

  it("does not leave the log retention input empty after data loads", async () => {
    wrap();
    await waitFor(() => {
      const input = screen.getByLabelText(/keep logs for/i);
      expect(input.value).not.toBe("");
    });
  });

  it("reflects different API values when retention_days changes", async () => {
    client.getLogRetention.mockResolvedValue({ retention_days: 30 });
    wrap();
    await waitFor(() => {
      const input = screen.getByLabelText(/keep logs for/i);
      expect(input.value).toBe("30");
    });
  });

  it("renders the Data Management section heading", () => {
    wrap();
    expect(screen.getByText("Data Management")).toBeInTheDocument();
  });

  it("renders the Data Management section description", () => {
    wrap();
    expect(
      screen.getByText(/directly modify or remove records in specific database tables/i)
    ).toBeInTheDocument();
  });

  it("renders a Points Log link in the Data Management section", () => {
    wrap();
    const link = screen.getByRole("link", { name: /points log/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/settings/data/pointslog");
  });

  it("renders the Points Log entry description inline", () => {
    wrap();
    expect(
      screen.getByText(/modify or remove records for recently completed chores/i)
    ).toBeInTheDocument();
  });
});
