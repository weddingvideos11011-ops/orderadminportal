import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: projectRoot,
  plugins: [react()],
  envDir: resolve(projectRoot, '..'),
  server: { port: 5174, strictPort: true },
  build: { outDir: resolve(projectRoot, 'dist'), emptyOutDir: true },
})