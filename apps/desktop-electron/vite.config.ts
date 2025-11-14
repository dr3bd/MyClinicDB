import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'src/renderer'),
  build: {
    outDir: '../../dist/desktop-renderer',
    emptyOutDir: true
  },
  server: {
    port: 5174,
    host: '0.0.0.0'
  }
});
