# text-to-cad Studio

T3 Code made into a hardware app: agents design parts with the text-to-cad plugin, and the CAD
view follows their work beside the thread. It is this fork's `amy/hardware` branch, pinned inside
[text-to-cad](https://github.com/earthtojake/text-to-cad) as the `apps/studio` submodule.

## Run it

In a text-to-cad checkout, `git submodule update --init apps/studio`, then from `apps/studio`,
after `vp i`:

```sh
vpr studio            # server and web
vpr studio:desktop    # the Electron app
```

`scripts/studio.ts` reads the checkout as a plugin marketplace and turns its `text-to-cad`
plugin on at first start, brands the app from `brand/`, and keeps state in `~/.text-to-cad-studio` (never in
T3 Code's `~/.t3`). `TEXT_TO_CAD_ROOT` points at another checkout; `TEXT_TO_CAD_STUDIO_HOME`
moves the state.

## What it adds to T3 Code

Everything else is upstream T3 Code plus the fork's plugins (`FORK.md` on `main`).

- **Views the agent opens.** When the agent calls a plugin view's tool (`cad_open`), the view
  opens as a tab beside the thread with the call's arguments.
- **Follow the files.** When a run's file edit writes a file a view claims (a `.step`) and no view
  of that plugin is open, the file opens in one. Models a shell command builds arrive through the
  agent's own `cad_open` or `cad_show`. Open views refresh themselves, and a panel choice made during the run wins.
- **Bundled plugins.** `T3CODE_PLUGIN_MARKETPLACE` and `T3CODE_DEFAULT_PLUGINS`
  (`apps/server/src/plugins/BundledPlugins.ts`); a plugin the user uninstalls stays uninstalled.
- **Starter prompts.** A new thread offers what the enabled plugins suggest asking first
  (`interface.defaultPrompt`).
- **text-to-cad's brand.** `brand/` holds text-to-cad's own mark, icons and accent (its README
  says where each comes from). `T3CODE_BRAND_DIR` puts them in the page title, favicons, the
  sidebar and welcome mark, the default accent (a theme the user picks keeps its colors) and the
  desktop dock icon (`apps/web/vite/brand.ts`); `VITE_APP_BASE_NAME` names the app, its assistant
  messages and the desktop window. Other mentions of T3 Code stay: they describe T3's own
  machinery (T3 Connect, its desktop updates), and rewording them would make every rebase
  conflict.

## Updating

One command takes in a new T3 Code: from the fork's `main` checkout,
`scripts/sync-upstream.sh --push` rebases `main` onto upstream, `amy/plugins` onto that, and
`amy/hardware` onto `amy/plugins`, stopping at the first conflict. Then bump text-to-cad's pin:
`git -C apps/studio pull` and commit `apps/studio`.

Rebases stay clean because the branch adds files rather than editing T3's: an edit to an upstream
file is a seam of a line or a few (`scripts/fork-diff.sh amy/hardware` lists them). Keep it that
way: new behaviour goes in new files, and a T3 string or style is changed through `brand/`, not
in place.
