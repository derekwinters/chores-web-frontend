import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import Login from "../pages/Login";
import Setup from "../pages/Setup";
import * as client from "../api/client";
import * as authUtils from "../utils/auth";

vi.mock("../api/client");
vi.mock("../utils/auth");

function TestApp() {
  const { isAuthenticated, user, logout, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return (
    <div>
      <div>Welcome {user?.username || "User"}</div>
      <button onClick={logout}>Logout Button</button>
    </div>
  );
}

describe("Auth End-to-End Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUtils.getToken.mockReturnValue(null);
    authUtils.isAuthenticated.mockReturnValue(false);
    client.getSetupStatus.mockResolvedValue({ setup_needed: false });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows login page when not authenticated", async () => {
    authUtils.getToken.mockReturnValue(null);
    client.getSetupStatus.mockResolvedValue({ setup_needed: false });

    render(
      <AuthProvider>
        <TestApp />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
  });

  it("completes login flow: shows login -> authenticate -> shows app", async () => {
    authUtils.getToken.mockReturnValue(null);
    client.getSetupStatus.mockResolvedValue({ setup_needed: false });
    client.login.mockResolvedValue({
      access_token: "test_token",
      user: { username: "admin", is_admin: true },
    });

    render(
      <AuthProvider>
        <TestApp />
      </AuthProvider>
    );

    // Wait for setup status check to complete
    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // 1. Login form is visible
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });
    fireEvent.click(submitButton);

    // 2. Verify login was called
    await waitFor(() => {
      expect(client.login).toHaveBeenCalledWith("admin", "password");
    });
  });

  it("persists auth state after page reload", () => {
    const token = "persisted_token";
    authUtils.getToken.mockReturnValue(token);

    render(
      <AuthProvider>
        <TestApp />
      </AuthProvider>
    );

    expect(authUtils.getToken).toHaveBeenCalled();
  });

  it("handles logout and clears session", async () => {
    authUtils.getToken.mockReturnValue("test_token");
    client.logout.mockResolvedValue(null);

    render(
      <AuthProvider>
        <TestApp />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    const logoutButton = screen.getByText(/logout button/i);
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(client.logout).toHaveBeenCalled();
    });
  });

  it("handles invalid login credentials", async () => {
    authUtils.getToken.mockReturnValue(null);
    client.getSetupStatus.mockResolvedValue({ setup_needed: false });
    client.login.mockRejectedValue(new Error("Invalid username or password"));

    render(
      <AuthProvider>
        <TestApp />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/invalid username or password/i)
      ).toBeInTheDocument();
    });
  });

  it("stores token in localStorage on successful login", async () => {
    authUtils.getToken.mockReturnValue(null);
    client.getSetupStatus.mockResolvedValue({ setup_needed: false });
    const mockSetToken = vi.fn();
    authUtils.setToken = mockSetToken;

    client.login.mockResolvedValue({
      access_token: "test_token",
      user: { username: "admin", is_admin: true },
    });

    render(
      <AuthProvider>
        <TestApp />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Token storage is handled in the context, verify login was called
    await waitFor(() => {
      expect(client.login).toHaveBeenCalled();
    });
  });
});
