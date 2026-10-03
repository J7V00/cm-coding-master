import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

const pages = [
  "index",
  "about",
  "contact",
  "download",
  "admin",
  "welcome",
  "editor",
];

export default defineConfig({
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((name) => [name, resolve(root, `${name}.html`)]),
      ),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
