import fs from "node:fs";
import { defineConfig } from "vite";
import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

const baseUrl = "/";

export default defineConfig({
  base: baseUrl,
  build: {
    target: "es2022",
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      tsconfig: "./tsconfig.json",
      plugins: [importMetaUrlPlugin],
    },
  },
  worker: {
    format: "es",
  },
  resolve: {
    dedupe: ["monaco-editor", "vscode"],
  },
  define: {
    // Server-provided Content-Length header may be gzipped, get the real size in build time
    __WASM_SIZE__: fs.statSync("public/wasm/clangd.wasm").size,
  },
});
