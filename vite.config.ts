import fs from "node:fs";
import url from "node:url";
import { defineConfig } from "vite";
import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

const baseUrl = "/";

export default defineConfig({
  base: baseUrl,
  build: {
    target: "es2022"
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    }
  },
  // https://github.com/CodinGame/monaco-vscode-api?tab=readme-ov-file#if-you-use-vite
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        importMetaUrlPlugin
      ]
  }
  },
  worker: {
    format: "es"
  },
  define: {
    // Server may not provide Content-Length header, get it in build time
    __WASM_SIZE__: fs.statSync("public/wasm/clangd.wasm").size,
  }
});
