import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  // Base path matches the GitHub Pages subpath for this app.
  base: '/apps/attention-lab/',
  plugins: [react()],
  build: {
    // Output one directory up so built files land in apps/attention-lab/ (served by GitHub Pages).
    // Source files stay isolated in this _project/ subdirectory.
    outDir: resolve(__dirname, '..'),
    emptyOutDir: false,
  },
})
