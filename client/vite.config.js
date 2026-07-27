import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            if (id.includes("exceljs")) {
              return "vendor-excel";
            }
            if (id.includes("html5-qrcode") || id.includes("qrcode")) {
              return "vendor-code";
            }
            if (id.includes("@react-pdf-viewer") || id.includes("pdfjs-dist")) {
              return "vendor-pdf";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
