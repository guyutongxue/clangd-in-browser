import "./style.css";

import { createEditor } from "./editor";
import { createLsp } from "./client";

const code = `#include <iostream>
#include <format>

int main() {
    std::cout << std::format("Hello, {}!", "world");
}
`;

await createEditor(document.getElementById("editor")!, code);
console.log("loading lsp...");
await createLsp();
