# T3 Code with text-to-cad

T3 Code with the [text-to-cad](https://github.com/earthtojake/text-to-cad) plugin built in: a
coding agent that designs parts with the plugin's skills, with the CAD view beside the thread. It
is this fork's `amy/text-to-cad` branch, and text-to-cad pins it as `apps/t3code`.

## Run it

From `apps/t3code` in a text-to-cad checkout, after `vp i`:

```sh
vpr text-to-cad            # server and web
vpr text-to-cad:desktop    # the Electron app
```

`scripts/text-to-cad.ts` reads the checkout as a plugin marketplace and turns its `text-to-cad`
plugin on at first start, and keeps state in `~/.t3code-text-to-cad` (never in T3 Code's `~/.t3`).
`TEXT_TO_CAD_ROOT` points at another checkout; `T3CODE_TEXT_TO_CAD_HOME` moves the state.

## What it adds to T3 Code

Everything here is upstream T3 Code plus the fork's plugin support (`amy/plugins`), generic to any
Agent Plugins plugin:

- **Views the agent opens.** When the agent calls a plugin view's tool (`cad_open`), the view
  opens as a tab beside the thread with the call's arguments; a repeat call reruns that tab.
- **Follow the files.** When a run's file edit writes a file a view claims (a `.step`) and no view
  of that plugin is open, the file opens in one. Open views refresh themselves.
- **Bundled plugins.** `T3CODE_PLUGIN_MARKETPLACE` and `T3CODE_DEFAULT_PLUGINS`
  (`apps/server/src/plugins/BundledPlugins.ts`); a plugin the user uninstalls stays uninstalled.
- **Starter prompts.** A new thread offers what the enabled plugins suggest asking first
  (`interface.defaultPrompt`).

## Updating

`main` follows upstream T3 Code; rebase `amy/plugins` on it, then this branch on that.
