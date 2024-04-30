import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import FullReload from 'vite-plugin-full-reload'

// https://vitejs.dev/config/
export default defineConfig({
  // root: "./src",
  // publicDir: "../public",
  plugins: [
    svelte(),
    FullReload(["public/**/*"])
  ],
  build: {
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      // external: ['webextension-polyfill'],
      input: {
        "index": 'index.html',
        "background-script": 'src/background-script.ts',
        "client": 'src/client.ts',
        "content-script": 'src/content-script.ts',
      },
      output: {
        dir: 'dist',
        entryFileNames: '[name].js',
      },
    },
  },
});
