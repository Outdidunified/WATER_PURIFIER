import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,    // This tells Vite to listen on all interfaces (0.0.0.0) and use your local IP automatically
        port: 5050,    // Your desired port
    },
})
