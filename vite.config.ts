import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger"; // optional

export default defineConfig({
  base: '/', // custom domain = root
  server: { host: true, port: 8080 },
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  assetsInclude: ["**/*.JPG", "**/*.jpg", "**/*.PNG", "**/*.png"],
});
