import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

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

// Keep the public website pages at the output root, and also build the
// desktop/legacy application pages under dist/html so Tauri can load them.
const inputs = Object.fromEntries([
  ...pages
    .filter((name) => existsSync(resolve(root, `${name}.html`)))
    .map((name) => [name, resolve(root, `${name}.html`)]),
  ...pages
    .filter((name) => existsSync(resolve(root, "html", `${name}.html`)))
    .map((name) => [`html/${name}`, resolve(root, "html", `${name}.html`)]),
]);

export default defineConfig({
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: inputs,
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
