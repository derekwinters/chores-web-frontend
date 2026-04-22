import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../pages/Login";
import * as client from "../api/client";

vi.mock("../api/client");

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with username and password fields", () => {
    const mockOnSuccess = vi.fn();
    render(<Login onLoginSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("submits form and calls login API with credentials", async () => {
    const mockOnSuccess = vi.fn();
    client.login.mockResolvedValue({ access_token: "token123", user: { username: "admin", is_admin: true } });

    render(<Login onLoginSuccess={mockOnSuccess} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(client.login).toHaveBeenCalledWith("admin", "password123");
    });
  });

  it("calls onLoginSuccess callback on successful login", async () => {
    const mockOnSuccess = vi.fn();
    client.login.mockResolvedValue({ access_token: "token123", user: { username: "admin", is_admin: true } });

    render(<Login onLoginSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("displays error message on failed login", async () => {
    const mockOnSuccess = vi.fn();
    client.login.mockRejectedValue(new Error("Invalid credentials"));

    render(<Login onLoginSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("shows loading state while submitting", async () => {
    const mockOnSuccess = vi.fn();
    client.login.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ access_token: "token123" }), 100)));

    render(<Login onLoginSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("has accessible labels for all form fields", () => {
    const mockOnSuccess = vi.fn();
    render(<Login onLoginSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
