import "./style.css";
import "./ui";

if (!globalThis.crossOriginIsolated) {
  document.body.innerHTML =
    "This page requires cross-origin isolation to work properly. Page will reload in 3s.";
  setTimeout(() => window.location.reload(), 3000);
}

let isDark = false;
const userTheme = localStorage.getItem("color-theme");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (userTheme === "dark" || (userTheme !== "light" && systemDark)) {
  document.body.classList.toggle("dark", true);
  isDark = true;
}
// @ts-ignore
import("iframe-resizer/js/iframeResizer.contentWindow");

const code = `#include <iostream>
#include <format>

int main() {
    std::cout << std::format("Hello, {}!\\n", "world");
}
`;

const serverPromise = import("./server").then(({ createServer }) => createServer());

import("./client").then(async ({ createEditor, createClient }) => {
  await createEditor(document.getElementById("editor")!, code);
  await createClient(await serverPromise);
})

