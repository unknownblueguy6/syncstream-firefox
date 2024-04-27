import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  // root: "./src",
  // publicDir: "../public",
  plugins: [svelte()],
  build: {
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      // external: ['webextension-polyfill'],
      input: {
        "index": 'index.html',
        "background-script": 'src/background-script.ts',
      },
      output: {
        dir: 'dist',
        entryFileNames: '[name].js',
      },
    },
  },
});
