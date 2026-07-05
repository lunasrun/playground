import { defineConfig } from "vite";
import { rawTsPlugin } from "./vite-plugins/raw-ts";
import vue from "@vitejs/plugin-vue";

import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import path from "node:path";

const prefix = `@codingame/monaco-vscode-editor-api/esm/vs`;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), wasm(), topLevelAwait(), rawTsPlugin()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      {
        find: /^prettier$/,
        replacement: path.resolve(
          __dirname,
          "./node_modules/prettier/standalone.js"
        ),
      },
      {
        find: /^prettier\/plugins\/html$/,
        replacement: path.resolve(
          __dirname,
          "./node_modules/prettier/parser-html.js"
        ),
      },
      {
        find: /^prettier\/plugins\/typescript$/,
        replacement: path.resolve(
          __dirname,
          "./node_modules/prettier/parser-typescript.js"
        ),
      },
      {
        find: /^prettier\/plugins\/babel$/,
        replacement: path.resolve(
          __dirname,
          "./node_modules/prettier/parser-babel.js"
        ),
      },
    ],
  },
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          jsonWorker: [`${prefix}/language/json/json.worker`],
          cssWorker: [`${prefix}/language/css/css.worker`],
          htmlWorker: [`${prefix}/language/html/html.worker`],
          tsWorker: [`${prefix}/language/typescript/ts.worker`],
          editorWorker: [`${prefix}/editor/editor.worker`],
        },
      },
    },
  },
  // proxy localhost:3030
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3030",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    port: 12390,
  },
});
