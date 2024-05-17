// Add this preload script because `monaco-editor-wrapper/vscode/locale`
// needs to be loaded before **ANY** import of `monaco-editor` stuff.
// Assure that `main.ts` is imported after locale loader initialized.

import { initLocalLoader } from "monaco-editor-wrapper/vscode/locale";
await initLocalLoader();

import("./main.ts");

