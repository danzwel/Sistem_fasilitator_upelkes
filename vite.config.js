import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxy = {
  '/api': 'http://localhost:8000',
  '/uploads': 'http://localhost:8000',
}

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
})
