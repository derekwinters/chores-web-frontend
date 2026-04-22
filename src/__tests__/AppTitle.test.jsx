import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "../App";
import { AuthProvider } from "../contexts/AuthContext";
import * as client from "../api/client";
import * as auth from "../utils/auth";

vi.mock("../api/client");
vi.mock("../utils/auth");

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <AuthProvider>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </AuthProvider>
  );
}

describe("App Title", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getToken.mockReturnValue("fake-token");
    auth.setToken.mockImplementation(() => {});
    auth.clearToken.mockImplementation(() => {});
    auth.isAuthenticated.mockReturnValue(true);
    client.getChores.mockResolvedValue([]);
    client.getPeople.mockResolvedValue([]);
    client.getPointsSummary.mockResolvedValue([]);
    client.getConfig.mockResolvedValue({ title: "Family Chores" });
    client.getSetupStatus.mockResolvedValue({ setup_needed: false });
    localStorage.clear();
  });

  it("displays default app title", () => {
    wrap(<App />);
    expect(screen.getByText("Family Chores")).toBeInTheDocument();
  });

  it("fetches app title from config", async () => {
    client.getConfig.mockResolvedValue({ title: "Custom Title" });
    wrap(<App />);
    await waitFor(() => {
      expect(client.getConfig).toHaveBeenCalled();
    });
  });

  it("shows title edit field in settings", async () => {
    wrap(<App />);
    fireEvent.click(screen.getByText("Settings").closest("button"));
    await waitFor(() => {
      expect(screen.getByLabelText(/app title|page title/i)).toBeInTheDocument();
    });
  });

  it("allows editing the app title", async () => {
    const user = userEvent.setup();
    client.updateConfig.mockResolvedValue({ title: "My Chores" });
    wrap(<App />);

    fireEvent.click(screen.getByText("Settings").closest("button"));
    await waitFor(() => screen.getByLabelText(/app title|page title/i));

    const input = screen.getByLabelText(/app title|page title/i);
    await user.clear(input);
    await user.type(input, "My Chores");

    fireEvent.click(screen.getByRole("button", { name: /save|update/i }));

    await waitFor(() => {
      expect(client.updateConfig).toHaveBeenCalledWith(expect.objectContaining({ title: "My Chores" }));
    });
  });

  it("updates displayed title after save", async () => {
    const user = userEvent.setup();
    client.updateConfig.mockResolvedValue({ title: "My Chores" });
    wrap(<App />);

    fireEvent.click(screen.getByText("Settings").closest("button"));
    await waitFor(() => screen.getByLabelText(/app title|page title/i));

    const input = screen.getByLabelText(/app title|page title/i);
    await user.clear(input);
    await user.type(input, "My Chores");

    fireEvent.click(screen.getByRole("button", { name: /save|update/i }));

    await waitFor(() => {
      expect(screen.getByText("My Chores")).toBeInTheDocument();
    });
  });

  it("persists title across page navigation", async () => {
    client.getConfig.mockResolvedValue({ title: "Persistent Title" });
    wrap(<App />);

    await waitFor(() => expect(screen.getByText("Persistent Title")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Board").closest("button"));
    expect(screen.getByText("Persistent Title")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Settings").closest("button"));
    expect(screen.getByText("Persistent Title")).toBeInTheDocument();
  });
});
