import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  base: '/apps/attention-lab/',
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, '.'),
    emptyOutDir: false,
  },
})
