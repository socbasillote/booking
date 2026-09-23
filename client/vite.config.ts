import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "react-vendor";
            }

            if (id.includes("@reduxjs/toolkit") || id.includes("react-redux")) {
              return "redux-vendor";
            }

            if (id.includes("lucide-react")) {
              return "icons-vendor";
            }
          }

          return undefined;
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.API_PROXY_URL ?? "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
