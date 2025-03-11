
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { nanoid } from "nanoid";
 
const __dirname = path.dirname(fileURLToPath(import.meta.url));
 
export async function setupVite(app, server) {
  console.log("Setting up Vite dev middleware...");
 
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
    // No need to specify config file as it will pick up vite.config.js
  });
 
  // Use Vite's middleware
  app.use(vite.middlewares);
 
  // Serve the index.html for any other requests
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
 
    try {
      // Read index.html
      const templatePath = path.resolve(__dirname, "client/index.html");
      let template = fs.readFileSync(templatePath, "utf-8");
 
      // Add a cache busting parameter to main.jsx
      template = template.replace(
        'src="/src/main.jsx"',
        `src="/src/main.jsx?v=${nanoid()}"`
      );
 
      // Apply Vite HTML transforms
      template = await vite.transformIndexHtml(url, template);
 
      // Send the transformed HTML
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      // If an error is caught, let Vite fix the stack trace
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
 
export function serveStatic(app) {
  const distPath = path.resolve(__dirname, "dist/public");
 
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Run 'npm run build' first.`
    );
  }
 
  // Serve the static files
  app.use(express.static(distPath));
 
  // Serve index.html for any other path
  app.use("*", (req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
