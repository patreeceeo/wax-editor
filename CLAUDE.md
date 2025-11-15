# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wax Editor is, at the moment, an AST compiler and virtual machine with debugging support built with React, TypeScript, and Vite. It implements a stack-based virtual machine with time-travel debugging capabilities, allowing developers to step through instruction execution and inspect machine state at each point.

The goal is to build a low-code, visual scripting environment like Scratch, if Scratch were made for serious software development. The underlying semantics of the language will be object oriented a la Smalltalk, though the average user will not need to have any clue what that even is. This editor will be powerful because:

* Users will have powerful debugging features built in to the editor.
* The editor will evaluate code as it's updated, removing the need for static type checks and allowing for lighting fast feedback.
* The VM's stack will be a first class object, allowing for things like algebraic effects instead of exceptions/errors.
* There will be a dev preview of the relevant parts of the app alongside of / mixed in with the code editor.
* It will leverage the human brain's visual as well as verbal processing abilities.

## Development Commands

```bash
# Development
npm run dev          # Start Vite development server with hot reload
npm run build        # TypeScript compilation + Vite production build
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # ESLint checks
npm run test         # Run Vitest test suite
npm test -- --run    # Run tests once without watch mode
npm test path/to/test.test.ts  # Run single test file
```

## Architecture Overview

The system follows a classic compiler/VM pattern with a clean separation between the virtual machine implementation and the React debugging UI:

### Core VM Components

- **Virtual Machine (`machine.ts`)** - Runtime engine with procedure call stack, instruction execution, and state management
- **Instruction Set (`compiled_instructions.ts`)** - All VM instructions (literal, add, sendMessage, etc.) with named function exports for debugging
- **Compiler (`compiler.ts`)** - Translates AST nodes to executable instructions
- **Abstract Syntax Tree (`abstract_syntax_tree.ts`)** - Language representation with expression/statement nodes
- **Compiled Procedure (`compiled_procedure.ts`)** - Procedure contexts with operand stack, program counter, and variable scoping

### Memory & Object System

- **Reference Counted Memory** - `Memory<T>` class manages compiled procedure lifetimes
- **Persistent Objects** - `PersistentObject` uses structurajs for immutable state management (critical for time-travel debugging)
- **Wax Classes (`wax_classes.ts`)** - Runtime type system with method dispatch and rendering functions

### React Debugging Interface

- **Time-Travel Debugger** - Complete machine state snapshots for each execution step
- **Machine Context** - React context provider distributes current/previous machine state
- **Component Architecture** - Modular UI (ProgramViewer, TreeView, ContextDiff) with shared context

## Key Architectural Patterns

### 1. Time-Travel Debugging
- Every debugger action creates a new machine state snapshot
- State is immutable using `structurajs.produce()` pattern
- Forward/backward navigation through execution history
- Visual indicators for current vs previous instruction positions

### 2. Instruction-Level Compilation
- AST nodes compile to arrays of instruction objects
- Each instruction has a named function with `.displayName` for production debugging
- Terser configuration preserves function names during minification

### 3. Message Passing Architecture
- Method invocation via `sendMessage(receiver, message, argCount)` instruction
- Dynamic method lookup based on receiver's WaxClass
- Control flow methods like `ifTrue:` and `whileTrue:` for conditional logic

### 4. Variable Scoping & Memory
- Procedure contexts manage local variables with lexical scoping
- Reference counting ensures proper cleanup of compiled procedures
- Variable objects with unique IDs for tracking and debugging

## Build Configuration

- **TypeScript**: Strict mode with ES2022 target, `verbatimModuleSyntax: true`
- **Vite**: React 19 with React Compiler enabled, TailwindCSS plugin
- **Production**: Terser minification with `keep_fnames: true` to preserve instruction function names
- **Deployment**: GitHub Pages workflow with automated CI/CD to `/wax-editor/` base path

## Testing Patterns

- **Vitest** for unit testing
- Test structure: `describe()` blocks with `beforeEach()` setup, `expect()` assertions
- State machine testing for debugger reducer actions
- Persistent object testing for immutability behavior
- Example test setup in `src/components/Debugger.test.ts`

## Special Considerations

### Function Name Preservation
Instruction functions use `.displayName` properties for production debugging:
```typescript
export const literal: InstructionFn<[CompiledInstructionArg]> = (ctx, obj) => {
  ctx.push(obj);
};
literal.displayName = "literal";
```

### React Compiler Integration
- React Compiler is enabled for performance optimization
- May impact development and build performance
- Balances automatic optimization with developer experience

### Memory Management
- Always use `Memory<T>` for compiled procedures to ensure proper reference counting
- Persistent objects follow copy-on-write semantics using structurajs
- Variable objects track identity across machine state changes

## Common Development Patterns

When adding new VM instructions:
1. Define instruction function in `compiled_instructions.ts` with `.displayName`
2. Add AST node if needed in `abstract_syntax_tree.ts`
3. Add compilation logic in `compiler.ts`
4. Update WaxClass system if new runtime types are needed

When modifying the React debugger:
1. Use MachineContext for accessing machine state
2. Follow time-travel patterns with immutable state updates
3. Test debugger reducer actions with state snapshots
4. Use TreeView component for recursive data visualization
