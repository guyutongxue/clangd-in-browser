import "./style.css";
import { compileAndRun, setClangdStatus, toggleBuildPanel } from "./ui";
import { ExtendedSearchParams } from "./search_params";

if (!globalThis.crossOriginIsolated) {
  document.body.innerHTML =
    "This page requires cross-origin isolation to work properly. You may forget to set server's COOP/COEP headers. If you are using this page as an <iframe>, you should also pass <code>allow=\"cross-origin\"</code> to the <code>iframe</code> element.";
  throw new Error("Cross-origin isolation is not enabled");
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
  `#include <iostream>
#include <format>

int main() {
    std::cout << std::format("Hello, {}!\\n", "world");
}
`;

const runCodeNow = params.isTrue("run");
const showBuildPanel =
  runCodeNow || params.get("run")?.toLowerCase() === "showonly";

if (showBuildPanel) {
  toggleBuildPanel();
}

const disableLsp = params.isExplicitFalse("lsp");
let serverPromise: Promise<Worker>;
if (disableLsp) {
  setClangdStatus("disabled");
  serverPromise = new Promise<never>(() => {});
} else {
  serverPromise = import("./server").then(({ createServer }) => {
    return createServer();
  });
}
import("./client").then(async ({ createEditor, createClient }) => {
  await createEditor(document.getElementById("editor")!, code);
  if (!disableLsp) {
    await createClient(await serverPromise);
  }
  if (runCodeNow) {
    compileAndRun();
  }
});
