export const LANGUAGE_ID = "cpp";
export const WORKSPACE_PATH = "/home/web_user";
export const FILE_PATH = "/home/web_user/main.cpp";

export const COMPILE_ARGS = [
  "-xc++",
  "-std=c++2b",
  "-pedantic-errors",
  "-Wall",
];

const editorValue = {
  get: () => "",
  set: (value: string) => {},
};

export function setEditorValueSource(
  getter: () => string,
  setter: (value: string) => void
) {
  editorValue.get = getter;
  editorValue.set = setter;
}

export function getEditorValue() {
  return editorValue.get();
}
export function setEditorValue(value: string) {
  editorValue.set(value);
}
