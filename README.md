# [Clangd](https://clangd.llvm.org) in Browser

Finally, I made clangd work in browser. You can now get C++ IntelliSense directly without installing any native compiler or relying on a remote server.

This repo contains a build script for clangd on WebAssembly (TBD), and an example of using clangd WASM module together with [Monaco Editor](https://microsoft.github.io/monaco-editor) powered by it's Language Client port (thanks [TypeFox/monaco-languageclient](https://github.com/TypeFox/monaco-languageclient)).

## How to build

I'm working on the build instruction, but you can take a look at `build.sh`.

## Acknowledgement

- [soedirgo/llvm-wasm](https://github.com/soedirgo/llvm-wasm) provides a very detailed guide on how to build LLVM to wasm. Better then famous works like [binji/wasm-clang](https://github.com/binji/wasm-clang) or [tbfleming/cib](https://github.com/tbfleming/cib) (but also thank you guys :P);
- [nokotan/vscode-clangd](https://github.com/nokotan/vscode-clangd) patch vscode's clangd extension with WASM binary to make it work on vscode-web. Some bugs but useful; no build scripts or further documentation;
- [ConorBobbleHat/clangd-wasm](https://github.com/ConorBobbleHat/clangd-wasm) and [ConorBobbleHat/clangd-wasm-core](https://github.com/ConorBobbleHat/clangd-wasm-core); build scripts provided but lack examples on how to use them.

## About the demo

I've publish a [GitHub Page](https://clangd.guyutongxue.site/) for demonstrating how clangd works in the browser. Notice that clangd is a multi-thread program, so we need `SharedArrayBuffer` -- and more over, a strict context called `crossOriginIsolated`. GitHub Pages do not send COOP/COEP headers for us to enabling that context, so a Service Worker [`coi-serviceworker`](https://github.com/gzuidhof/coi-serviceworker) is used here. If you want to deploy this project, it's encourage to set correct COOP/COEP header on the server side (then you can remove those coi stuff on the `<head>` part of `index.html`).

<!--By the way, you should be able to embed this page into your website as a `<iframe>`. I've enabled [iframe-resizer](https://github.com/davidjbradshaw/iframe-resizer) on this page for your convenience.-->
