import { setEditorValue } from "./config";
import { setInput, compileAndRun } from "./ui";

console.log("!");
globalThis.addEventListener("message", async (e) => {
  const data = e.data;
  console.log(data);
  if (typeof data !== "object" || data === null) {
    return;
  }
  if (!("cdib" in data)) {
    return;
  }
  if (!["1.0.0"].includes(data.cdib)) {
    console.error("Unsupported message version.");
    return;
  }
  const hasId = "id" in data;
  const id = data.id;
  switch (data.type) {
    case void 0: {
      console.error("Message type not specified.");
      return;
    }
    case "setCode": {
      if (typeof data.value !== "string") {
        console.error("Invalid value type.");
        return;
      }
      setEditorValue(data.value);
      if (hasId) {
        globalThis.postMessage({ cdib: "1.0.0", id, type: "reply:setCode" });
      }
      break;
    }
    case "setInput": {
      if (typeof data.value !== "string") {
        console.error("Invalid value type.");
        return;
      }
      setInput(data.value);
      if (hasId) {
        globalThis.postMessage({ cdib: "1.0.0", id, type: "reply:setInput" });
      }
      break;
    }
    case "runCode": {
      await compileAndRun();
      if (hasId) {
        globalThis.postMessage({ cdib: "1.0.0", id, type: "reply:runCode" });
      }
      break;
    }
  }
});
