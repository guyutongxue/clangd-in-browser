# [Clangd](https://clangd.llvm.org) in Browser

Finally, I made clangd work in browser. You can now get C++ IntelliSense directly without installing any native compiler or rely on a remote server.

This repo contains a build script for clangd on WebAssembly (TBD), and an example of using clangd WASM module together with [Monaco Editor](https://microsoft.github.io/monaco-editor) powered by it's Language Client port (thanks [TypeFox/monaco-languageclient](https://github.com/TypeFox/monaco-languageclient)).

## How to build

I'm working on the build instruction, but you can take a look at `build.sh`.

## Acknowledgement

- [soedirgo/llvm-wasm](https://github.com/soedirgo/llvm-wasm) provides a very detailed guide on how to build LLVM to wasm. Better then famous works like [binji/wasm-clang](https://github.com/binji/wasm-clang) or [tbfleming/cib](https://github.com/tbfleming/cib) (but also thank you guys :P);
- [nokotan/vscode-clangd](https://github.com/nokotan/vscode-clangd)pPatch vscode's clangd extension with WASM binary to make it work on vscode-web. Some bugs but useful; no build scripts or further documentation;
- [ConorBobbleHat/clangd-wasm](https://github.com/ConorBobbleHat/clangd-wasm) and [ConorBobbleHat/clangd-wasm-core](https://github.com/ConorBobbleHat/clangd-wasm-core); build scripts provided but lack examples on how to use them.