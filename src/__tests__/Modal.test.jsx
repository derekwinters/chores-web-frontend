import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Modal from "../components/Modal";

describe("Modal", () => {
  it("renders title and children", () => {
    render(<Modal title="Test Modal" onClose={() => {}}><p>Content here</p></Modal>);
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Content here")).toBeInTheDocument();
  });

  it("calls onClose when ✕ button clicked", () => {
    const onClose = vi.fn();
    render(<Modal title="Test" onClose={onClose}><p>x</p></Modal>);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape key pressed", () => {
    const onClose = vi.fn();
    render(<Modal title="Test" onClose={onClose}><p>x</p></Modal>);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when clicking the overlay", () => {
    const onClose = vi.fn();
    const { container } = render(<Modal title="Test" onClose={onClose}><p>x</p></Modal>);
    const overlay = container.querySelector(".modal-overlay");
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not call onClose when clicking inside the modal", () => {
    const onClose = vi.fn();
    render(<Modal title="Test" onClose={onClose}><p>inner content</p></Modal>);
    fireEvent.click(screen.getByText("inner content"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
