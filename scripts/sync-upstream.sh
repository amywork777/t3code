#!/usr/bin/env bash
# Rebase the fork onto upstream T3 Code (see FORK.md).
#   main        = upstream/main + fork-only files (FORK.md, these scripts)
#   amy/plugins = the plugin feature, rebased onto upstream/main
#   amy/hardware = text-to-cad Studio, rebased onto amy/plugins
# Stops at the first conflict and says where; nothing is pushed unless --push is given.
set -euo pipefail

push=false
[[ "${1:-}" == "--push" ]] && push=true

root="$(git rev-parse --show-toplevel)"
cd "$root"
# The root may switch to a branch without these scripts, so keep fork-diff.sh and come back at the end.
start_branch="$(git branch --show-current)"
tools="$(mktemp -d)"
cp "$root/scripts/fork-diff.sh" "$tools/"
trap 'rm -rf "$tools"' EXIT

if ! git remote get-url upstream >/dev/null 2>&1; then
  git remote add upstream https://github.com/pingdotgg/t3code.git
fi
git fetch upstream main

# rebase_branch <branch> [<old base>] [<new base>]: with no bases, onto upstream/main.
rebase_branch() {
  local branch="$1" old_base="${2:-}" new_base="${3:-upstream/main}" dir
  dir="$(git worktree list --porcelain | awk -v b="refs/heads/$branch" '$1=="worktree"{w=$2} $1=="branch" && $2==b {print w}')"
  dir="${dir:-$root}"
  if [[ -n "$(git -C "$dir" status --porcelain)" ]]; then
    echo "skip $branch: uncommitted changes in $dir" >&2
    return 1
  fi
  if [[ "$dir" == "$root" && "$(git branch --show-current)" != "$branch" ]]; then
    git switch -q "$branch"
  fi
  echo "rebasing $branch in $dir"
  local onto=("$new_base")
  [[ -n "$old_base" ]] && onto=(--onto "$new_base" "$old_base")
  if ! git -C "$dir" rebase "${onto[@]}"; then
    echo "conflict rebasing $branch in $dir; resolve, then: git -C $dir rebase --continue" >&2
    exit 1
  fi
  echo "$branch is $(git -C "$dir" rev-list --count "$new_base".."$branch") commit(s) ahead of $new_base"
  if $push; then git -C "$dir" push --force-with-lease origin "$branch"; fi
}

has() { git show-ref --verify --quiet "refs/heads/$1"; }

rebase_branch main
if has amy/plugins; then
  old_plugins="$(git rev-parse amy/plugins)"
  rebase_branch amy/plugins
  # Studio sits on the plugins branch, so it moves with it.
  if has amy/hardware; then rebase_branch amy/hardware "$old_plugins" amy/plugins; fi
fi

if [[ -n "$start_branch" && "$(git branch --show-current)" != "$start_branch" ]]; then
  git switch -q "$start_branch"
fi

"$tools/fork-diff.sh" amy/plugins || true
if has amy/hardware; then
  "$tools/fork-diff.sh" amy/hardware || true
  echo "text-to-cad pins amy/hardware at apps/studio: once it is pushed, git -C apps/studio pull and commit apps/studio there."
fi
