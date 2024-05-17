import "./style.css";
import { compileAndRun, setClangdStatus, toggleBuildPanel } from "./ui";
import { ExtendedSearchParams } from "./search_params";
import { createEditor, createUserConfig } from "./editor";
import { createServer } from "./server";

if (!globalThis.crossOriginIsolated) {
  document.body.innerHTML =
    'This page requires cross-origin isolation to work properly. You may forget to set server\'s COOP/COEP headers. If you are using this page as an <iframe>, you should also pass <code>allow="cross-origin"</code> to the <code>iframe</code> element.';
  throw new Error("Cross-origin isolation is not enabled");
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
  });
}

const params = new ExtendedSearchParams(window.location.search);

let isDark = false;
const themeParam = params.get("theme");
const userTheme = localStorage.getItem("color-theme");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (
  themeParam === "dark" ||
  (themeParam !== "light" &&
    (userTheme === "dark" || (userTheme !== "light" && systemDark)))
) {
  document.body.classList.toggle("dark", true);
  isDark = true;
}

if (params.isTrue("embed")) {
  // @ts-ignore
  import("iframe-resizer/js/iframeResizer.contentWindow");
  import("./embed");
}

const code =
  params.get("code") ??
  `#include <print>

int main() {
    std::println("Hello, {}!", "world");
}
`;

const runCodeNow = params.isTrue("run");
const showBuildPanel =
  runCodeNow || params.get("run")?.toLowerCase() === "showonly";

if (showBuildPanel) {
  toggleBuildPanel();
}

const enableLsp = !params.isExplicitFalse("lsp");
let serverWorkerPromise: Promise<Worker>;
if (enableLsp) {
  serverWorkerPromise = createServer();
} else {
  setClangdStatus("disabled");
  serverWorkerPromise = new Promise<never>(() => {});
}

const userConfig = await createUserConfig(code, serverWorkerPromise, enableLsp);
await createEditor(document.getElementById("editor")!, userConfig);
if (runCodeNow) {
  compileAndRun();
}
