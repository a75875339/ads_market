import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  build: {
    sourcemap: false,
  },
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    allowedHosts: true,
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3001',
    //     changeOrigin: true,
    //   },
    // },
  },
});
