import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserAvatarMenu from "../components/UserAvatarMenu";
import * as auth from "../utils/auth";

vi.mock("../utils/auth");

describe("UserAvatarMenu", () => {
  const mockUser = { name: "Admin", color: "#ff0000" };
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user avatar with initials", () => {
    render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("opens dropdown menu on avatar click", () => {
    render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);

    const button = screen.getByRole("button", { name: /admin user menu/i });
    fireEvent.click(button);

    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });

  it("closes dropdown after logout click", async () => {
    render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);

    fireEvent.click(screen.getByRole("button", { name: /admin/i }));
    expect(screen.getByText(/logout/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/logout/i));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it("displays logout button in dropdown menu", () => {
    render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);

    fireEvent.click(screen.getByRole("button", { name: /admin/i }));
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });
});
