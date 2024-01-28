/// <reference lib="WebWorker" />

import { WORKSPACE_PATH } from "./config";
import { JsonStream } from "./json_stream";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
} from "vscode-languageserver/browser";

declare var self: DedicatedWorkerGlobalScope;

const wasmBase = `${import.meta.env.BASE_URL}wasm/`;
const { default: Clangd } = await import(
  /* @vite-ignore */ `${wasmBase}clangd.js`
);

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
    const nextChunk = /** @type {string} */ stdinChunks.shift();
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
    if (path.endsWith(".data")) {
      prefix = `${import.meta.env.BASE_URL}wasm/`;
    }
    return `${prefix}${path}`;
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
  "-xc++",
  "-std=c++2a",
  "-pedantic-errors",
  "-Wall",
  // "--target=wasm32-wasi",
  "-isystem/usr/include/c++/v1",
  "-isystem/usr/include/",
];

clangd.FS.writeFile("/home/web_user/main.cpp", "");
clangd.FS.writeFile(
  `${WORKSPACE_PATH}/.clangd`,
  JSON.stringify({ CompileFlags: { Add: flags } })
);

function startServer() {
  console.log("%c%s", "font-size: 2em; color: green", "clangd started");
  clangd.callMain([]);
}
startServer();

self.postMessage("ready");

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
