import { CloseAction, ErrorAction } from "vscode-languageclient";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
} from "vscode-languageclient/browser";
import { MonacoLanguageClient } from "monaco-languageclient";

import ClangdWorker from "./main.worker?worker";
import { LANGUAGE_ID } from "./config";

let lspRunning = false;
let retry = 0;
let succeeded = false;

export async function createLsp() {
  if (lspRunning) {
    console.warn("LSP already running");
  }
  lspRunning = true;
  let clangdResolve = () => {};
  const clangdReady = new Promise<void>((r) => (clangdResolve = r));
  const worker = new ClangdWorker();
  const readyListener = (e: MessageEvent) => {
    if (e.data === "ready") {
      clangdResolve();
      worker.removeEventListener("message", readyListener);
    }
  };
  worker.addEventListener("message", readyListener);
  worker.addEventListener("error", restart);

  await clangdReady;

  const reader = new BrowserMessageReader(worker);
  const writer = new BrowserMessageWriter(worker);
  const readerOnError = reader.onError(() => restart);
  const readerOnClose = reader.onClose(() => restart);
  const successCallback = reader.listen(() => {
    succeeded = true;
    successCallback.dispose();
  });

  const client = new MonacoLanguageClient({
    name: "Monaco Language Client",
    clientOptions: {
      documentSelector: [{ language: LANGUAGE_ID }],
      errorHandler: {
        error: () => ({ action: ErrorAction.Shutdown }),
        closed: () => ({ action: CloseAction.DoNotRestart }),
      },
    },
    connectionProvider: {
      get: async () => ({ reader, writer }),
    },
  });

  async function restart() {
    if (lspRunning) {
      try {
        lspRunning = false;
        await client.stop();
        await client.dispose();
        readerOnError.dispose();
        readerOnClose.dispose();
        writer.end();
        writer.dispose();
        reader.dispose();
        worker.terminate();
      } finally {
        retry++;
        if (retry > 5 && !succeeded) {
          console.error("Failed to start clangd after 5 retries");
          return;
        }
        setTimeout(createLsp, 1000);
      }
    }
  }
  client.start();
}
