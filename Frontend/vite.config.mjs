import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vitePrerender from "vite-plugin-prerender";
import { routesToPrerender } from "./src/utils/prerenderRoutes.js";

export default defineConfig({
  plugins: [
    react(),
    vitePrerender({
      staticDir: "dist", // Folder where built files are output
      routes: routesToPrerender, // Array of paths to prerender
      rendererOptions: {
        headless: true,
        renderAfterDocumentEvent: "prerender-ready", // Fired after your app renders meta
        maxConcurrentRoutes: 4,
      },
      postProcess(context) {
        // Fix: ensures meta/title are preserved in final HTML
        context.html = context.html
          .replace(/<script type="module".*?>.*?<\/script>/gs, "")
          .replace(/<script nomodule.*?>.*?<\/script>/gs, "");
        return context;
      },
    }),
  ],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  server: {
    port: 20251,
  },
});
