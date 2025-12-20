import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [react()],
        server: {
            host: '0.0.0.0',
            port: 4000,
            strictPort: true,
            proxy: {
                '/api': {
                    target: env.VITE_API_URL,
                    changeOrigin: true,
                },
                '/upload': {
                    target: env.VITE_API_URL,
                    changeOrigin: true,
                },
            },
        },
        build: {
            sourcemap: false,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom', 'react-router-dom'],
                        ui: ['@mui/material', '@emotion/react', '@emotion/styled'],
                        charts: ['apexcharts', 'react-apexcharts', 'chart.js', 'react-chartjs-2'],
                        utils: ['axios', 'dayjs', 'sweetalert2', 'react-select'],
                    },
                    chunkFileNames: 'assets/[name]-[hash].js',
                    entryFileNames: 'assets/[name]-[hash].js',
                    assetFileNames: 'assets/[name]-[hash].[ext]',
                },
            },
            chunkSizeWarningLimit: 1000,
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                },
            },
        },
        optimizeDeps: {
            include: [
                'react',
                'react-dom',
                'react-router-dom',
                '@mui/material',
                'axios',
                'apexcharts',
                'chart.js',
            ],
        },
        css: {
            devSourcemap: true,
        },
    }
})
