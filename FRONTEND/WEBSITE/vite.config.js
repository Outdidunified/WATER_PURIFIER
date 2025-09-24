import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// export default defineConfig({
//     plugins: [react()],
//     server: {
//         host: true,    // This tells Vite to listen on all interfaces (0.0.0.0) and use your local IP automatically
//         port: 5050,    // Your desired port
//     },
// })


export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5050,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://192.168.1.33:5001',
                changeOrigin: true,
                rewrite: path => path.replace(/^\/api/, ''),
            },
            '/upload': {
                target: 'http://192.168.1.33:5001',
                changeOrigin: true,
            },
        },
    },
});