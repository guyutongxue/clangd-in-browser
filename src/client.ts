import "./editor";
import { CloseAction, ErrorAction } from "vscode-languageclient";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
} from "vscode-languageclient/browser";
import { MonacoLanguageClient } from "monaco-languageclient";

import { LANGUAGE_ID } from "./config";
import { createServer } from "./server";

let clientRunning = false;
let retry = 0;
let succeeded = false;

export async function createClient(serverWorker: Worker) {
  if (clientRunning) {
    console.warn("Client already running");
  }
  clientRunning = true;

  serverWorker.addEventListener("error", restart);
  const reader = new BrowserMessageReader(serverWorker);
  const writer = new BrowserMessageWriter(serverWorker);
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
    if (clientRunning) {
      try {
        clientRunning = false;
        await client.stop();
        await client.dispose();
        readerOnError.dispose();
        readerOnClose.dispose();
        writer.end();
        writer.dispose();
        reader.dispose();
        serverWorker.terminate();
      } finally {
        retry++;
        if (retry > 5 && !succeeded) {
          console.error("Failed to start clangd after 5 retries");
          return;
        }
        setTimeout(recreateLsp, 1000);
      }
    }
  }
  client.start();
}

async function recreateLsp() {
  console.log("reloading lsp...");
  const serverWorker = await createServer();
  createClient(serverWorker);
}

export { createEditor } from "./editor";
