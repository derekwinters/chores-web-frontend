import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NotificationPreferences from "../components/NotificationPreferences";

const noop = () => {};

describe("NotificationPreferences", () => {
  it("renders one toggle row per preference key plus a global toggle", () => {
    render(
      <NotificationPreferences
        preferences={{ chore_due: true }}
        onToggle={noop}
        onToggleAll={noop}
      />
    );
    expect(
      screen.getByRole("switch", { name: /enable notifications/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /chore due/i })).toBeInTheDocument();
    // global toggle + one per-type toggle
    expect(screen.getAllByRole("switch")).toHaveLength(2);
  });

  it("derives rows from the map keys (unknown types render humanized)", () => {
    render(
      <NotificationPreferences
        preferences={{ chore_due: true, weekly_summary: false }}
        onToggle={noop}
        onToggleAll={noop}
      />
    );
    expect(screen.getByRole("switch", { name: /chore due/i })).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: /weekly summary/i })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("switch")).toHaveLength(3);
  });

  it("global toggle is on iff every type is enabled", () => {
    const { rerender } = render(
      <NotificationPreferences
        preferences={{ chore_due: true }}
        onToggle={noop}
        onToggleAll={noop}
      />
    );
    expect(
      screen.getByRole("switch", { name: /enable notifications/i })
    ).toBeChecked();

    rerender(
      <NotificationPreferences
        preferences={{ chore_due: false }}
        onToggle={noop}
        onToggleAll={noop}
      />
    );
    expect(
      screen.getByRole("switch", { name: /enable notifications/i })
    ).not.toBeChecked();
  });

  it("fires onToggle(type, enabled) when a per-type row is toggled", () => {
    const onToggle = vi.fn();
    render(
      <NotificationPreferences
        preferences={{ chore_due: false }}
        onToggle={onToggle}
        onToggleAll={noop}
      />
    );
    fireEvent.click(screen.getByRole("switch", { name: /chore due/i }));
    expect(onToggle).toHaveBeenCalledWith("chore_due", true);
  });

  it("fires onToggleAll(enabled) when the global toggle is clicked", () => {
    const onToggleAll = vi.fn();
    render(
      <NotificationPreferences
        preferences={{ chore_due: true }}
        onToggle={noop}
        onToggleAll={onToggleAll}
      />
    );
    fireEvent.click(screen.getByRole("switch", { name: /enable notifications/i }));
    expect(onToggleAll).toHaveBeenCalledWith(false);
  });

  it("respects the disabled prop on every control", () => {
    render(
      <NotificationPreferences
        preferences={{ chore_due: true }}
        onToggle={noop}
        onToggleAll={noop}
        disabled
      />
    );
    screen
      .getAllByRole("switch")
      .forEach((el) => expect(el).toBeDisabled());
  });
});
