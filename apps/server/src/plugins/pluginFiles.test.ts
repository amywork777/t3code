// @effect-diagnostics nodeBuiltinImport:off -- fixtures are git repositories on disk.
import * as NodeChildProcess from "node:child_process";
import * as NodeFS from "node:fs";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";

import { afterEach, describe, expect, it } from "vite-plus/test";

import { GitError, shallowClone } from "./pluginFiles.ts";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) NodeFS.rmSync(root, { recursive: true, force: true });
});

/** A repository with one commit, and a scratch folder beside it. */
function fixture() {
  const root = NodeFS.mkdtempSync(NodePath.join(NodeOS.tmpdir(), "plugin-files-"));
  roots.push(root);
  const repo = NodePath.join(root, "repo");
  const git = (...args: string[]) =>
    NodeChildProcess.execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  NodeFS.mkdirSync(repo);
  git("init", "-q", "-b", "main");
  NodeFS.writeFileSync(NodePath.join(repo, "plugin.json"), "{}");
  git("add", ".");
  git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "one");
  return { root, url: `file://${repo}`, commit: git("rev-parse", "HEAD") };
}

describe("shallowClone", () => {
  it("clones a branch and a pinned commit", async () => {
    const { root, url, commit } = fixture();
    expect(await shallowClone(url, NodePath.join(root, "a"), { ref: "main" })).toBe(commit);
    expect(await shallowClone(url, NodePath.join(root, "b"), { sha: commit })).toBe(commit);
  });

  it("refuses a url, ref or sha git would read as an option", async () => {
    const { root, url } = fixture();
    const marker = NodePath.join(root, "pwned");
    const upload = `--upload-pack=touch ${marker}`;
    await expect(shallowClone(url, NodePath.join(root, "c"), { ref: upload })).rejects.toThrow(
      GitError,
    );
    await expect(shallowClone(url, NodePath.join(root, "d"), { sha: upload })).rejects.toThrow(
      GitError,
    );
    await expect(shallowClone(upload, NodePath.join(root, "e"))).rejects.toThrow(GitError);
    expect(NodeFS.existsSync(marker)).toBe(false);
  });
});
