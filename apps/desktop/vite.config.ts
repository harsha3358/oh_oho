import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // important for electron
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist-react'
  }
})
