#!/usr/bin/env bash
# pre-commit-gate.sh
#
# Deterministic pre-commit gate for chipper-ui.
# Enforces DFT testid coverage and TypeScript correctness BEFORE a commit lands.
# Blocks commits that would break the acceptance test contract.
#
# Install as a git hook:
#   bash scripts/install-hooks.sh
#
# Or run manually:
#   bash scripts/pre-commit-gate.sh

set -e
cd "$(dirname "$0")/.."

PASS=0
FAIL=0

step() {
  echo ""
  echo "─── $1 ───────────────────────────────────────"
}

ok() {
  echo "  ✅ $1"
  PASS=$((PASS + 1))
}

fail() {
  echo "  ❌ $1"
  FAIL=$((FAIL + 1))
}

# ── Step 1: TypeScript ───────────────────────────────────────────────────────
step "TypeScript check"
if npx tsc --noEmit 2>&1; then
  ok "TypeScript clean"
else
  fail "TypeScript errors — fix before committing"
fi

# ── Step 2: DFT testid audit ─────────────────────────────────────────────────
step "DFT testid coverage audit"
if npx tsx scripts/dft-audit.ts; then
  ok "DFT coverage complete"
else
  fail "DFT testid gaps — add data-testid to components before committing"
fi

# ── Step 3: Vitest unit tests ────────────────────────────────────────────────
step "Unit tests (Vitest)"
if npm run test 2>&1; then
  ok "Unit tests green"
else
  fail "Unit test failures — fix before committing"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  Pre-commit gate: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════════"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "❌ Commit blocked. Fix the above failures."
  echo ""
  echo "Note: If Playwright E2E tests are needed, run:"
  echo "  bash scripts/smoke-local.sh        (local dev server)"
  echo "  npm run test:e2e:live               (against live Fly.io)"
  echo ""
  echo "Never claim UI behavior works until a Playwright test proves it."
  exit 1
fi

echo "✅ All checks passed. Commit allowed."
