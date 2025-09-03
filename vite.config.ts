import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/otcr-consulting/' : '/',
  server: {
    host: true, // optional: was "::"
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // assetsInclude is optional unless you need raw-url imports of uncommon types
  assetsInclude: ["**/*.JPG", "**/*.jpg", "**/*.PNG", "**/*.png"],
}));
