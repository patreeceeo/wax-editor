# Product Requirements Document: Block-Based Visual Editor

## Overview

This PRD defines the requirements for a Scratch-inspired visual block editor that allows users to create programs by dragging and dropping nestable blocks. The editor translates visual block compositions into the Wax Editor's AST (Abstract Syntax Tree), which can then be compiled and executed by the virtual machine with full debugging support.

## Vision & Goals

Build a low-code visual programming interface that:

- Makes programming accessible through visual, human-friendly representations
- Maintains the power and precision of textual code
- Integrates seamlessly with the existing Wax VM and time-travel debugger
- Leverages both visual and verbal cognitive processing
- Enables lightning-fast feedback through live evaluation
- Complements JavaScript rather than replacing it

## Target Users

- **Primary**: Developers who want rapid prototyping with visual feedback
- **Secondary**: Programming learners who benefit from visual representations

## Core User Stories

### Epic 1: Block Palette & Discovery

- As a user, I want to see all available block types in a sidebar palette
- As a user, I want blocks grouped by category (Variables, Literals, Messages)
- As a user, I want to search/filter blocks by name or function
- As a user, I want to see tooltips explaining what each block does

### Epic 2: Drag & Drop Interaction

- As a user, I want to drag blocks from the palette to the canvas
- As a user, I want blocks to snap to valid drop positions
- As a user, I want dropped blocks to move to the top-left available position
- As a user, I want to nest blocks inside container blocks (e.g., name of a variable, body block of an ifTrue message)
- As a user, I want to reorder blocks by dragging them
- As a user, I want to remove blocks by dragging them back to the palette

### Epic 3: Block Configuration

- As a user, I want to edit block parameters inline (variable names, literal values, messages)
- As a user, I want parameter inputs to validate as I type
- As a user, I want to connect expression blocks as inputs to other blocks
- As a user, I want visual indicators when blocks are incomplete or invalid

### Epic 4: Visual Feedback

- As a user, I want to see the program structure at a glance
- As a user, I want nested blocks to be visually nested
- As a user, I want color coding by block category
- As a user, I want to collapse/expand container blocks

### Epic 5: Integration with Debugger

- As a user, I want to run my visual program in the debugger
- As a user, I want to see which block is currently executing
- As a user, I want to step through block execution
- As a user, I want to inspect values at each block

## Slot Types

block_slot - Can contain multiple vertically stacked statement/expression blocks. Only returns a value if the return value checkbox is checked in one of its nested blocks.
expression_slot - Contains one expression block and returns the value of that expression at execution time.

## Block Types (Based on AST Nodes)

### 1. Statement Blocks

#### Assignment Statement Block

```
[set] [variable_name_input] [to]
[expression_slot]
```

- Maps to: `AssignmentStatementNode`
- Inputs: variable name (text), expression_slot

#### Expression Statement Block

```
[evaluate] [return checkbox]
[expression_slot]
```

- Maps to: `ExpressionStatementNode`
- Inputs: expression_slot, isReturn flag (checkbox)

### 2. Expression Blocks

#### Literal Block

```
[value_input]
```

- Maps to: `JsLiteralNode`
- Inputs: JavaScript literal value (number, string, array, object)
- Special handling for arrays/objects: expandable editor

#### Get Variable Block

```
[variable_name_input]
```

- Maps to: `GetVariableNode`
- Inputs: variable name (text or dropdown of defined variables)

#### Send Message Block

```
[receiver_slot] [•] [message_input] [arg_slot_1] [arg_slot_2] ...
```

- Maps to: `SendMessageExpressionNode`
- Inputs: receiver (expression_slot), message name (text), arguments (expression_slots)
- Special messages with custom UI:
  - Binary operators: `<`, `>`, `+`, `-`, etc. → infix notation
  - Control flow: See Control Flow Blocks (below)

#### Function Block

```
┌─ [function] [param_slot_1] [param1_slot_2] ... ──┐
│  [block_slot]                                    │
└──────────────────────────────────────────────────┘
```

- Maps to: `FunctionExpressionNode`
- Inputs: parameters (comma-separated text), body (vertical statement slots)

### 3. Control Flow Blocks (Special Send Message Blocks)

#### If Block

```
┌─ [if] [expression_slot] ─┐
│  [block_slot]            │
└──────────────────────────┘
```

- Syntactic sugar for: `condition sendMessage: "ifTrue" args: [function]`

#### While Loop Block

```
┌─ [while] [expression_slot] ─┐
│  [block_slot]               │
└─────────────────────────────┘
```

- Syntactic sugar for: `condition sendMessage: "whileTrue" args: [function]`

### 4. Program Root Block

```
┌─ [Program] ───────────────┐
│  [block_slot]             │
└───────────────────────────┘
```

- Maps to: `ProgramNode`
- Visual: Gray container, always present, top-level canvas

## UI Components & Layout

### Overall Layout (Using Shadcn Resizable)

```
┌─────────────────────────────────────────┐
│  [Wax Editor Header]                    │
├──────────┬──────────────────────────────┤
│          │                              │
│ Block    │   Canvas Area                │
│ Palette  │   (Drop Zone)                │
│          │                              │
│ (Sidebar)│                              │
│          │                              │
│          │                              │
├──────────┴──────────────────────────────┤
│  Debugger Panel (existing)              │
└─────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Block Palette Sidebar (Shadcn Sidebar + Card)

- Component: `<BlockPalette />`
- Uses: `@shadcn/sidebar`, `@shadcn/card`, `@shadcn/button`
- Features:
  - Collapsible sections by category
  - Search/filter input at top
  - Draggable block previews
  - Tooltips on hover
- Categories:
  - Variables (Get, Set)
  - Literals (Number, String, Array, Object)
  - Control Flow (If, While)
  - Functions
  - Messages (Send Message, Operators)

#### 2. Canvas Drop Zone

- Component: `<BlockCanvas />`
- Plain HTML/CSS with drag-and-drop handlers
- Features:
  - Grid background (optional, for alignment)
  - Drop indicators/highlights
  - Auto-layout: dropped blocks snap to top-left
  - Trash zone in corner for deletion

#### 3. Block Components (Plain HTML/React)

- Base component: `<Block />`
- Variants:
  - `<StatementBlock />` - stacks vertically
  - `<ExpressionBlock />` - can be nested
- Uses: `@shadcn/card` as base, `@shadcn/button` for actions
- Each block type is a specialized component
- Inline editing using contenteditable or `<input>` elements

#### 4. Resizable Layout (Shadcn Resizable)

- Component: Uses `@shadcn/resizable`
- Allows users to resize:
  - Palette width
  - Canvas/debugger height split

## Technical Architecture

### State Management

```typescript
interface EditorState {
  // Block tree representing the program
  programTree: ProgramNode;

  // UI state
  selectedBlockReference: BlockReference;

  // Palette state
  paletteFilter: string;
  collapsedCategories: Set<string>;
}

interface BlockReference {
  // True if this doesn't actually point to a block
  isNull(): boolean;
  // get the referenced BlockInstance
  // throws an error if isNull() returns true
  getBlock(): Block;
  // the the UUID of this block
  // throws an error if isNull() returns true
  getUUID(): Block;
}
```

### Drag & Drop Implementation

Use native HTML5 Drag & Drop API:

- `draggable` attribute on palette blocks
- `onDragStart`, `onDragOver`, `onDrop` handlers
- Data transfer includes block type information
- Custom drag images for better UX

Alternative: Consider `@dnd-kit/core` library for more control

### Block ID System

Each instantiated block gets a unique ID:

```typescript
interface BlockInstance {
  self: BlockReference;
  astNode: AstNode; // Reference to actual AST node
  parent: BlockReference;
  blockSlots: Record<string, BlockReference[]>;
  expressionSlots: Record<string, BlockReference>;
}
```

### AST Synchronization

Maintain bidirectional mapping:

- Blocks → AST: When blocks change, regenerate AST
- Use React state/context to keep in sync

### Rendering Strategy

```typescript
// Recursive rendering of block tree
function renderBlock(blockId: string): JSX.Element {
  const block = getBlockById(blockId);

  switch (block.type) {
    case 'assignment':
      return <AssignmentBlock block={block} />;
    case 'sendMessage':
      return <SendMessageBlock block={block} />;
    case 'function':
      return <FunctionBlock block={block}>
        {block.children.map(renderBlock)}
      </FunctionBlock>;
    // ... etc
  }
}
```

## Interaction Design Details

### Drop Behavior

When a block is dropped:

1. Validate drop target (e.g., statement blocks cannot go directly in expression blocks)
2. If valid:
   - Create new block instance with unique ID
   - Insert into parent at appropriate position
   - Update AST
   - Animate block to final position (top-left of drop zone)
3. If invalid:
   - Show error indicator
   - Animate block back to palette

### Nested Block Slots

Container blocks (functions, control flow) have "slots" for children:

- Empty slots show a dotted outline placeholder
- Placeholder text: "drop block here" or "add statement"
- Clicking placeholder causes palette to filter by compatible blocks

## Shadcn/UI Component Usage

### Components to Install

Do not install individual component packages!

### Component Mapping

- **Block Palette**: `Sidebar` with `SidebarContent`, `SidebarGroup`
- **Block Cards**: `Card` with custom styling per block type
- **Inline Inputs**: `Input` for text fields
- **Tooltips**: `Tooltip` for block descriptions
- **Resizable Panels**: `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`
- **Category Sections**: `Collapsible` from sidebar
- **Action Buttons**: `Button` for "add statement", etc.

## Non-Functional Requirements

### Performance

- Render 100+ blocks without lag
- Smooth drag-and-drop (60fps) (see src/components/GraphView for example code)
- Instant feedback on block changes

### Accessibility

- Screen reader support for block descriptions
- High contrast mode support
- Focus indicators on all interactive elements

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)

## Success Metrics

### MVP Success Criteria

- Users can create a simple program (e.g., findMaxInArray) using only blocks
- Block program compiles to valid AST
- AST can be executed in the VM debugger
- No data loss when switching between block and text views

### User Experience Goals

- New users create first program in < 5 minutes
- Drag & drop feels responsive and intuitive
- Visual representation aids program comprehension

## Implementation Phases

### Phase 1: Core Infrastructure (MVP)

- Basic block types (literal, variable, assignment)
- Simple drag-and-drop from palette to canvas
- AST generation from blocks
- No nesting yet, flat programs only

### Phase 2: Nesting & Control Flow

- Container blocks (function, if, while)
- Nested expression blocks
- Full drag-and-drop with slot validation

### Phase 3: Polish & Advanced Features

- Inline editing improvements
- Search/filter palette
- Keyboard shortcuts
- Undo/redo
- Block collapse/expand
- Custom block colors & styling

### Phase 4: Debugger Integration

- Highlight currently executing block
- Show variable values on hover
- Step through blocks with debugger
- Breakpoints on blocks

### Phase 5: Advanced Editing

- Copy/paste blocks
- Duplicate blocks
- Multi-select blocks
- Block templates/snippets
- Export/import block programs

## Open Questions

1. **Text ↔ Block Synchronization**: Should we support real-time bidirectional editing (blocks + text), or mode-based editing (switch between views)?

- Only support editing and generating from blocks.

2. **Custom Blocks**: Should users be able to define custom block types for frequently used patterns?

- In the future, yes.

3. **Block Library**: Should there be a library of pre-built common patterns (e.g., "find max", "sum array")?

- Maybe in the future.

4. **Validation**: How strictly should we validate block connections? Prevent invalid programs, or allow and show errors?

- Prevent invalid programs and show message explaining why a connection is not allowed.

5. **Mobile Support**: What's the priority for mobile/tablet support? Touch drag-and-drop is complex.

## Out of Scope (For Now)

- Custom block creation UI
- Collaborative editing
- Block animations beyond basic drag-and-drop
- AI-assisted block suggestions
- Mobile/touch support

## References & Inspiration

- **Scratch**: Block visual programming language (target audience: education)
- **Blockly**: Google's visual programming library
- **Node-RED**: Flow-based programming for IoT
- **Unreal Engine Blueprints**: Visual scripting for game development
- **Shadcn/UI Documentation**: https://ui.shadcn.com/

## Appendix: Example Block Representation

### Visual Example: Finding Max in Array

```
┌─ Program ────────────────────────────────────┐
│                                              │
│  [set] array [to] [[3,1,4,1,5,9,2,6,5]]      │
│                                              │
│  [set] max [to] [0]                          │
│                                              │
│  [set] i [to] [0]                            │
│                                              │
│  ┌─ [while] [i] • [<] [array] • [length] ──┐ │
│  │                                         │ │
│  │  ┌─ [if] [array]•[at:][i] • [>] [max] ─┐│ │
│  │  │  [set] max [to] [array]•[at:][i]    ││ │
│  │  └─────────────────────────────────────┘│ │
│  │                                         │ │
│  │  [set] i [to] [i] • [+] [1]             │ │
│  │                                         │ │
│  └─────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘
```

This visual representation maps 1:1 to the AST in `src/examples/findMaxInArray.ts`.
