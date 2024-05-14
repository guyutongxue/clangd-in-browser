import { COMPILE_ARGS } from "./config";
import { AnsiUp } from "ansi_up";

const COMPILER_EXPLORER_API_BASE = "https://godbolt.org/api";
const COMPILER_ID = "g141";

export interface ExecuteOptions {
  args: string[];
  stdin: string;
}

export interface ExecuteResult {
  didExecute: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  diagnostics: string;
}

const ansiUp = new AnsiUp();

const userArguments = COMPILE_ARGS.map(arg => arg.replace(/(["\s'$`\\])/g, '\\$1')).join(' ');

function stdioToString(stdio: any[]): string {
  return stdio.map((v) => v.text).join("\n");
}

export async function runCode(code: string, opt: Partial<ExecuteOptions> = {}): Promise<ExecuteResult> {
  const { args = [], stdin = "" } = opt;
  const request = {
    source: code,
    compiler: COMPILER_ID,
    options: {
      userArguments,
      executeParameters: {
        args,
        stdin,
        // runtimeTools: []
      },
      compilerOptions: {
        executorRequest: true
      },
      filters: {
        execute: true
      },
      // tools: [],
      // libraries: [],
    },
    lang: "c++",
    // allowStoreCodeDebug: true,
  };
  const response = await fetch(`${COMPILER_EXPLORER_API_BASE}/compiler/${COMPILER_ID}/compile`, {
    method: "POST",
    body: JSON.stringify(request),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }).then((r) => r.json());
  const { code: exitCode, stdout, stderr, didExecute, buildResult } = response;
  return {
    diagnostics: ansiUp.ansi_to_html(stdioToString(buildResult.stderr)),
    exitCode,
    didExecute,
    stdout: stdioToString(stdout),
    stderr: stdioToString(stderr),
  }
}
