import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/GramMaster/',
  server: {
    port: 5174,
    open: false
  }
})
