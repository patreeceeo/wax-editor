import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BlockPalette } from "./BlockPalette";

describe("BlockPalette", () => {
  const mockBlocks = [
    {
      id: "test-1",
      type: "test",
      label: "Test Block",
      description: "A test block",
    },
    { id: "test-2", type: "test2", label: "Another Block" },
  ];

  it("should render a palette with available block types", () => {
    render(<BlockPalette />);

    expect(screen.getByTestId("block-palette")).toBeInTheDocument();
    expect(screen.getByText("Blocks")).toBeInTheDocument();
    expect(screen.getByText("Literal")).toBeInTheDocument();
    expect(screen.getByText("Variable")).toBeInTheDocument();
    expect(screen.getByText("Assignment")).toBeInTheDocument();
    expect(screen.getByText("A literal value")).toBeInTheDocument();
    expect(screen.getByText("A variable reference")).toBeInTheDocument();
    expect(
      screen.getByText("Assign a value to a variable"),
    ).toBeInTheDocument();
  });

  it("should render with custom blocks", () => {
    render(<BlockPalette blocks={mockBlocks} />);

    expect(screen.getByText("Test Block")).toBeInTheDocument();
    expect(screen.getByText("Another Block")).toBeInTheDocument();
    expect(screen.getByText("A test block")).toBeInTheDocument();
  });

  it("should render with custom title", () => {
    render(<BlockPalette title="Custom Palette" />);

    expect(screen.getByText("Custom Palette")).toBeInTheDocument();
  });

  it("should call onBlockSelect when block is clicked", () => {
    const onBlockSelect = vi.fn();
    render(<BlockPalette blocks={mockBlocks} onBlockSelect={onBlockSelect} />);

    fireEvent.click(screen.getByText("Test Block"));
    expect(onBlockSelect).toHaveBeenCalledWith(mockBlocks[0]);
  });

  it("should apply custom className", () => {
    render(<BlockPalette className="custom-class" />);

    const palette = screen.getByTestId("block-palette");
    expect(palette).toHaveClass("custom-class");
  });
});
