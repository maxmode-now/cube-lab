#!/bin/sh
root=$(git rev-parse --show-toplevel) || exit 1
cp "$root/.githooks/pre-commit" "$root/.git/hooks/pre-commit"
chmod +x "$root/.git/hooks/pre-commit" "$root/.githooks/pre-commit" "$root/scripts/bump-version.py"
echo "Installed pre-commit version bump hook."
