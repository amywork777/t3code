# text-to-cad Studio

T3 Code made into a hardware app: agents design parts with the text-to-cad plugin, and the CAD
view follows their work beside the thread. It is this fork's `amy/hardware` branch, and it ships
inside [text-to-cad](https://github.com/earthtojake/text-to-cad) as `apps/studio`.

## Run it

From `apps/studio` in a text-to-cad checkout, after `vp i`:

```sh
vpr studio            # server and web
vpr studio:desktop    # the Electron app
```

`scripts/studio.ts` reads the checkout as a plugin marketplace and turns its `text-to-cad`
plugin on at first start, names the app, and keeps state in `~/.text-to-cad-studio` (never in
T3 Code's `~/.t3`). `TEXT_TO_CAD_ROOT` points at another checkout; `TEXT_TO_CAD_STUDIO_HOME`
moves the state.

## What it adds to T3 Code

Everything else is upstream T3 Code plus the fork's plugins (`FORK.md` on `main`).

- **Views the agent opens.** When the agent calls a plugin view's tool (`cad_open`), the view
  opens as a tab beside the thread with the call's arguments.
- **Follow the files.** When a run writes a file a view claims (a `.step` from an edit, or one a
  shell command built, seen in the turn's checkpoint) and no view of that plugin is open, the file
  opens in one. Open views refresh themselves, and a panel choice made during the run wins.
- **Bundled plugins.** `T3CODE_PLUGIN_MARKETPLACE` and `T3CODE_DEFAULT_PLUGINS`
  (`apps/server/src/plugins/BundledPlugins.ts`); a plugin the user uninstalls stays uninstalled.
- **Starter prompts.** A new thread offers what the enabled plugins suggest asking first
  (`interface.defaultPrompt`).
- **Its own name.** `VITE_APP_BASE_NAME`.

## Updating

`main` follows upstream T3 Code; rebase `amy/plugins` on it, then `amy/hardware` on that.
text-to-cad's copy is refreshed from this branch with its `apps/studio/scripts/sync-studio.sh`.
