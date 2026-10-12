import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // O frontend chama /api no próprio endereço; em desenvolvimento segue para o backend local.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
