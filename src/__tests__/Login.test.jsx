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

  it("submits form and calls loginWithResetSupport API with credentials", async () => {
    const mockOnSuccess = vi.fn();
    client.loginWithResetSupport.mockResolvedValue({ access_token: "token123", user: { username: "admin", is_admin: true } });

    render(<Login onLoginSuccess={mockOnSuccess} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(client.loginWithResetSupport).toHaveBeenCalledWith("admin", "password123");
    });
  });

  it("calls onLoginSuccess callback on successful login", async () => {
    const mockOnSuccess = vi.fn();
    client.loginWithResetSupport.mockResolvedValue({ access_token: "token123", user: { username: "admin", is_admin: true } });

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
    client.loginWithResetSupport.mockRejectedValue(new Error("Invalid credentials"));

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
    client.loginWithResetSupport.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ access_token: "token123", user: { username: "admin", is_admin: true } }), 100)));

    render(<Login onLoginSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("shows password reset form when server requires password reset", async () => {
    const mockOnSuccess = vi.fn();
    client.loginWithResetSupport.mockResolvedValue({ requiresReset: true, resetToken: "reset-token-abc" });

    render(<Login onLoginSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "oldpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /set new password/i })).toBeInTheDocument();
    });
  });

  it("completes password reset flow successfully", async () => {
    const mockOnSuccess = vi.fn();
    client.loginWithResetSupport.mockResolvedValue({ requiresReset: true, resetToken: "reset-token-abc" });
    client.resetPassword.mockResolvedValue({ access_token: "new-token", user: { username: "admin", is_admin: false } });

    render(<Login onLoginSuccess={mockOnSuccess} />);

    // First: log in to trigger reset mode
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "oldpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Wait for reset form to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    // Enter new passwords
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "newpassword1" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "newpassword1" } });
    fireEvent.click(screen.getByRole("button", { name: /set new password/i }));

    await waitFor(() => {
      expect(client.resetPassword).toHaveBeenCalledWith("reset-token-abc", "newpassword1");
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("shows error when reset passwords do not match", async () => {
    const mockOnSuccess = vi.fn();
    client.loginWithResetSupport.mockResolvedValue({ requiresReset: true, resetToken: "reset-token-abc" });

    render(<Login onLoginSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "oldpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "newpassword1" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "different" } });
    fireEvent.click(screen.getByRole("button", { name: /set new password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("has accessible labels for all form fields", () => {
    const mockOnSuccess = vi.fn();
    render(<Login onLoginSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
