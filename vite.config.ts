import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Increase chunk size limit to suppress warnings
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manually separate large dependencies into a vendor chunk
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts'],
        },
      },
    },
  },
});