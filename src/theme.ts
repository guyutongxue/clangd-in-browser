import { editor } from "monaco-editor";

export const LIGHT_THEME = {
  base: "vs" as editor.BuiltinTheme,
  background: "#ffffff",
  foreground: "#000000",
  activeLine: "#ffffff",
  string: "#a31515",
  number: "#098658",
  keyword: "#0000ff",
  modifier: "#0000ff",
  punctuation: "#000000",
  operator: "#000000",
  comment: "#008000",
  macro: "#af00db",
  type: "#267f99",
  class: "#267f99",
  interface: "#267f99",
  enum: "#267f99",
  namespace: "#267f99",
  typeParameter: "#267f99",
  variable: "#001080",
  parameter: "#001080",
  property: "#001080",
  enumMember: "#001080",
  function: "#795e26",
  method: "#795e26",
};
export const DARK_THEME = {
  base: "vs-dark" as editor.BuiltinTheme,
  background: "#1e1e1e",
  foreground: "#d4d4d4",
  activeLine: "#323232",
  string: "#ce8178",
  number: "#b5cea8",
  keyword: "#569cd6",
  modifier: "#569cd6",
  punctuation: "#d4d4d4",
  operator: "#d4d4d4",
  comment: "#6a9955",
  macro: "#c586c0",
  type: "#4ec9b0",
  class: "#4ec9b0",
  interface: "#4ec9b0",
  enum: "#4ec9b0",
  namespace: "#4ec9b0",
  typeParameter: "#4ec9b0",
  variable: "#9cdcfe",
  parameter: "#9cdcfe",
  property: "#9cdcfe",
  enumMember: "#9cdcfe",
  function: "#dcdcaa",
  method: "#dcdcaa",
};

export function createTheme(name: string, data: typeof LIGHT_THEME): void {
  editor.defineTheme(name, {
    base: data.base,
    inherit: true,
    colors: {
      "editor.background": data.background,
      "editor.lineHighlightBackground": data.activeLine ?? data.background,
    },
    rules: [
      {
        token: "",
        foreground: data.foreground,
      },
      ...Object.keys(data)
        .filter(
          (key) =>
            key !== "base" && key !== "background" && key !== "foreground"
        )
        .map((key) => ({
          token: key,
          foreground: (data as any)[key],
        })),
    ],
  });
}
