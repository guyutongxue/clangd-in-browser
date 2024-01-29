import "./style.css";

import { createEditor } from "./editor";
import { createLsp } from "./client";
import "./build";

if (!globalThis.crossOriginIsolated) {
  document.body.innerHTML = "This page requires cross-origin isolation to work properly. Page will reload in 3s.";
  await new Promise(r => setTimeout(r, 3000));
  window.location.reload();
}

// @ts-ignore
import("iframe-resizer/js/iframeResizer.contentWindow");

let isDark = false;
const userTheme = localStorage.getItem('color-theme');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (userTheme === 'dark' || (userTheme !== 'light' && systemDark)) {
  document.body.classList.toggle('dark', true);
  isDark = true;
}

const code = `#include <iostream>
#include <format>

int main() {
    std::cout << std::format("Hello, {}!\\n", "world");
}
`;

await createEditor(document.getElementById("editor")!, code);
console.log("loading lsp...");
await createLsp();

