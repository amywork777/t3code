// @effect-diagnostics nodeBuiltinImport:off - a launcher that only sets the environment and runs the dev runner.
/**
 * Runs T3 Code with the text-to-cad plugin built in. It lives at `apps/t3code`
 * inside a text-to-cad checkout, so `node scripts/text-to-cad.ts [dev|dev:desktop]`
 * from here:
 *
 * - reads the checkout as a plugin marketplace and installs and enables its
 *   `text-to-cad` plugin on first start (apps/server/src/plugins/BundledPlugins.ts);
 * - keeps its state in `~/.t3code-text-to-cad`, never in T3 Code's own home.
 *
 * TEXT_TO_CAD_ROOT points at another checkout; T3CODE_TEXT_TO_CAD_HOME moves the state.
 */
import * as NodeChildProcess from "node:child_process";
import * as NodeFS from "node:fs";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";

const appRoot = NodePath.dirname(import.meta.dirname);
const checkout = NodePath.resolve(
  process.env.TEXT_TO_CAD_ROOT?.trim() || NodePath.join(appRoot, "..", ".."),
);
if (!NodeFS.existsSync(NodePath.join(checkout, ".claude-plugin", "marketplace.json"))) {
  process.stderr.write(
    `No text-to-cad checkout at ${checkout}. Run this from apps/t3code in text-to-cad, or set TEXT_TO_CAD_ROOT.\n`,
  );
  process.exit(1);
}

const mode = process.argv[2] ?? "dev";
if (mode !== "dev" && mode !== "dev:desktop") {
  process.stderr.write(`Usage: node scripts/text-to-cad.ts [dev|dev:desktop]\n`);
  process.exit(1);
}
const home =
  process.env.T3CODE_TEXT_TO_CAD_HOME?.trim() ||
  NodePath.join(NodeOS.homedir(), ".t3code-text-to-cad");

const run = NodeChildProcess.spawnSync(
  process.execPath,
  [
    NodePath.join(appRoot, "scripts", "dev-runner.ts"),
    mode,
    "--home-dir",
    home,
    ...process.argv.slice(3),
  ],
  {
    cwd: appRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      T3CODE_PLUGIN_MARKETPLACE: checkout,
      T3CODE_DEFAULT_PLUGINS: "text-to-cad",
    },
  },
);
process.exit(run.status ?? 1);
