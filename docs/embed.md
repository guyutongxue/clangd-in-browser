# Embed to `<iframe>`

You can embed this project into your own website. But you should notice that, because of the use of `SharedArrayBuffer`, you need to set your host server's COOP/COEP headers, and use following `<iframe>` attribute:

```html
<iframe src="https://clangd.guyutongxue.site/?embed" allow="cross-origin-isolated" width="600" height="400">
```

It's recommended to pass `embed` url params, so you can control some behavior like setting editor value or trigger a compile request. You can do so by `contentWindow.postMessage`.

## Message format

Should be a JavaScript object, with following properties:

```ts
interface ClangdInBrowserMessage {
  cdib: "1.0.0";
  id?: any;       // if presented, you will receive a reply
  type: "setCode" | "setInput" | "runCode";
  value?: string; // should provided when setCode / setInput
}
```

`setCode` message will set the editor value with given `value`. `setInput` will set the input textarea to your given `value` (for next time's compile). `runCode` will send a compile request just like pressing "Run code" button in the runner panel.
