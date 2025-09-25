import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 4000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://192.168.0.36:5001',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
      '/upload': {
        target: 'http://192.168.0.36:5001',
        changeOrigin: true,
      },
    },
  },
});
