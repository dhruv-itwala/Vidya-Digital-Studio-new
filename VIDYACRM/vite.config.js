import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",

      devOptions: {
        enabled: true,
      },

      registerType: "autoUpdate",

      includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png"],

      manifest: {
        name: "My Staff - Vidya Digital Studio",
        short_name: "Staff CRM",
        description: "Staff CRM for Vidya Digital Studio",

        start_url: "/",
        scope: "/",

        display: "standalone",
        orientation: "any",

        background_color: "#ffffff",
        theme_color: "#ffffff",

        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],

  server: {
    port: 20254,
  },
});
