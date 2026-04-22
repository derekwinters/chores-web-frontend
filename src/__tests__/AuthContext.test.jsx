import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import * as authUtils from "../utils/auth";
import * as client from "../api/client";

vi.mock("../utils/auth");
vi.mock("../api/client");

function TestComponent() {
  const { isAuthenticated, setupNeeded, user, loading } = useAuth();
  return (
    <div>
      <div>{loading ? "Loading..." : "Loaded"}</div>
      <div>{isAuthenticated ? "Authenticated" : "Not authenticated"}</div>
      <div>{setupNeeded ? "Setup needed" : "Setup not needed"}</div>
      {user && <div>{user.username}</div>}
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provides auth context with default values", async () => {
    authUtils.getToken.mockReturnValue(null);
    client.getSetupStatus.mockResolvedValue({ setup_needed: false });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Not authenticated")).toBeInTheDocument();
    });
  });

  it("checks setup status when no token exists", async () => {
    authUtils.getToken.mockReturnValue(null);
    client.getSetupStatus.mockResolvedValue({ setup_needed: true });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(client.getSetupStatus).toHaveBeenCalled();
      expect(screen.getByText("Setup needed")).toBeInTheDocument();
    });
  });

  it("does not check setup status when token exists", async () => {
    authUtils.getToken.mockReturnValue("valid_token");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Authenticated")).toBeInTheDocument();
    });

    expect(client.getSetupStatus).not.toHaveBeenCalled();
  });

  it("handles setup status check failure gracefully", async () => {
    authUtils.getToken.mockReturnValue(null);
    client.getSetupStatus.mockRejectedValue(new Error("API error"));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Setup not needed")).toBeInTheDocument();
    });
  });
});
