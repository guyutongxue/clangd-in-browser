// Use for example
// http://localhost:5173/?locale=zh-hans or
// http://localhost:5173/?locale=fr
// for a localised version
import { initLocalLoader } from "monaco-editor-wrapper/vscode/locale";
await initLocalLoader();

import("./main.ts");
