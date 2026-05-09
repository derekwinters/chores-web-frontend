import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdminPanel from "../pages/AdminPanel";

vi.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { username: "admin", is_admin: true }, logout: vi.fn() }),
}));

describe("AdminPanel", () => {
  it("redirects to /settings/general", () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/settings/general" element={<div>Settings General Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Settings General Page")).toBeInTheDocument();
  });
});
