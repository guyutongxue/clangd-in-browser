import ClangdWorker from "./main.worker?worker";
import { setClangdStatus } from "./ui";

export async function createServer() {
  let clangdResolve = () => {};
  const clangdReady = new Promise<void>((r) => (clangdResolve = r));
  const worker = new ClangdWorker();
  const readyListener = (e: MessageEvent) => {
    switch (e.data?.type) {
      case "ready": {
        clangdResolve();
        worker.removeEventListener("message", readyListener);
        setClangdStatus("indeterminate");
        break;
      }
      case "progress": {
        setClangdStatus(e.data.value, e.data.max);
        break;
      }
    }
  };
  worker.addEventListener("message", readyListener);
  await clangdReady;
  return worker;
}

