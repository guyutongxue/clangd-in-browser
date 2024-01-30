# About URL Params

All options are case-insensitive and `true` `false` `1` `0` `on` `off` `yes` `no` `y` `n` are all valid boolean values.

### `code` (`string`)

Set the initial code when showing editor. Defaults to a Hello World program.

### `theme` (`"light"|"dark"`)

Whether use light theme or dark theme. Defaults to user's last time choice or system preference.

### `lsp` (`boolean`)

Whether enable Clangd and Language Client. Defaults to `true`.

### `run` (`boolean|"showOnly"`)

Whether to automatically run the code when editor is ready. If `"showOnly"` is provided, the runner panel is shown but won't run the code. Defaults to `false`.

### `embed` (`boolean`)

Whether enable embed `<iframe>` message handlers [see here](./embed.md). When passing `embed=true`,  [iframe-resizer](https://github.com/davidjbradshaw/iframe-resizer) is also enabled so you can resize to your host container size freely. Defaults to `false`.
