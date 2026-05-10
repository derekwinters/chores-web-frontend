import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DatabaseSection from "../components/DatabaseSection";
import * as client from "../api/client";

vi.mock("../api/client");

const SAMPLE_PAGE = {
  items: [
    { id: 1, person: "alice", points: 10, chore_id: 2, completed_at: "2024-01-15T10:00:00Z" },
    { id: 2, person: "bob", points: 5, chore_id: 3, completed_at: "2024-01-14T09:00:00Z" },
  ],
  total: 2,
  offset: 0,
  limit: 20,
};

const PEOPLE = [
  { id: 1, name: "Alice", username: "alice" },
  { id: 2, name: "Bob", username: "bob" },
];

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <DatabaseSection />
    </QueryClientProvider>
  );
}

describe("DatabaseSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getPeople.mockResolvedValue(PEOPLE);
  });

  // ── Render ──────────────────────────────────────────────────────────────

  it("renders the Points Log heading", () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    wrap();
    expect(screen.getByText("Points Log")).toBeInTheDocument();
  });

  it("shows column headers", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    wrap();
    await waitFor(() => {
      expect(screen.getByText("ID")).toBeInTheDocument();
      expect(screen.getByText("Person")).toBeInTheDocument();
      expect(screen.getByText("Points")).toBeInTheDocument();
      expect(screen.getByText("Chore ID")).toBeInTheDocument();
      expect(screen.getByText("Completed At")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });
  });

  it("renders rows from API response", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    wrap();
    await waitFor(() => {
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(screen.getByText("bob")).toBeInTheDocument();
    });
  });

  it("shows 'No entries found' when list is empty", async () => {
    client.getAdminPointsLog.mockResolvedValue({ items: [], total: 0, offset: 0, limit: 20 });
    wrap();
    await waitFor(() => {
      expect(screen.getByText(/no entries found/i)).toBeInTheDocument();
    });
  });

  it("shows error message when query fails", async () => {
    client.getAdminPointsLog.mockRejectedValue(new Error("network error"));
    wrap();
    await waitFor(() => {
      expect(screen.getByText(/failed to load points log/i)).toBeInTheDocument();
    });
  });

  // ── Pagination ───────────────────────────────────────────────────────────

  it("disables Previous button on first page", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    wrap();
    await waitFor(() => {
      const prev = screen.getByText("Previous");
      expect(prev).toBeDisabled();
    });
  });

  it("disables Next button when on last page", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE); // total=2, limit=20
    wrap();
    await waitFor(() => {
      const next = screen.getByText("Next");
      expect(next).toBeDisabled();
    });
  });

  it("enables Next when more pages exist", async () => {
    client.getAdminPointsLog.mockResolvedValue({
      ...SAMPLE_PAGE,
      total: 25,
    });
    wrap();
    await waitFor(() => {
      const next = screen.getByText("Next");
      expect(next).not.toBeDisabled();
    });
  });

  it("shows pagination count info", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    wrap();
    await waitFor(() => {
      expect(screen.getByText(/showing 1.+2 of 2/i)).toBeInTheDocument();
    });
  });

  // ── Inline edit ──────────────────────────────────────────────────────────

  it("enters edit mode when Edit button is clicked", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    wrap();
    await waitFor(() => screen.getByText("alice"));

    const editBtns = screen.getAllByText("Edit");
    fireEvent.click(editBtns[0]);

    expect(screen.getByLabelText("Edit person")).toBeInTheDocument();
    expect(screen.getByLabelText("Edit points")).toBeInTheDocument();
  });

  it("renders person field as a select (not input) in edit mode", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    wrap();
    await waitFor(() => screen.getByText("alice"));

    fireEvent.click(screen.getAllByText("Edit")[0]);

    await waitFor(() => {
      const personField = screen.getByLabelText("Edit person");
      expect(personField.tagName).toBe("SELECT");
      expect(screen.queryByRole("textbox", { name: /edit person/i })).not.toBeInTheDocument();
    });
  });

  it("person select is populated with people from API", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    wrap();
    await waitFor(() => screen.getByText("alice"));

    fireEvent.click(screen.getAllByText("Edit")[0]);

    await waitFor(() => {
      const select = screen.getByLabelText("Edit person");
      const options = Array.from(select.options);
      expect(options.map((o) => o.value)).toContain("alice");
      expect(options.map((o) => o.value)).toContain("bob");
      expect(options.map((o) => o.text)).toContain("Alice");
      expect(options.map((o) => o.text)).toContain("Bob");
    });
  });

  it("pre-populates edit fields with current values", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    wrap();
    await waitFor(() => screen.getByText("alice"));

    fireEvent.click(screen.getAllByText("Edit")[0]);

    await waitFor(() => {
      expect(screen.getByLabelText("Edit person").value).toBe("alice");
      expect(screen.getByLabelText("Edit points").value).toBe("10");
    });
  });

  it("cancels edit mode when Cancel is clicked", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    wrap();
    await waitFor(() => screen.getByText("alice"));

    fireEvent.click(screen.getAllByText("Edit")[0]);
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.queryByLabelText("Edit person")).not.toBeInTheDocument();
  });

  it("calls updateAdminPointsLog with new values on save", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    client.updateAdminPointsLog.mockResolvedValue({ ...SAMPLE_PAGE.items[0], points: 7 });
    wrap();
    await waitFor(() => screen.getByText("alice"));

    fireEvent.click(screen.getAllByText("Edit")[0]);

    const pointsInput = screen.getByLabelText("Edit points");
    fireEvent.change(pointsInput, { target: { value: "7" } });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(client.updateAdminPointsLog).toHaveBeenCalledWith(1, { points: 7, person: "alice" });
    });
  });

  it("shows error if points field is not a number on save", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    wrap();
    await waitFor(() => screen.getByText("alice"));

    fireEvent.click(screen.getAllByText("Edit")[0]);
    const pointsInput = screen.getByLabelText("Edit points");
    fireEvent.change(pointsInput, { target: { value: "abc" } });

    fireEvent.click(screen.getByText("Save"));

    expect(screen.getByText(/points must be a valid integer/i)).toBeInTheDocument();
  });

  // ── Delete / Modal ───────────────────────────────────────────────────────

  it("opens confirm modal when Delete is clicked", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    wrap();
    await waitFor(() => screen.getByText("alice"));

    fireEvent.click(screen.getAllByText("Delete")[0]);

    expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
    expect(screen.getByText(/delete pointslog entry #1/i)).toBeInTheDocument();
  });

  it("closes modal when Cancel is clicked in delete dialog", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    wrap();
    await waitFor(() => screen.getByText("alice"));

    fireEvent.click(screen.getAllByText("Delete")[0]);
    // Modal has two Cancel buttons (one inside modal actions)
    const cancelBtns = screen.getAllByText("Cancel");
    // click the one in the modal actions area (last one)
    fireEvent.click(cancelBtns[cancelBtns.length - 1]);

    expect(screen.queryByText("Confirm Delete")).not.toBeInTheDocument();
  });

  it("calls deleteAdminPointsLog when confirmed", async () => {
    client.getAdminPointsLog.mockResolvedValue(SAMPLE_PAGE);
    client.deleteAdminPointsLog.mockResolvedValue(null);
    wrap();
    await waitFor(() => screen.getByText("alice"));

    fireEvent.click(screen.getAllByText("Delete")[0]);

    // click the delete confirm button inside modal
    const deleteBtns = screen.getAllByText("Delete");
    // last Delete button is the confirm one inside the modal
    fireEvent.click(deleteBtns[deleteBtns.length - 1]);

    await waitFor(() => {
      expect(client.deleteAdminPointsLog).toHaveBeenCalledWith(1);
    });
  });
});
