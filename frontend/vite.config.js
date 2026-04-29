import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    // Output the built frontend into the backend folder so PyInstaller can bundle everything together
    outDir: '../backend/static_frontend',
    emptyOutDir: true,
    // Use a broadly compatible target for the embedded browser
    target: 'es2020',
    minify: true,
    sourcemap: false,
  },
})
