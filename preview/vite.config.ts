import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Losse preview-build: dezelfde schermen en logica, maar als één HTML-bestand
 * met interne routing, zodat het prototype zonder server te openen is.
 */
export default defineConfig({
  root: r("."),
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "@/lib/nav", replacement: r("./nav.tsx") },
      { find: /^@\//, replacement: r("../src/") + "/" },
    ],
  },
  build: { outDir: r("./dist"), emptyOutDir: true },
});
