// import "@codingame/monaco-vscode-language-pack-zh-hans";
import "monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution";
import { createConfiguredEditor } from "vscode/monaco";
import { editor } from "monaco-editor";
import { initServices } from "monaco-languageclient";

import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { Uri } from "vscode";

import { LIGHT_THEME, DARK_THEME, createTheme } from "./theme";
import {
  FILE_PATH,
  LANGUAGE_ID,
  WORKSPACE_PATH,
  setEditorValueSource,
} from "./config";

const self = globalThis as any;
self.MonacoEnvironment = { getWorker: () => new EditorWorker() };

export async function createEditor(element: HTMLElement, code: string) {
  await initServices({
    workspaceConfig: {
      workspaceProvider: {
        trusted: true,
        workspace: {
          workspaceUri: Uri.file(WORKSPACE_PATH),
        },
        async open() {
          return false;
        },
      },
    },
  });

  createTheme("light", LIGHT_THEME);
  createTheme("dark", DARK_THEME);

  const modelUrl = Uri.parse(FILE_PATH);

  const isDark = document.body.classList.contains("dark");

  element.innerHTML = "";
  const editorInstance = createConfiguredEditor(element, {
    model: editor.createModel(code, LANGUAGE_ID, modelUrl),
    theme: isDark ? "dark" : "light",
    quickSuggestionsDelay: 200,
    automaticLayout: true,
    inlayHints: {
      enabled: "offUnlessPressed",
    },
  });
  setEditorValueSource(
    () => editorInstance.getValue(),
    (value) => editorInstance.setValue(value)
  );
  return editorInstance;
}

function toggleEditorTheme() {
  const isDark = document.body.classList.contains("dark");
  editor.setTheme(isDark ? "dark" : "light");
}
document
  .querySelector("#toggleTheme")!
  .addEventListener("click", toggleEditorTheme);
