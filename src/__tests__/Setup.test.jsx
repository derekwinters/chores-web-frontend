import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Setup from "../pages/Setup";
import * as client from "../api/client";

vi.mock("../api/client");

describe("Setup Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders setup form with username and password fields", () => {
    const mockOnSuccess = vi.fn();
    render(<Setup onSetupSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/require authentication/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows create admin account heading", () => {
    const mockOnSuccess = vi.fn();
    render(<Setup onSetupSuccess={mockOnSuccess} />);

    expect(screen.getByText(/create admin account/i)).toBeInTheDocument();
  });

  it("validates password confirmation before submitting", () => {
    const mockOnSuccess = vi.fn();
    client.login.mockResolvedValue({ access_token: "token123" });

    render(<Setup onSetupSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "different" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(client.login).not.toHaveBeenCalled();
  });

  it("submits form when passwords match", async () => {
    const mockOnSuccess = vi.fn();
    client.login.mockResolvedValue({ access_token: "token123", user: { username: "admin", is_admin: true } });
    client.updateConfig.mockResolvedValue({ title: "Family Chores", auth_enabled: true });

    render(<Setup onSetupSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(client.login).toHaveBeenCalledWith("admin", "password123");
      expect(client.updateConfig).toHaveBeenCalledWith({ auth_enabled: true });
    });
  });

  it("calls onSetupSuccess callback on successful setup", async () => {
    const mockOnSuccess = vi.fn();
    client.login.mockResolvedValue({ access_token: "token123", user: { username: "admin", is_admin: true } });
    client.updateConfig.mockResolvedValue({ title: "Family Chores", auth_enabled: true });

    render(<Setup onSetupSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("displays error message on failed setup", async () => {
    const mockOnSuccess = vi.fn();
    client.login.mockRejectedValue(new Error("Setup failed"));

    render(<Setup onSetupSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/setup failed/i)).toBeInTheDocument();
    });
  });

  it("shows loading state while submitting", async () => {
    const mockOnSuccess = vi.fn();
    client.login.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ access_token: "token123" }), 100)));
    client.updateConfig.mockResolvedValue({ title: "Family Chores", auth_enabled: true });

    render(<Setup onSetupSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled();

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("allows toggling auth requirement during setup", () => {
    const mockOnSuccess = vi.fn();
    client.login.mockResolvedValue({ access_token: "token123", user: { username: "admin", is_admin: true } });
    client.updateConfig.mockResolvedValue({ title: "Family Chores", auth_enabled: false });

    render(<Setup onSetupSuccess={mockOnSuccess} />);

    const authCheckbox = screen.getByLabelText(/require authentication/i);
    expect(authCheckbox).toBeChecked();

    fireEvent.click(authCheckbox);
    expect(authCheckbox).not.toBeChecked();
  });
});
