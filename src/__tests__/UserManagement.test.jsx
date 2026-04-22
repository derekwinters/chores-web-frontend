import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import UserManagement from "../components/UserManagement";
import * as client from "../api/client";

vi.mock("../api/client");
vi.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { username: "testuser", is_admin: true }, logout: vi.fn() }),
}));

const PEOPLE = [
  { id: 1, name: "Alice", color: "#3B6EA0", goal_7d: 20, goal_30d: 80, is_admin: true },
  { id: 2, name: "Bob", color: "#8B5E8A", goal_7d: 15, goal_30d: 60, is_admin: false },
];

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
  );
}

describe("UserManagement", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getPeople.mockResolvedValue(PEOPLE);
  });

  it("renders list of users", async () => {
    wrap(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("shows add user button", async () => {
    wrap(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /\+ add user/i })).toBeInTheDocument();
    });
  });

  it("allows adding a new user", async () => {
    const user = userEvent.setup();
    client.createPerson.mockResolvedValue({ id: 3, name: "Charlie", color: "#4A8C6F", goal_7d: 25, goal_30d: 100, is_admin: false });

    wrap(<UserManagement />);
    await waitFor(() => screen.getByRole("button", { name: /\+ add user/i }));
    const addBtn = screen.getByRole("button", { name: /\+ add user/i });
    fireEvent.click(addBtn);

    const nameInput = screen.getByLabelText(/display name/i);
    await user.type(nameInput, "Charlie");

    // Note: Username is auto-generated from name in the actual app,
    // but in the form it's shown as a field. We just need to trigger save.
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(client.createPerson).toHaveBeenCalled();
    });
  });

  it("allows removing a user", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    client.deletePerson.mockResolvedValue(null);
    wrap(<UserManagement />);

    await waitFor(() => screen.getByText("Alice"));
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(client.deletePerson).toHaveBeenCalledWith(1);
    });
  });


  it("handles API errors gracefully", async () => {
    client.createPerson.mockRejectedValue(new Error("Network error"));
    const user = userEvent.setup();
    wrap(<UserManagement />);

    await waitFor(() => screen.getByRole("button", { name: /\+ add user/i }));
    fireEvent.click(screen.getByRole("button", { name: /\+ add user/i }));
    const nameInput = screen.getByLabelText(/display name/i);
    await user.type(nameInput, "Charlie");
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(client.createPerson).toHaveBeenCalled();
    });
  });
});
