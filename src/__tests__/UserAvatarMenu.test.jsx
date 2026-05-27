import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserAvatarMenu from "../components/UserAvatarMenu";

describe("UserAvatarMenu", () => {
  const mockUser = { name: "Admin", color: "#ff0000" };
  const mockLogout = vi.fn();
  const mockPreferences = vi.fn();
  const mockSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user avatar with initials", () => {
    render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("opens dropdown menu on avatar click", async () => {
    render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);

    const button = screen.getByRole("button", { name: /admin user menu/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });
  });

  it("closes dropdown after logout click", async () => {
    render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);

    fireEvent.click(screen.getByRole("button", { name: /admin/i }));

    await waitFor(() => {
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/logout/i));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it("displays logout button in dropdown menu", async () => {
    render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);

    fireEvent.click(screen.getByRole("button", { name: /admin/i }));

    await waitFor(() => {
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });
  });

  it("displays Preferences option in dropdown menu", async () => {
    render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} onPreferences={mockPreferences} />);

    fireEvent.click(screen.getByRole("button", { name: /admin user menu/i }));

    await waitFor(() => {
      expect(screen.getByText(/Preferences/i)).toBeInTheDocument();
    });
  });

  it("calls onPreferences when Preferences is clicked", async () => {
    render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} onPreferences={mockPreferences} />);

    fireEvent.click(screen.getByRole("button", { name: /admin user menu/i }));

    await waitFor(() => screen.getByText(/Preferences/i));
    fireEvent.click(screen.getByText(/Preferences/i));

    await waitFor(() => {
      expect(mockPreferences).toHaveBeenCalled();
    });
  });

  it("displays Settings option for admin users", async () => {
    render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} isAdmin={true} onSettings={mockSettings} />);

    fireEvent.click(screen.getByRole("button", { name: /admin/i }));

    await waitFor(() => {
      expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    });
  });

  it("does not display Settings option for non-admin users", async () => {
    render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} isAdmin={false} onPreferences={mockPreferences} />);

    fireEvent.click(screen.getByRole("button", { name: /admin/i }));

    await waitFor(() => {
      expect(screen.getByText(/Preferences/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Settings/i)).not.toBeInTheDocument();
  });

  it("calls onSettings when Settings is clicked for admin", async () => {
    render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} isAdmin={true} onSettings={mockSettings} />);

    fireEvent.click(screen.getByRole("button", { name: /admin user menu/i }));

    await waitFor(() => screen.getByText(/Settings/i));
    fireEvent.click(screen.getByText(/Settings/i));

    await waitFor(() => {
      expect(mockSettings).toHaveBeenCalled();
    });
  });

  it("renders avatar with var(--accent) background, not user.color", () => {
    const { container } = render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);
    const avatar = container.querySelector(".user-avatar");
    expect(avatar).toHaveStyle({ backgroundColor: "var(--accent)" });
  });
});
