import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  envDir: process.env.VERCEL ? '.' : '..',
  plugins: [react()],
  server: {
    port: 5173,
    // During development, /api calls are proxied to the Express backend.
    proxy: { '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:5000', changeOrigin: true } },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          map: ['leaflet', 'react-leaflet'],
          pdf: ['jspdf', 'jspdf-autotable'],
        },
      },
    },
  },
});
