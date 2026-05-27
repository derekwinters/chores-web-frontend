import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Avatar from "../components/Avatar";

describe("Avatar", () => {
  it("renders with var(--accent) as background color", () => {
    const { container } = render(<Avatar name="Alice" />);
    const div = container.firstChild;
    expect(div).toHaveStyle({ background: "var(--accent)" });
  });

  it("ignores color prop and always uses var(--accent)", () => {
    const { container } = render(<Avatar name="Alice" color="#ff0000" />);
    const div = container.firstChild;
    expect(div).toHaveStyle({ background: "var(--accent)" });
  });

  it("renders first character of name as initial", () => {
    render(<Avatar name="Bob" />);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("renders ? when name is empty", () => {
    render(<Avatar name="" />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("renders ? when name is undefined", () => {
    render(<Avatar />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("renders initial as uppercase", () => {
    render(<Avatar name="alice" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
