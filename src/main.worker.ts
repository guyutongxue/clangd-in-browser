/// <reference lib="WebWorker" />

import { COMPILE_ARGS, FILE_PATH, WORKSPACE_PATH } from "./config";
import { JsonStream } from "./json_stream";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
} from "vscode-languageserver/browser";

declare var self: DedicatedWorkerGlobalScope;

const wasmBase = `${import.meta.env.BASE_URL}wasm/`;
const wasmUrl = `${wasmBase}clangd.wasm`;
const jsModule = import(  /* @vite-ignore */ `${wasmBase}clangd.js`);

// Pre-fetch wasm, and report progress to main
const wasmResponse = await fetch(wasmUrl);
const wasmSize = wasmResponse.headers.get("Content-Length") ?? __WASM_SIZE__;
const wasmReader = wasmResponse.body!.getReader();
let receivedLength = 0;
let chunks: Uint8Array[] = [];
while (true) {
  const { done, value } = await wasmReader.read();
  if (done) {
    break;
  }
  if (value) {
    chunks.push(value);
    receivedLength += value.length;
    self.postMessage({
      type: "progress",
      value: receivedLength,
      max: Number(wasmSize),
    });
  }
}
const wasmBlob = new Blob(chunks, { type: "application/wasm" });
const wasmDataUrl = URL.createObjectURL(wasmBlob);

const { default: Clangd } = await jsModule;

const textEncoder = new TextEncoder();
let resolveStdinReady = () => {};
const stdinChunks: string[] = [];
const currentStdinChunk: (number | null)[] = [];

const stdin = (): number | null => {
  if (currentStdinChunk.length === 0) {
    if (stdinChunks.length === 0) {
      // Should not reach here
      // stdinChunks.push("Content-Length: 0\r\n", "\r\n");
      console.error("Try to fetch exhausted stdin");
      return null;
    }
    const nextChunk = stdinChunks.shift()!;
    currentStdinChunk.push(...textEncoder.encode(nextChunk), null);
  }
  return currentStdinChunk.shift()!;
};

const LF = 10;
const jsonStream = new JsonStream();

const stdout = (charCode: number) => {
  const jsonOrNull = jsonStream.insert(charCode);
  if (jsonOrNull !== null) {
    // console.log("%c%s", "color: green", jsonOrNull);
    writer.write(JSON.parse(jsonOrNull));
  }
};

let stderrLine = "";
const stderr = (charCode: number) => {
  // if (charCode === LF) {
  //   console.log("%c%s", "color: darkorange", stderrLine);
  //   stderrLine = "";
  // } else {
  //   stderrLine += String.fromCharCode(charCode);
  // }
};

const stdinReady = async () => {
  if (stdinChunks.length === 0) {
    return new Promise<void>((r) => (resolveStdinReady = r));
  }
};

const onAbort = () => {
  writer.end();
  self.reportError("clangd aborted");
};

const clangd = await Clangd({
  thisProgram: "/usr/bin/clangd",
  locateFile: (path: string, prefix: string) => {
    return path.endsWith(".wasm") ? wasmDataUrl : `${prefix}${path}`;
  },
  stdinReady,
  stdin,
  stdout,
  stderr,
  onExit: onAbort,
  onAbort,
});
console.log(clangd);

const flags = [
  ...COMPILE_ARGS,
  "--target=wasm32-wasi",
  "-isystem/usr/include/c++/v1",
  "-isystem/usr/include/wasm32-wasi/c++/v1",
  "-isystem/usr/include",
  "-isystem/usr/include/wasm32-wasi",
];

clangd.FS.writeFile(FILE_PATH, "");
clangd.FS.writeFile(
  `${WORKSPACE_PATH}/.clangd`,
  JSON.stringify({ CompileFlags: { Add: flags } })
);

function startServer() {
  console.log("%c%s", "font-size: 2em; color: green", "clangd started");
  clangd.callMain([]);
}
startServer();

self.postMessage({ type: "ready" });

const reader = new BrowserMessageReader(self);
const writer = new BrowserMessageWriter(self);

reader.listen((data) => {
  // non-ASCII characters cause bad Content-Length. Just escape them.
  const body = JSON.stringify(data).replace(/[\u007F-\uFFFF]/g, (ch) => {
    return "\\u" + ch.codePointAt(0)!.toString(16).padStart(4, "0");
  });
  const header = `Content-Length: ${body.length}\r\n`;
  const delimiter = "\r\n";
  stdinChunks.push(header, delimiter, body);
  resolveStdinReady();
  // console.log("%c%s", "color: red", `${header}${delimiter}${body}`);
});

export {};
