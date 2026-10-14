// @effect-diagnostics nodeBuiltinImport:off - a release helper that copies files and runs the package manager.
/**
 * Writes text-to-cad Studio into a text-to-cad checkout as `apps/studio`, carrying only
 * what the server, web and desktop apps need to run, build, lint and test:
 *
 *   node scripts/export-studio.ts <text-to-cad>/apps/studio [ref]
 *
 * T3 Code's mobile app, marketing site, relay, docs, release tooling and repository chrome
 * stay here. The copy installs no git hooks (text-to-cad owns its own), keeps only the
 * package scripts whose files came along, keeps only the patches for packages it still
 * installs, and gets a lockfile for exactly that set.
 */
import * as NodeChildProcess from "node:child_process";
import * as NodeFS from "node:fs";
import * as NodePath from "node:path";

const KEEP = [
  "apps/desktop",
  "apps/server",
  "apps/web",
  "packages",
  "brand",
  "assets",
  "oxlint-plugin-t3code",
  // Desktop dev compiles the Linux browser helper; the web terminal builds from libghostty-vt.
  "native/browser-secret",
  "native/libghostty-vt",
  // The dev runner, the Studio launcher, and the root scripts the apps' configs import.
  "scripts/dev-runner.ts",
  "scripts/dev-runner.test.ts",
  "scripts/studio.ts",
  "scripts/apply-web-brand-assets.ts",
  "scripts/lib/brand-assets.ts",
  "scripts/lib/brand-assets.test.ts",
  "scripts/lib/cli-executable-imports.ts",
  "scripts/lib/cli-external-packages.ts",
  "scripts/lib/cli-external-packages.test.ts",
  "scripts/lib/desktop-external-packages.ts",
  "scripts/lib/dev-share.ts",
  "scripts/lib/dev-share.test.ts",
  "scripts/lib/public-config.ts",
  "scripts/lib/public-config.test.ts",
  // Its test pins the mobile app's GhosttyKit notice, so it stays with the mobile app.
  "scripts/lib/third-party-licenses.ts",
  "scripts/package.json",
  "scripts/tsconfig.json",
  "patches",
  ".gitattributes",
  ".gitignore",
  "LICENSE",
  "STUDIO.md",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "third-party-licenses.config.json",
  "tsconfig.base.json",
  "vite.config.ts",
];

const forkRoot = NodePath.dirname(import.meta.dirname);
const [target, ref = "HEAD"] = process.argv.slice(2);
if (!target) {
  process.stderr.write("Usage: node scripts/export-studio.ts <text-to-cad>/apps/studio [ref]\n");
  process.exit(1);
}
const dest = NodePath.resolve(target);
// The copy replaces dest whole, so dest must be a text-to-cad checkout's apps/studio.
if (
  NodePath.basename(dest) !== "studio" ||
  !NodeFS.existsSync(NodePath.join(dest, "..", "..", ".claude-plugin", "marketplace.json"))
) {
  process.stderr.write(`${dest} is not apps/studio in a text-to-cad checkout.\n`);
  process.exit(1);
}

const run = (command: string, args: string[], cwd: string, env = process.env) =>
  NodeChildProcess.execFileSync(command, args, { cwd, env, encoding: "utf8", stdio: "pipe" });

NodeFS.rmSync(dest, { recursive: true, force: true });
NodeFS.mkdirSync(dest);
const archive = NodeChildProcess.spawnSync("git", ["archive", ref, "--", ...KEEP], {
  cwd: forkRoot,
  maxBuffer: 1 << 30,
});
if (archive.status !== 0) throw new Error(archive.stderr.toString());
NodeChildProcess.execFileSync("tar", ["-x", "-C", dest], { input: archive.stdout });

const read = (file: string) => NodeFS.readFileSync(NodePath.join(dest, file), "utf8");
const write = (file: string, text: string) => NodeFS.writeFileSync(NodePath.join(dest, file), text);

// package.json: no git hooks, and only the scripts whose files and packages came along.
const workspaceNames = new Set(
  ["apps", "packages"].flatMap((group) =>
    NodeFS.readdirSync(NodePath.join(dest, group)).flatMap((name) => {
      const manifest = NodePath.join(dest, group, name, "package.json");
      return NodeFS.existsSync(manifest)
        ? [JSON.parse(NodeFS.readFileSync(manifest, "utf8")).name]
        : [];
    }),
  ),
);
const scriptCameAlong = (command: string) =>
  [...command.matchAll(/(?:^|\s)\.?\/?((?:scripts|native|apps|packages)\/[^\s"'*]+)/g)].every(
    ([, path]) => NodeFS.existsSync(NodePath.join(dest, path!)),
  ) &&
  [...command.matchAll(/--filter\s+([^\s.'][^\s']*)/g)].every(([, name]) =>
    workspaceNames.has(name),
  );
const manifest = JSON.parse(read("package.json"));
manifest.scripts = Object.fromEntries(
  Object.entries(manifest.scripts as Record<string, string>)
    .filter(([, command]) => scriptCameAlong(command))
    .map(([name, command]) => [
      name,
      name === "prepare" ? command.replace("vp config", "vp config --no-hooks") : command,
    ]),
);
// Tools for files that stay behind: CodeRabbit's config and knip's dead-code scan.
for (const name of ["@coderabbitai/config", "knip"]) delete manifest.devDependencies[name];
write("package.json", `${JSON.stringify(manifest, null, 2)}\n`);

// A lockfile for the kept workspaces. pnpm refuses patches for packages it no longer
// installs, so resolve once allowing them, then keep only the patches still in use.
const install = () =>
  run("vp", ["install", "--lockfile-only", "--ignore-scripts"], dest, {
    ...process.env,
    VP_GIT_HOOKS: "0",
  });
const workspace = read("pnpm-workspace.yaml");
write("pnpm-workspace.yaml", `${workspace}\nallowUnusedPatches: true\n`);
install();
// The lockfile names a patched package as `name@version(patch_hash=...)`.
const locked = read("pnpm-lock.yaml");
const patchLine = /^ {2}("?)(.+@[^@":]+)\1: (patches\/\S+)$/;
const isLocked = (pkg: string) =>
  locked.includes(`'${pkg}(patch_hash=`) || locked.includes(` ${pkg}(patch_hash=`);
const unused = workspace.split("\n").flatMap((line) => {
  const match = patchLine.exec(line);
  return match && !isLocked(match[2]!) ? [{ line, file: match[3]! }] : [];
});
write(
  "pnpm-workspace.yaml",
  workspace
    .split("\n")
    .filter((line) => !unused.some((patch) => patch.line === line))
    .join("\n"),
);
for (const patch of unused) NodeFS.rmSync(NodePath.join(dest, patch.file));
install();

const commit = run("git", ["rev-parse", "--short=10", ref], forkRoot).trim();
process.stdout.write(
  `Wrote ${dest} from ${commit}, leaving out ${unused.length} unused patches.\n` +
    `In text-to-cad: git add -A apps/studio, and commit with ${commit} in the message.\n`,
);
