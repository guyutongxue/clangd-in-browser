import ClangdWorker from "./main.worker?worker";

export async function createServer() {
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
  await clangdReady;
  return worker;
}

