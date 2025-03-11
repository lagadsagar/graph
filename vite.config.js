
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
 
export default defineConfig({
  plugins: [react()],
  root: path.resolve("client"),
  build: {
    outDir: path.resolve("dist/public"),
    emptyOutDir: true,
  },
  server: {
    middlewareMode: true,
    hmr: {
      host: '0.0.0.0',
      clientPort: 443,
      protocol: 'ws'
    }
  }
});
