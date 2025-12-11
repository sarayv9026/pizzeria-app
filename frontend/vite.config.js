import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    globals: true
  },
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: process.env.VITE_API_URL || 'https://pizzeria-app-1-n5m6.onrender.com',
        changeOrigin: true
      }
    }
  }
});
