import { getEditorValue } from "./config";
import { runCode } from "./runner";

const status = document.querySelector<HTMLElement>("#status")!;
const toggleThemeBtn =
  document.querySelector<HTMLButtonElement>("#toggleTheme")!;
const buildPanel = document.querySelector<HTMLElement>("#buildPanel")!;
const showBuildPanel = document.querySelector<HTMLElement>("#showBuildPanel")!;
const resizeHandle = document.querySelector<HTMLElement>("#buildPanelResize")!;

const runBtn = document.querySelector<HTMLButtonElement>("#run")!;
const tabs = [
  ...document.querySelectorAll<HTMLButtonElement>("#buildPanelTab > button"),
];
const inputEl =
  document.querySelector<HTMLTextAreaElement>("#buildPanelInput")!;
const outputEl = document.querySelector<HTMLPreElement>("#buildPanelOutput")!;
const closeBtn = document.querySelector<HTMLButtonElement>("#closeBuildPanel")!;

export function toggleBuildPanel() {
  buildPanel.classList.toggle("display-none");
  showBuildPanel.classList.toggle("display-none");
}
showBuildPanel.addEventListener("click", toggleBuildPanel);
closeBtn.addEventListener("click", toggleBuildPanel);

const MINIMUM_HEIGHT = 50;

function resizeMouseDown(e: MouseEvent) {
  let resizing = true;
  let oldHeight = buildPanel.clientHeight;
  let mouseBaseY = e.clientY;
  const resizeMouseUp = () => {
    resizing = false;
    window.removeEventListener("mouseup", resizeMouseUp);
    window.removeEventListener("mousemove", resizeMouseMove);
    if (buildPanel.clientHeight < MINIMUM_HEIGHT) {
      buildPanel.style.removeProperty("--build-panel-height");
      toggleBuildPanel();
      return;
    }
  };
  const resizeMouseMove = (e: MouseEvent) => {
    if (resizing) {
      const diff = mouseBaseY - e.clientY;
      const height = Math.max(oldHeight + diff, 0);
      buildPanel.style.setProperty("--build-panel-height", `${height}px`);
    }
  };
  window.addEventListener("mouseup", resizeMouseUp);
  window.addEventListener("mousemove", resizeMouseMove);
}
resizeHandle.addEventListener("mousedown", resizeMouseDown);

function showInput() {
  inputEl.classList.remove("display-none");
  outputEl.classList.add("display-none");
}
const EMPTY_HINT_HTML = `<span style="user-select: none; color: var(--c-text-light)">No output.</span>`;
function showOutput(text: string) {
  if (text === "") {
    text = EMPTY_HINT_HTML;
  }
  outputEl.innerHTML = text;
  outputEl.classList.remove("display-none");
  inputEl.classList.add("display-none");
}

const tabActions = [
  showInput,
  () => showOutput(output),
  () => showOutput(diagnostics),
];
for (let i = 0; i < tabs.length; i++) {
  tabs[i].addEventListener("click", () => {
    tabs[i].setAttribute("active", "true");
    tabs
      .filter((e) => e !== tabs[i])
      .forEach((e) => e.removeAttribute("active"));
    tabActions[i]();
  });
}

inputEl.addEventListener("input", () => {
  input = inputEl.value;
});

let input = "";
let output = "";
let diagnostics = "";

export function setInput(value: string) {
  input = value;
  inputEl.value = value;
}

export async function compileAndRun() {
  if (buildPanel.classList.contains("display-none")) {
    toggleBuildPanel();
  }
  const inner = [...runBtn.childNodes];
  runBtn.setAttribute("disabled", "true");
  runBtn.innerHTML = "Compiling...";
  try {
    let stdin = input,
      stdout,
      stderr,
      didExecute;
    ({ stdout, stderr, diagnostics, didExecute } = await runCode(
      getEditorValue(),
      { stdin }
    ));
    const outputContainer = document.createElement("pre");
    const stdoutEl = document.createElement("span");
    stdoutEl.innerText = stdout;
    const stderrEl = document.createElement("span");
    stderrEl.innerText = stderr;
    stderrEl.style.setProperty("color", "var(--c-danger)");
    outputContainer.append(stdoutEl, stderrEl);
    output = outputContainer.innerHTML;
    tabs[didExecute ? 1 : 2].click();
  } catch (e) {
    alert(e instanceof Error ? e.message : "Unknown error");
  } finally {
    runBtn.removeAttribute("disabled");
    runBtn.innerHTML = "";
    runBtn.append(...inner);
  }
}
runBtn.addEventListener("click", compileAndRun);

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("color-theme", isDark ? "dark" : "light");
}
toggleThemeBtn.addEventListener("click", toggleTheme);

export function setClangdStatus(status: "ready" | "indeterminate" | "disabled"): void;
export function setClangdStatus(value: number, max: number): void;
export function setClangdStatus(strOrVal: string | number, max?: number) {
  if (typeof strOrVal === "number") {
    status.removeAttribute("data-ready");
    status.removeAttribute("data-disabled");
    status.removeAttribute("data-indeterminate");
    status.style.setProperty("--progress-value", `${strOrVal}`);
    status.style.setProperty("--progress-max", `${max}`);
  } else if (strOrVal === "ready") {
    status.setAttribute("data-ready", "");
    status.removeAttribute("data-disabled");
    status.removeAttribute("data-indeterminate");
  } else if (strOrVal === "disabled") {
    status.removeAttribute("data-ready");
    status.setAttribute("data-disabled", "");
    status.removeAttribute("data-indeterminate");
  } else if (strOrVal === "indeterminate") {
    status.removeAttribute("data-ready");
    status.removeAttribute("data-disabled");
    status.setAttribute("data-indeterminate", "");
  }
}
