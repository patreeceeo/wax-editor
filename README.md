# Wax Editor

## Overview

Wax Editor is an AST compiler and virtual machine with debugging support built with React, TypeScript, and Vite. It implements a stack-based virtual machine with time-travel debugging capabilities, allowing developers to step through instruction execution and inspect machine state at each point.

For detailed architecture and development guidance, see [CLAUDE.md](CLAUDE.md).

## Vision and Goals

The goal is to rethink software development from first principles. It's the late 2020's, yet we're still building software with tools based in technologies and paradigms of the 1970's. The vision is a block-based visual scripting environment similar Scratch, but for serious software development. The underlying semantics of the language will be message passing object-orientation, a la Smalltalk, though the average user will not need to have any clue what that even is. This editor will be powerful because:

- Users will have powerful debugging features built in to the editor.
- The editor will evaluate code as it's updated, removing the need for static type checks and allowing for lighting fast feedback.
- The VM's stack will be a first class object, allowing for things like [algebraic effects](https://overreacted.io/algebraic-effects-for-the-rest-of-us/) instead of exceptions/errors.
- There will be a dev preview of the relevant parts of the app alongside of / mixed in with the code editor.
- It will leverage the human brain's visual as well as verbal processing abilities.
- It seeks to compliment JavaScript, not replace it.

Other sources of inspo, aside from Smalltalk and Scratch:

- The Brilliant.org App's math and coding interfaces
- Prior art in the [Blockly](https://github.com/google/blockly) community
- Bret Victor's [articles on dynamic mediums](https://worrydream.com/)
- The [deep connecton of Objects with UX](https://www.ooux.com/)
- [Luna Park](luna-park.app) doing a similar thing but with node-based visual programming

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint
```

## Tech Stack

- **React 19** - UI framework with React Compiler enabled
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Vitest** - Unit testing framework

## Features

- Virtual machine instruction debugging
- Step-by-step execution control
- Interactive variable and stack inspection
- Recursive procedure call visualization
- Time-travel debugging with full state snapshots

## Contributing

See [pull_request_template.md](pull_request_template.md) for the PR evaluation rubric.

For block editor feature development, refer to [PRD-BlockEditor.md](PRD-BlockEditor.md).

## Deployment

This project automatically deploys to GitHub Pages when pushed to the `main` branch: `https://[username].github.io/wax-editor/`
