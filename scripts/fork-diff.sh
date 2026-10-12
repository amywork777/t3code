#!/usr/bin/env bash
# Print how far a fork branch reaches into upstream files (see FORK.md, "Staying mergeable").
# New files are listed separately; edits to upstream files should stay few and small.
set -euo pipefail

branch="${1:-amy/plugins}"
base="$(git merge-base upstream/main "$branch")"

echo "== edits to upstream files ($branch vs upstream/main)"
git diff --numstat --diff-filter=M "$base" "$branch" | awk '{printf "  +%-4s -%-4s %s\n", $1, $2, $3}'
echo "== new files"
git diff --name-only --diff-filter=A "$base" "$branch" | sed 's/^/  /'
