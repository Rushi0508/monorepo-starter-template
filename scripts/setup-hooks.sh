#!/usr/bin/env sh
set -eu

git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Clones set up under husky still point git at .husky/_, which blocks lefthook.
if [ "$(git config --local --get core.hooksPath || true)" = ".husky/_" ]; then
	git config --local --unset core.hooksPath
fi

exec lefthook install
