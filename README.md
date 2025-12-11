# Wax Editor

## Overview

Wax Editor is, at the moment, an AST compiler and virtual machine with debugging support built with React, TypeScript, and Vite. It implements a stack-based virtual machine with time-travel debugging capabilities, allowing developers to step through instruction execution and inspect machine state at each point.

## Vision and Goals

The goal is to rethink software development from first principles. It's the late 2020's, yet we're still building software with tools based in technologies and paradigms of the 1970's. My vision is a block-based visual scripting environment similar Scratch, but for serious software development. The underlying semantics of the language will be message passing object-orientation, a la Smalltalk, though the average user will not need to have any clue what that even is. This editor will be powerful because:

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

## Development

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## Deployment

### GitHub Pages

This project is configured to automatically deploy to GitHub Pages when pushed to the `main` branch. The deployment workflow:

1. **Build Process**: Uses Vite to build the React application
2. **Asset Optimization**: Generates production-optimized CSS and JavaScript bundles
3. **GitHub Pages Deploy**: Automatically publishes to `https://[username].github.io/wax-editor/`

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Tech Stack

- **React 19** - UI framework with React Compiler enabled
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Vitest** - Unit testing framework

### Features

- Virtual machine instruction debugging
- Step-by-step execution control
- Interactive variable and stack inspection
- Recursive procedure call visualization
- TypeScript-powered type safety
