import { cn } from "../lib/utils";

/** A block item that can be displayed in the palette */
interface BlockItem {
  /** Unique identifier for the block */
  id: string;
  /** Type of block (e.g., "literal", "variable", "assignment") */
  type: string;
  /** Display label for the block */
  label: string;
  /** Optional description shown below the label */
  description?: string;
  /** Optional icon to display next to the label */
  icon?: React.ReactNode;
}

/** Props for the BlockPalette component */
interface BlockPaletteProps {
  /** Array of blocks to display, defaults to built-in blocks */
  blocks?: BlockItem[];
  /** Additional CSS classes to apply */
  className?: string;
  /** Callback when a block is clicked */
  onBlockSelect?: (block: BlockItem) => void;
  /** Title displayed above the block list */
  title?: string;
}

const DEFAULT_BLOCKS: BlockItem[] = [
  {
    id: "literal",
    type: "literal",
    label: "Literal",
    description: "A literal value",
  },
  {
    id: "variable",
    type: "variable",
    label: "Variable",
    description: "A variable reference",
  },
  {
    id: "assignment",
    type: "assignment",
    label: "Assignment",
    description: "Assign a value to a variable",
  },
];

/**
 * A palette component that displays available block types for visual programming.
 * Blocks can be clicked to select them for use in the editor.
 */
export function BlockPalette({
  blocks = DEFAULT_BLOCKS,
  className,
  onBlockSelect,
  title = "Blocks",
}: BlockPaletteProps) {
  return (
    <div
      data-testid="block-palette"
      className={cn("p-4 border rounded-lg bg-gray-50", className)}
    >
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-2">
        {blocks.map((block) => (
          <div
            key={block.id}
            className={cn(
              "p-3 border rounded bg-white cursor-pointer",
              "hover:bg-gray-100 transition-colors",
              "active:bg-gray-200",
              onBlockSelect && "hover:shadow-sm",
            )}
            onClick={() => onBlockSelect?.(block)}
            role={onBlockSelect ? "button" : undefined}
            tabIndex={onBlockSelect ? 0 : -1}
          >
            <div className="flex items-center gap-2">
              {block.icon && (
                <span className="text-gray-600">{block.icon}</span>
              )}
              <div>
                <div className="font-medium">{block.label}</div>
                {block.description && (
                  <div className="text-sm text-gray-600">
                    {block.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
