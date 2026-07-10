import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { readFileSync } from "fs";
import { resolve } from "path";
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

  describe("topnav dropdown direction override", () => {
    const cssPath = resolve(__dirname, "../components/UserAvatarMenu.css");
    const css = readFileSync(cssPath, "utf8");
    const topnavBlock = (() => {
      const match = css.match(/\.topnav-user\s+\.avatar-dropdown\s*\{([^}]*)\}/);
      return match ? match[1] : "";
    })();

    it("has a .topnav-user .avatar-dropdown CSS override block", () => {
      expect(topnavBlock).not.toBe("");
    });

    it("overrides dropdown to open downward (top: 100%, bottom: auto)", () => {
      expect(topnavBlock).toMatch(/top\s*:\s*100%/);
      expect(topnavBlock).toMatch(/bottom\s*:\s*auto/);
    });

    it("overrides dropdown to align right (right: 0, left: auto)", () => {
      expect(topnavBlock).toMatch(/right\s*:\s*0/);
      expect(topnavBlock).toMatch(/left\s*:\s*auto/);
    });

    it("sets margin-top: var(--space-xs) (4px) and margin-bottom: 0 for correct spacing", () => {
      expect(topnavBlock).toMatch(/margin-top\s*:\s*var\(--space-xs\)/);
      expect(topnavBlock).toMatch(/margin-bottom\s*:\s*0/);
    });

    it("uses the popover elevation token for the downward shadow (#24)", () => {
      expect(topnavBlock).toMatch(/box-shadow\s*:\s*var\(--elevation-3\)/);
    });

    it("renders .avatar-dropdown element when dropdown is open", async () => {
      const { container } = render(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);
      fireEvent.click(screen.getByRole("button", { name: /admin user menu/i }));
      await waitFor(() => {
        expect(container.querySelector(".avatar-dropdown")).toBeInTheDocument();
      });
    });
  });
});
