import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration for production
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate sourcemaps for debugging (can be disabled for smaller bundle)
    sourcemap: true,
    
    // Chunk size warning limit (in KB)
    chunkSizeWarningLimit: 1000,
    
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'utils-vendor': ['date-fns', 'uuid'],
        },
      },
    },
    
    // Minification
    minify: 'esbuild',
    
    // Target browsers
    target: 'es2015',
  },
  
  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
