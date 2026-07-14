import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Notifications from "../pages/Notifications";
import * as client from "../api/client";

vi.mock("../api/client");

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const ROWS = [
  {
    id: "n3",
    title: "Vacuum is due",
    body: "Your chore Vacuum is due today.",
    created_at: "2026-07-14T10:00:00Z",
    acknowledged_at: null,
    dismissed_at: null,
  },
  {
    id: "n2",
    title: "Trash is due",
    body: "Your chore Trash is due today.",
    created_at: "2026-07-13T10:00:00Z",
    acknowledged_at: "2026-07-13T11:00:00Z",
    dismissed_at: null,
  },
  {
    id: "n1",
    title: "Dishes were due",
    body: "Your chore Dishes was due.",
    created_at: "2026-07-12T10:00:00Z",
    acknowledged_at: "2026-07-12T11:00:00Z",
    dismissed_at: "2026-07-12T12:00:00Z",
  },
];

describe("Notifications log page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getNotifications.mockResolvedValue(ROWS);
    client.ackNotification.mockResolvedValue({
      id: "n3",
      acknowledged_at: "2026-07-14T12:00:00Z",
    });
  });

  it("fetches with include_dismissed=true", async () => {
    wrap(<Notifications />);
    await waitFor(() => {
      expect(client.getNotifications).toHaveBeenCalledWith({
        include_dismissed: true,
      });
    });
  });

  it("renders rows including dismissed ones, with distinguishable states", async () => {
    wrap(<Notifications />);
    await waitFor(() => {
      expect(screen.getByText("Vacuum is due")).toBeInTheDocument();
    });
    // Dismissed row is retained in the log.
    expect(screen.getByText("Dishes were due")).toBeInTheDocument();
    // States are labelled distinctly.
    expect(screen.getByText("Unread")).toBeInTheDocument();
    expect(screen.getByText("Acknowledged")).toBeInTheDocument();
    expect(screen.getByText("Dismissed")).toBeInTheDocument();
  });

  it("only offers an Acknowledge action on unread rows", async () => {
    wrap(<Notifications />);
    await waitFor(() => screen.getByText("Vacuum is due"));
    // Exactly one unread row → one Acknowledge button.
    expect(
      screen.getAllByRole("button", { name: /acknowledge/i })
    ).toHaveLength(1);
  });

  it("acknowledging a row calls ackNotification and refreshes the list", async () => {
    wrap(<Notifications />);
    await waitFor(() => screen.getByText("Vacuum is due"));

    fireEvent.click(screen.getByRole("button", { name: /acknowledge/i }));

    await waitFor(() => {
      expect(client.ackNotification).toHaveBeenCalledWith("n3");
    });
    // Invalidation triggers a refetch of the log query.
    await waitFor(() => {
      expect(client.getNotifications).toHaveBeenCalledTimes(2);
    });
  });

  it("surfaces an error toast when acknowledgement fails", async () => {
    client.ackNotification.mockRejectedValue(new Error("Not found"));
    wrap(<Notifications />);
    await waitFor(() => screen.getByText("Vacuum is due"));

    fireEvent.click(screen.getByRole("button", { name: /acknowledge/i }));

    await waitFor(() => {
      expect(screen.getByText("Not found")).toBeInTheDocument();
    });
  });

  it("shows an empty state when there are no notifications", async () => {
    client.getNotifications.mockResolvedValue([]);
    wrap(<Notifications />);
    await waitFor(() => {
      expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
    });
  });
});
