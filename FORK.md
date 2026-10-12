# amywork777/t3code

A fork of [pingdotgg/t3code](https://github.com/pingdotgg/t3code) that adds one thing T3 Code
lacks: **plugins**. Everything else (chat, queueing, keep-alive, subagents, per-chat models,
every provider) is upstream T3 Code, unchanged.

## What the fork adds

Plugins in the Codex/Claude plugin format: a folder with `.codex-plugin/plugin.json` or
`.claude-plugin/plugin.json`, MCP servers, skills and MCP App views. Ported from
[elastic](https://github.com/amywork777/elastic) (`src/main/plugins/`).

- **One store.** Settings › Plugins merges the Claude official catalog, `openai/plugins` and
  `earthtojake/text-to-cad`, deduped, each plugin labelled with whether it works here.
- **Installed into T3, not into your agents.** Plugins live under T3's state directory. Nothing is
  written into `~/.claude` or `~/.codex`.
- **Every provider.** The server runs each enabled plugin's MCP servers once per thread and offers
  their tools to the agent through T3's own MCP server, which Claude, Codex, ACP, Cursor and Pi
  already receive. Plugin skills reach Claude through the Agent SDK's `plugins` option.
- **Views as tabs.** A plugin tool with an MCP App view opens in the right panel. A plugin can claim
  file types (text-to-cad claims `.step`, `.stl`, `.glb`…), so Files offers "Open with". The tab
  and the agent talk to the same server process, so they agree on what is open.
- **Own origin per view on desktop.** Each view is served from `mcp-app://<random id>`, because the
  CAD viewer starts module workers from `blob:` URLs, which fail in an opaque-origin frame. Web and
  remote clients fall back to T3's opaque-origin frame; the CAD viewer needs a cadgen change
  (classic workers) to run there.

Where it lives: `packages/plugins` (pure manifest/catalog code), `apps/server/src/plugins/`,
`apps/web/src/components/plugins/`, `packages/contracts/src/plugins.ts`, and the desktop
`mcp-app` scheme. Mobile has no plugin UI yet.

## Staying mergeable

The fork is a thin layer that must rebase cleanly onto upstream `main` at any time.

- New code goes in new files and folders. An edit to an upstream file is a registration seam
  (an RPC entry, a handler line, a layer, a settings nav entry, a right-panel kind), a few lines.
- Do not refactor or reformat upstream code. Do not change upstream behaviour.
- Keep the list of touched upstream files short; `scripts/fork-diff.sh` prints it.

Branches:

- `main` = upstream `main` + this file and the scripts below.
- `amy/plugins` = the plugin feature, rebased onto upstream `main`. It never contains fork-only
  files, so it can become an upstream PR if the maintainers approve the idea.

Sync with upstream:

```sh
scripts/sync-upstream.sh      # fetch upstream, rebase main and amy/plugins, report conflicts
```

## Upstreaming

Upstream does not take unsolicited features (`CONTRIBUTING.md`). The path is an Ideas
discussion first, with screenshots, and a PR only after a maintainer approves the direction.
