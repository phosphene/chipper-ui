#!/usr/bin/env bash
# install-hooks.sh — Wire the pre-commit gate into the git submodule.
# Run once after cloning or after git submodule update.
#
# Usage: bash scripts/install-hooks.sh

set -e
cd "$(dirname "$0")/.."

GIT_DIR=$(git rev-parse --git-dir)
HOOKS_DIR="$GIT_DIR/hooks"

echo "Installing DFT pre-commit hook into $HOOKS_DIR..."

cat > "$HOOKS_DIR/pre-commit" <<'HOOK'
#!/usr/bin/env bash
# Auto-installed by scripts/install-hooks.sh
# Runs the DFT + TypeScript gate before every commit.
exec bash "$(git rev-parse --show-toplevel)/scripts/pre-commit-gate.sh"
HOOK

chmod +x "$HOOKS_DIR/pre-commit"
echo "✅ Pre-commit hook installed."
echo ""
echo "The hook will run on every 'git commit' in this repo."
echo "To bypass in exceptional circumstances: git commit --no-verify"
echo "(Only use --no-verify when you can prove the exception is safe.)"
