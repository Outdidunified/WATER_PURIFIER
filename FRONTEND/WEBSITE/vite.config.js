import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5050,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://192.168.0.43:5001',
                changeOrigin: true,
            },
            '/upload': {
                target: 'http://192.168.0.43:5001',
                changeOrigin: true,
            },
        },
    },
});