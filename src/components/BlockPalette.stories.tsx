import type { Meta, StoryObj } from "@storybook/react";
import { BlockPalette } from "./BlockPalette";

const meta = {
  title: "Components/BlockPalette",
  component: BlockPalette,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    blocks: {
      description: "Array of blocks to display in the palette",
      control: "object",
    },
    className: {
      description: "Additional CSS classes to apply",
      control: "text",
    },
    title: {
      description: "Title displayed above the block list",
      control: "text",
    },
    onBlockSelect: {
      description: "Callback when a block is clicked",
    },
  },
} satisfies Meta<typeof BlockPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with built-in blocks
export const Default: Story = {};

// Story with custom title
export const CustomTitle: Story = {
  args: {
    title: "Visual Programming Blocks",
  },
};

// Story with custom blocks
export const CustomBlocks: Story = {
  args: {
    title: "Advanced Blocks",
    blocks: [
      {
        id: "function",
        type: "function",
        label: "Function",
        description: "Define a reusable function",
      },
      {
        id: "condition",
        type: "condition",
        label: "If Statement",
        description: "Conditional logic execution",
      },
      {
        id: "loop",
        type: "loop",
        label: "While Loop",
        description: "Repeat execution while condition is true",
      },
      {
        id: "return",
        type: "return",
        label: "Return",
        description: "Exit function with value",
      },
    ],
  },
};

// Story with block selection enabled
export const Interactive: Story = {
  args: {
    onBlockSelect: (block) => console.log("Block clicked:", block),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Blocks are clickable and trigger the onBlockSelect callback when clicked.",
      },
    },
  },
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    className: "max-w-sm bg-blue-50",
    title: "Styled Palette",
  },
};

// Story with minimal blocks (for testing empty states)
export const Minimal: Story = {
  args: {
    blocks: [
      {
        id: "basic",
        type: "basic",
        label: "Basic Block",
        description: "A simple block for testing",
      },
    ],
    title: "Minimal Palette",
  },
};

// Story with icons (simulated with emojis)
export const WithIcons: Story = {
  args: {
    blocks: [
      {
        id: "literal",
        type: "literal",
        label: "Literal",
        description: "A literal value",
        icon: "🔢",
      },
      {
        id: "variable",
        type: "variable",
        label: "Variable",
        description: "A variable reference",
        icon: "📝",
      },
      {
        id: "assignment",
        type: "assignment",
        label: "Assignment",
        description: "Assign a value to a variable",
        icon: "➡️",
      },
    ],
  },
};
