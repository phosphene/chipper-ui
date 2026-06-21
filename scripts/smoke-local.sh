#!/usr/bin/env bash
# smoke-local.sh — run before every push
# Starts Next.js dev server, runs critical E2E smoke tests, exits with CI result.
# Usage: bash scripts/smoke-local.sh
# Fails fast on any of:
#   - TypeScript errors
#   - Single-page constraint violated (URL changed after evaluate)
#   - Reading panel not appearing inline
#   - workspace-panels gone after evaluate

set -e
cd "$(dirname "$0")/.."

echo "=== TypeScript check ==="
npx tsc --noEmit

echo "=== Starting dev server ==="
npm run dev &
DEV_PID=$!
trap "kill $DEV_PID 2>/dev/null" EXIT

# Wait for server
for i in $(seq 1 20); do
  curl -sf http://localhost:3000 > /dev/null 2>&1 && break
  sleep 1
done

echo "=== Running smoke E2E ==="
BASE_URL=http://localhost:3000 npx playwright test \
  --grep "no page navigation|reading panel appears inline|workspace-panels present|entry text field" \
  --reporter=line

echo "=== Smoke passed ==="
