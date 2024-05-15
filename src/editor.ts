import getConfigurationServiceOverride from "@codingame/monaco-vscode-configuration-service-override";
import getTextmateServiceOverride from "@codingame/monaco-vscode-textmate-service-override";
import getThemeServiceOverride from "@codingame/monaco-vscode-theme-service-override";
// this is required syntax highlighting
import "@codingame/monaco-vscode-cpp-default-extension";
import { Uri } from "vscode";
import { BrowserMessageReader, BrowserMessageWriter } from "vscode-languageclient/browser";
import { MonacoEditorLanguageClientWrapper, UserConfig } from "monaco-editor-wrapper";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { setClangdStatus } from "./ui";
import {
  FILE_PATH,
  LANGUAGE_ID,
  WORKSPACE_PATH,
  setEditorValueSource,
} from "./config";

const self = globalThis as any;
self.MonacoEnvironment = { getWorker: () => new EditorWorker() };

let clientRunning = false;
let retry = 0;
let succeeded = false;
const wrapper = new MonacoEditorLanguageClientWrapper();

export const createUserConfig = async (code: string, serverWorker: Worker): Promise<UserConfig> => {
  const recreateLsp = async () => {
    console.log("reloading lsp...");
    wrapper.getLanguageClientWrapper()?.restartLanguageClient(serverWorker, false);
  };

  const restart = async () => {
    if (clientRunning) {
      try {
        clientRunning = false;
        setClangdStatus("indeterminate");
        readerOnError.dispose();
        readerOnClose.dispose();
        wrapper.getLanguageClientWrapper()?.restartLanguageClient(serverWorker, false);
      } finally {
        retry++;
        if (retry > 5 && !succeeded) {
          setClangdStatus("disabled");
          console.error("Failed to start clangd after 5 retries");
          return;
        }
        setTimeout(recreateLsp, 1000);
      }
    }
  };

  const reader = new BrowserMessageReader(serverWorker);
  const writer = new BrowserMessageWriter(serverWorker);
  const readerOnError = reader.onError(() => restart);
  const readerOnClose = reader.onClose(() => restart);
  const successCallback = reader.listen(() => {
    succeeded = true;
    setClangdStatus("ready");
    successCallback.dispose();
  });

  return {
    languageClientConfig: {
      languageId: LANGUAGE_ID,
      name: 'Clangd WASM Language Server',
      options: {
        $type: 'WorkerDirect',
        worker: serverWorker
      },
      clientOptions: {
        documentSelector: [LANGUAGE_ID],
        workspaceFolder: {
          index: 0,
          name: 'workspace',
          uri: Uri.file(WORKSPACE_PATH),
        },
      },
      connectionProvider: {
        get: async () => ({ reader, writer }),
      }
    },
    wrapperConfig: {
      serviceConfig: {
        workspaceConfig: {
          workspaceProvider: {
            trusted: true,
            workspace: {
              workspaceUri: Uri.file(WORKSPACE_PATH),
            },
            async open() {
              return false;
            }
          }
        },
        userServices: {
          ...getConfigurationServiceOverride(),
          ...getTextmateServiceOverride(),
          ...getThemeServiceOverride()
        },
        debugLogging: true
      },
      editorAppConfig: {
        $type: 'extended',
        codeResources: {
          main: {
            text: code,
            uri: FILE_PATH
          }
        },
        userConfiguration: {
          json: createUserConfiguration()
        },
        useDiffEditor: false
      }
    },
    loggerConfig: {
      enabled: true,
      debugEnabled: true
    }
  };
};

export async function createEditor(element: HTMLElement, code: string, serverWorker: Worker) {
  const userConfig = await createUserConfig(code, serverWorker);
  element.innerHTML = "";
  await wrapper.initAndStart(userConfig, element!);
  const editorInstance = wrapper.getEditor()!;

  setEditorValueSource(
    () => editorInstance.getValue(),
    (value) => editorInstance.setValue(value)
  );
  return editorInstance;
}

function createUserConfiguration() {
  const theme = document.body.classList.contains("dark") ? 'Default Dark Modern' : 'Default Light Modern';
  return JSON.stringify({
    'workbench.colorTheme': theme,
    'editor.wordBasedSuggestions': 'off',
    'editor.inlayHints.enabled': 'offUnlessPressed',
    'editor.quickSuggestionsDelay': 200
  });
}

function toggleEditorTheme() {
  wrapper.getMonacoEditorApp()?.updateUserConfiguration(createUserConfiguration());
}
document
  .querySelector("#toggleTheme")!
  .addEventListener("click", toggleEditorTheme);
