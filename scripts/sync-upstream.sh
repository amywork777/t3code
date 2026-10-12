#!/usr/bin/env bash
# Rebase the fork onto upstream T3 Code (see FORK.md).
#   main        = upstream/main + fork-only files (FORK.md, these scripts)
#   amy/plugins = the plugin feature, rebased onto upstream/main
# Stops at the first conflict and says where; nothing is pushed unless --push is given.
set -euo pipefail

push=false
[[ "${1:-}" == "--push" ]] && push=true

root="$(git rev-parse --show-toplevel)"
cd "$root"

if ! git remote get-url upstream >/dev/null 2>&1; then
  git remote add upstream https://github.com/pingdotgg/t3code.git
fi
git fetch upstream main

rebase_branch() {
  local branch="$1" dir
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
  if ! git -C "$dir" rebase upstream/main; then
    echo "conflict rebasing $branch in $dir; resolve, then: git -C $dir rebase --continue" >&2
    exit 1
  fi
  echo "$branch is $(git -C "$dir" rev-list --count upstream/main.."$branch") commit(s) ahead of upstream"
  if $push; then git -C "$dir" push --force-with-lease origin "$branch"; fi
}

rebase_branch main
if git show-ref --verify --quiet refs/heads/amy/plugins; then
  rebase_branch amy/plugins
fi

"$root/scripts/fork-diff.sh" amy/plugins || true
