import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        // The site itself, and the standalone configurator that the embed
        // loader drops into an iframe on a glazier's own website.
        main: path.resolve(__dirname, "index.html"),
        embed: path.resolve(__dirname, "embed.html"),
      },
    },
  },
}));
