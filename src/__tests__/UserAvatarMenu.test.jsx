import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UserAvatarMenu from "../components/UserAvatarMenu";
import * as auth from "../utils/auth";

vi.mock("../utils/auth");
vi.mock("../api/client", () => ({
  getThemes: vi.fn(() => Promise.resolve([])),
  getCurrentTheme: vi.fn(() => Promise.resolve({ id: "dark", name: "Dark", colors: {} })),
  setTheme: vi.fn(() => Promise.resolve({ colors: {} })),
}));

describe("UserAvatarMenu", () => {
  const mockUser = { name: "Admin", color: "#ff0000" };
  const mockLogout = vi.fn();

  const renderWithQueryClient = (component) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user avatar with initials", () => {
    renderWithQueryClient(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("opens dropdown menu on avatar click", async () => {
    renderWithQueryClient(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);

    const button = screen.getByRole("button", { name: /admin user menu/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });
  });

  it("closes dropdown after logout click", async () => {
    renderWithQueryClient(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);

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
    renderWithQueryClient(<UserAvatarMenu user={mockUser} onLogout={mockLogout} />);

    fireEvent.click(screen.getByRole("button", { name: /admin/i }));

    await waitFor(() => {
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });
  });

  it("displays Settings option for admin users", async () => {
    renderWithQueryClient(<UserAvatarMenu user={mockUser} onLogout={mockLogout} isAdmin={true} />);

    fireEvent.click(screen.getByRole("button", { name: /admin/i }));

    await waitFor(() => {
      expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    });
  });

  it("does not display Settings option for non-admin users", async () => {
    renderWithQueryClient(<UserAvatarMenu user={mockUser} onLogout={mockLogout} isAdmin={false} />);

    fireEvent.click(screen.getByRole("button", { name: /admin/i }));

    await waitFor(() => {
      expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Settings/i)).not.toBeInTheDocument();
  });
});
