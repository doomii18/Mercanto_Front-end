import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig({
  plugins: [vueDevTools(),vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@zxcvbn-ts/language-es-es")) {
            return "zxcvbn-es";
          }
          if (id.includes("@zxcvbn-ts/language-common")) {
            return "zxcvbn-common";
          }
          if (id.includes("@zxcvbn-ts/core")) {
            return "zxcvbn-core";
          }
        },
      },
    },
  },
});
