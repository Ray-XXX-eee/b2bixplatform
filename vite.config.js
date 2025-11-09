import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://us.api.customer.ixhello.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/chatbot-api': {
        target: 'https://us.customer.ixhello.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/chatbot-api/, ''),
      },
    },
  },
});
