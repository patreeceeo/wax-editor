import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/wax-editor/', // GitHub Pages deployment path
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    minify: 'terser',
    terserOptions: {
      mangle: {
        // Preserve function names for VM instruction debugging
        keep_fnames: true,
      },
    }
  }
})
