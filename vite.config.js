
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'graphql_client'),
  build: {
    outDir: path.resolve(__dirname, 'graphql_client/dist'),
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // Make the server accessible from outside
    hmr: {
      // For development in Replit
      clientPort: 443
    }
  },
});
