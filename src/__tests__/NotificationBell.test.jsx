import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";

describe("NotificationBell", () => {
  it("shows the unread count in the badge", () => {
    render(<NotificationBell unreadCount={3} onClick={() => {}} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /3 unread/i })
    ).toBeInTheDocument();
  });

  it("renders a two-digit count", () => {
    render(<NotificationBell unreadCount={12} onClick={() => {}} />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("hides the badge when there is nothing unread", () => {
    render(<NotificationBell unreadCount={0} onClick={() => {}} />);
    // No numeric badge text, and the label drops the "unread" suffix.
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Notifications" });
    expect(button).toBeInTheDocument();
    expect(button.querySelector(".notification-bell-badge")).toBeNull();
  });

  it("fires onClick when clicked", () => {
    const onClick = vi.fn();
    render(<NotificationBell unreadCount={1} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("navigates to /notifications when wired to useNavigate (as AppContent does)", () => {
    function BellHarness() {
      const navigate = useNavigate();
      return (
        <NotificationBell
          unreadCount={2}
          onClick={() => navigate("/notifications")}
        />
      );
    }

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<BellHarness />} />
          <Route path="/notifications" element={<div>Notifications Log</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText("Notifications Log")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /2 unread/i }));
    expect(screen.getByText("Notifications Log")).toBeInTheDocument();
  });
});
