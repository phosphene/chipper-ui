# chipper-ui

**Live:** https://chipper-ui.fly.dev  
**API:** https://wci-api.fly.dev  
**Repo:** `phosphene/chipper-ui` (submodule of `phosphene/woodchipper` at `frontend/`)

React/Next.js frontend for Woodchipper — the ceremony-driven interface for work classification, evaluation, and routing.

---

## Quick start

```bash
# Clone via woodchipper (recommended — picks up deploy config)
git clone git@github-woodchipper:phosphene/woodchipper.git
git submodule update --init frontend
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Or standalone:
```bash
git clone git@github-chipper-ui:phosphene/chipper-ui.git
npm install
npm run dev
```

---

## Stack

### Core

| Tool | Version | Notes |
|------|---------|-------|
| **Next.js** | 16.2.7 | App Router, SSR. No static export — runs as a server in Docker/Fly.io. |
| **React** | 19.2.4 | — |
| **TypeScript** | 6.0.3 | `strict: true`, `target: ES2017`, `module: esnext`, `lib: ["dom","dom.iterable","esnext"]` |
| **Tailwind CSS** | 4.x | Utility classes only. No CSS modules, no inline `style={{}}`. |
| **Node** | 22 (Alpine in Docker) | — |

### State & logic

| Tool | Version | Role |
|------|---------|------|
| **Zustand** | 5.0.14 | Global ceremony store — pure TypeScript, zero React imports, independently testable. `store/ceremony.ts` owns all state transitions. Invariants throw rather than silently no-op. |
| **XState v5** | 5.32.1 | All stateful UI logic with >2 transitions. `setup()` pattern with fully typed context and events. Never `useState` for domain state. |
| **@xstate/react** | 6.1.0 | `useMachine()` / `useActor()` for component binding. Views are passive observers of machine state. |
| **@effect/schema** | 0.75.5 | All data contracts — schemas are the source of truth, not raw TypeScript interfaces. No Zod, no Yup. |
| **effect** | 3.21.4 | I/O, error handling, dependency injection in logic layer. |

### Testing

| Tool | Version | Role |
|------|---------|------|
| **Vitest** | 4.1.9 | Unit and component tests. jsdom environment. Globals mode. |
| **@testing-library/react** | 16.3.2 | Component rendering in tests. |
| **@testing-library/user-event** | 14.6.1 | Realistic user interaction simulation. |
| **@playwright/test** | 1.60.0 | E2E browser tests against live URL. `toHaveScreenshot` for visual baselines. |
| **@axe-core/playwright** | 4.11.3 | WCAG 2.1 AA accessibility auditing in E2E. |
| **Vite** | 8.0.16 | Build + test tooling. |
| **@vitejs/plugin-react** | 6.0.2 | JSX transform + React 19 dev build resolution for RTL. |

**React 19 gotcha:** React 19 only exports `act()` from the development CJS build. Without `define: { 'process.env.NODE_ENV': JSON.stringify('test') }` in `vitest.config.ts`, RTL fails silently with `React.act is not a function`. The config forces Vite to resolve the dev build during test runs.

---

## Architecture

The UI implements a five-layer entry architecture before any evaluation begins. WCI is never shown in Layers 1–5.

```
┌─────────────────────────────────────────────────────┐
│  Layer 1  Stage 1 + Stage 2                         │
│           Stage 1: description → upload → details   │
│                    → role → domain                  │
│           Detection: /api/detect → chips → confirm  │
│           Stage 2: maker declaration + work type     │
├─────────────────────────────────────────────────────┤
│  Layer 2  Intent selection                          │
│           Assess / Develop / Publish / Register     │
├─────────────────────────────────────────────────────┤
│  Layer 3  Route selection                           │
│           Per-intent route cards.                   │
│           ← WCI "Credibility evaluation" first      │
│             appears here, under Assess only.        │
├─────────────────────────────────────────────────────┤
│  Layer 4  Confirmation                              │
│           GOV.UK check-your-answers. Every value    │
│           shown with a Change link.                 │
├─────────────────────────────────────────────────────┤
│  Layer 5  Review + Begin                            │
│           Plain-language scope statement.           │
│           "Begin" → store.advanceStage()            │
└─────────────────────────────────────────────────────┘
         ↓ (if Credibility evaluation selected)
┌─────────────────────────────────────────────────────┐
│  WCI Ceremony (dikaiopompeia)                       │
│  Opening → Beats I–V → Threshold → Processing      │
│  → Pronouncement → Recording                        │
└─────────────────────────────────────────────────────┘
         ↓ (post-ceremony)
┌─────────────────────────────────────────────────────┐
│  Service Board                                      │
│  Solemn palette (beige/gold/walnut).                │
│  Flow performs services. Mock logic currently.      │
│  Real API: woodchipper-services (T-370–T-374).      │
└─────────────────────────────────────────────────────┘
```

### The Trio pattern (per-feature file structure)

Every non-trivial feature follows this layout:

```
components/[domain]/[feature]/
  [feature].schema.ts      # Effect Schema — data contracts
  [feature].machine.ts     # XState v5 — state graph
  [feature].logic.ts       # Effect — pure functions, DI for I/O
  [feature].view.tsx        # React — passive shell, observes actor
  [feature].spec.ts        # Vitest — machine transition tests
  [feature].e2e.ts         # Playwright — BDD acceptance tests
```

One layer per file. A change in `.machine.ts` must not require editing `.view.tsx`.

### File tree

```
components/
├── entry/                 # Layers 1–5
│   ├── DomainPicker       # 30-discipline taxonomy with subtopic cascade
│   ├── DetectionChips     # Detection-first chips (pending/confirmed/edited states)
│   ├── Stage2             # Maker declaration + work classification
│   ├── IntentSelection    # Layer 2
│   ├── RouteSelection     # Layer 3
│   ├── ConfirmationScreen # Layer 4 — check your answers
│   └── ReviewScreen       # Layer 5 — begin
├── workspace/
│   └── ProgressiveForm    # Rising form — sections compress upward on completion
├── service/               # Post-ceremony service board
│   ├── service-board.*    # Schema, machine, logic, view
│   ├── ServiceNode        # Node card: pending/active/complete/stub/failed
│   ├── ServiceOptions     # Checkboxes filtered by work_type/standing
│   ├── ResultsPanel       # Corrected paper + receipt download
│   └── Receipt            # Receipt document
├── ceremony/              # WCI ceremony (only via Layer 3 route)
│   ├── CeremonyFlow       # Orchestrator
│   ├── stages/            # StageI–StageV
│   ├── Threshold          # Consent gate
│   ├── Processing         # Scoring animation
│   ├── Pronouncement      # Score as a reading
│   └── Recording          # Consent architecture
├── boards/
│   └── LiveBoard          # Live evaluation board canvas
└── lib/
    └── export.ts          # Pure export logic — buildMarkdown(), buildJSON()

store/
├── ceremony.ts            # Zustand store — all state transitions
├── ceremony.types.ts      # Types: WCIResult, Band, Dimension, etc.
└── ceremony.selectors.ts  # Pure selectors

hooks/
├── useDetection.ts        # /api/detect integration
└── useProcessingAnimation.ts

scripts/
└── dft-audit.ts           # DFT testid enforcement (see below)
```

---

## Building

### Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

`NEXT_PUBLIC_API_URL` defaults to `https://wci-api.fly.dev` in dev. Override:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

### Docker

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://wci-api.fly.dev \
  --build-arg CACHE_BUST=$(date +%s) \
  -t chipper-ui .
docker run -p 3000:3000 chipper-ui
```

**Critical:** `NEXT_PUBLIC_API_URL` is baked into the JS bundle at build time (Next.js `NEXT_PUBLIC_` convention). Setting it at runtime has no effect. It must be passed as a `--build-arg`. This was a production bug (BUG-001 in `regressions.spec.ts`) — buttons appeared to work but all API calls silently went to `localhost:8000`.

**Cache busting:** Fly.io's remote builder caches Docker layers by content hash. Without `--build-arg CACHE_BUST=$(date +%s)`, a deploy that changes only a config file will reuse the old JS bundle. Always pass `CACHE_BUST` on deploy (BUG-002 in `regressions.spec.ts`).

### Production deploy (Fly.io)

Deployment is handled by the woodchipper repo's CI workflow, not this repo directly.

```bash
# From woodchipper root:
cd frontend
cp ../deploy/fly.chipper-ui.toml fly.toml
flyctl deploy --remote-only --build-arg CACHE_BUST=$(date +%s)
```

Fly.io config: `deploy/fly.chipper-ui.toml` in woodchipper
- App: `chipper-ui` (region: `iad`)
- Memory: 256MB shared CPU
- Auto-stop/start: enabled (scales to zero when idle)
- HTTPS enforced

---

## Testing

### Test pyramid

```
Playwright E2E          slow, real browser, ground truth
(tests/e2e/*.spec.ts)   runs on Hetzner server
        ↑
RTL snapshots           medium, jsdom, structural regression
(components/**/*.test.tsx)
        ↑
Vitest unit             fast, no browser, machine transitions + logic
(store/, hooks/, lib/)
```

**Current:** 223 unit/component tests · 6 visual baselines · E2E suite (entry layer, export, ceremony path, service board, regressions, accessibility)

### Running tests

```bash
npm run test              # Vitest — all unit + component tests
npm run test:watch        # watch mode
npm run test:coverage     # with v8 coverage report

npm run test:e2e:live     # Playwright against chipper-ui.fly.dev
```

### Why E2E runs on Hetzner

Playwright requires system libraries (`libatk-1.0.so.0`, `libgbm1`, etc.) that aren't available on Amazon Linux (this sandbox). The Hetzner server has them. E2E runs there via SSH:

```bash
ssh -i /home/node/.ssh/observatory_prod root@144.76.166.36
cd /tmp/chipper-test
BASE_URL=https://chipper-ui.fly.dev npx playwright test --reporter=line
```

The CI workflow installs them with `--with-deps` on Ubuntu runners, so CI E2E works fine. Local E2E requires Hetzner or a Linux machine with the deps.

### E2E test files

| File | What it proves |
|------|----------------|
| `functional.spec.ts` | Entry field, evaluate button, evaluation flow, board toggle, API connectivity |
| `entry-layer.spec.ts` | Full Layers 1–5 flow + WCI containment assertions |
| `export.spec.ts` | MD/JSON download, PDF new tab, Copy button |
| `ceremony-path.spec.ts` | Full ceremony walk — 8 beats, testids only |
| `service-board.spec.ts` | Service board flow — select, request, node states, results |
| `regressions.spec.ts` | BUG-001–007 — every production bug has a named test proving the fix |
| `accessibility.spec.ts` | axe WCAG 2.1 AA scans |
| `snapshots.spec.ts` | `toHaveScreenshot` visual baselines — 6 ceremony states |
| `label-logic.spec.ts` | Label accuracy, → symbol, mode toggle |

### Writing a new test

**Unit (Vitest):**
```typescript
// store/myfeature.test.ts
import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { myMachine } from '../components/myfeature/myfeature.machine'

describe('myMachine', () => {
  it('transitions idle → active on START', () => {
    const actor = createActor(myMachine)
    actor.start()
    actor.send({ type: 'START' })
    expect(actor.getSnapshot().value).toBe('active')
  })
})
```

**Component snapshot (RTL):**
```typescript
// components/myfeature/MyComponent.test.tsx
import { render } from '@testing-library/react'
import { MyComponent } from './MyComponent'

it('renders correctly', () => {
  const { container } = render(<MyComponent prop="value" />)
  expect(container).toMatchSnapshot()
})
```

Update snapshots deliberately: `npx vitest run --update-snapshots`

**E2E (Playwright):**
```typescript
// tests/e2e/myfeature.spec.ts
import { test, expect } from '@playwright/test'

test('user can complete the flow', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-testid="my-input"]').fill('something')
  await page.locator('[data-testid="my-proceed"]').click()
  await expect(page.locator('[data-testid="my-result"]')).toBeVisible()
})
```

**Rule:** select by `data-testid` only. Never by CSS class, text content, or DOM position.

---

## Design for Testability (DFT)

### The problem with frontend acceptance testing

Frontend testing has a fundamental adversarial relationship with the UI it's testing.

**The DOM is a moving target.** CSS class names change, text copy changes, DOM structure changes. Tests that assert on class names or strings break on every cosmetic update and become maintenance noise. The team learns to ignore failures.

**JavaScript hydration is invisible.** A page can render HTML that looks correct but has no working JavaScript attached. Buttons that appear clickable do nothing. `curl` and HTML inspection cannot detect this — only a real browser running real JS proves hydration. This was BUG-002: buttons appeared active but React hadn't hydrated because Docker was serving a cached build with a broken JS chunk. The fix required Playwright; curl said everything was fine.

**Timing is hostile.** Animations, artificial delays (used deliberately for epistemic weight in this product), and async API calls create windows where a test can interact before an element is ready. `waitForTimeout(5000)` is a lie — it passes on a fast machine and fails under load. The solution is `data-state` attributes signaling readiness: `waitForSelector('[data-state="ready"]')` instead of arbitrary sleeps.

**System deps make local headless Playwright hard.** See "Why E2E runs on Hetzner" above.

### How we solve it

**Semantic handles, not CSS.** Every interactive element gets a `data-testid` written before the component (DFT-first). Tests assert on `[data-testid="stage2-proceed"]`, not `.btn-primary`. The testid is a contract between implementation and test.

**State on the DOM.** Timed elements expose `data-state="waiting|ready|complete"` so Playwright can wait for state, not the clock.

**Never claim UI works without a test.** A verified claim requires a Playwright test that passes. HTML inspection, curl, and visual checks are not proof. This rule was hard-won — it was violated repeatedly in early builds, Jan tested on his phone and found things broken that I had claimed worked.

**TDD for acceptance tests.** Write the Playwright test first against the broken state (RED). Implement. Verify GREEN. A test that passes before the implementation exists has no value. The RED state is the proof the test catches real failures.

### DFT enforcement — three layers

**Layer 1 — Pre-commit hook** (local, instant)  
Install once: `npm run hooks:install`  
Blocks every `git commit` that fails TypeScript, has missing required testids, or has failing Vitest tests.

```bash
npm run gate               # run the full pre-commit gate manually
npm run dft:audit          # check testid coverage (soft warnings)
npm run dft:audit:strict   # hard fail if any testid lacks E2E assertion
npm run hooks:install      # wire pre-commit hook into git
```

**Layer 2 — `scripts/dft-audit.ts`** (standalone)  
Static analysis: reads all component source files, checks every testid in `REQUIRED_TESTIDS` is present. Cross-references E2E test files to verify each testid has at least one assertion.

When you add a new interactive element:
1. Add it to `REQUIRED_TESTIDS` in `scripts/dft-audit.ts` first
2. Add `data-testid` to the component
3. Write the E2E assertion
4. Run `npm run gate` — must pass before commit

**Layer 3 — CI `dft-gate` job** (blocks deploy)  
The `dft-gate` job runs before `deploy-chipper-ui` and `deploy-wci-api`.  
If DFT audit fails, deploys never start.

```
push to main
  → dft-gate (TypeScript + DFT --strict + Vitest)  ← deploy blocked here if fails
      → deploy-chipper-ui
      → deploy-wci-api
          → E2E tests (live)
```

**The invariant:** if it deployed, it passed DFT. If DFT fails, it cannot deploy.

### testid naming convention

```
{component}-{element}-{variant?}

Container:           data-testid="stage-2"
Interactive:         data-testid="stage2-proceed"
State-bearing:       data-testid="detection-chip-work-type"
Parameterised:       data-testid={`work-type-${value}`}
Timed/state:         data-testid="score-reveal-container" + data-state="waiting|ready"
```

---

## CI / CD pipeline

```
phosphene/woodchipper push to main
(paths: frontend/**, lib/python/wci/**, deploy/**)

  ┌─────────────────────────────────┐
  │  dft-gate (Ubuntu GHA runner)   │
  │  1. git submodule update --init │
  │  2. npm install                 │
  │  3. npx tsc --noEmit            │
  │  4. npx tsx scripts/dft-audit --strict │
  │  5. npm run test                │
  └────────────┬────────────────────┘
               │ pass
       ┌───────┴────────┐
       ↓                ↓
  deploy-chipper-ui   deploy-wci-api
  (Fly.io remote      (Fly.io remote
   build + deploy)     build + deploy)
       └───────┬────────┘
               │ both deployed
               ↓
          E2E tests
          (Playwright against live URLs
           BASE_URL=https://chipper-ui.fly.dev
           Playwright report uploaded as artifact)
```

**Triggering a deploy:**  
Push anything under `frontend/**`, `lib/python/wci/**`, or `deploy/**` to `woodchipper` main. Or trigger manually via GitHub Actions → "Deploy to Fly.io" → Run workflow.

**Checking CI status:**
```bash
GITHUB_PAT=$(cat /path/to/pat)
curl -s -H "Authorization: token $GITHUB_PAT" \
  "https://api.github.com/repos/phosphene/woodchipper/actions/runs?per_page=5" | \
  python3 -c "import sys,json; [print(r['id'], r['status'], r['conclusion'] or '-', r['head_commit']['message'][:50]) for r in json.load(sys.stdin)['workflow_runs']]"
```

---

## Known issues and open work

| Issue | Notes | Ticket |
|-------|-------|--------|
| CeremonyFlow not mounted in any app route | Ceremony components built and tested but not routed. Accessible via store only. `stage-I` etc. testids deferred in DFT audit. | — |
| woodchipper-services (real LLM calls) | Service board uses mock logic. Real API (Fly.io, Anthropic direct) pending. | T-370–T-374 |
| Playwright can't run in this sandbox | Missing `libatk` on Amazon Linux. Workaround: Hetzner SSH. | — |
| Export buttons need CI to go green | Fix committed (3e956ff) but last CI run failed on TS fixture types. Fixed in a4a6b98. | T-366 |
| PartsBar stale comment | `PartsBar.tsx` has a comment referencing "WCI Direct entry modal" — dormant component, not rendered anywhere, safe to ignore. | — |
| 20 ceremony testids deferred | DFT audit marks them as informational until CeremonyFlow is routed. | T-323 |

---

## Design references

| Document | What it is |
|----------|-----------|
| `projects/woodchipper/INTERFACE-ALIGNMENT.md` | Canonical design constraints — what the interface must never do |
| `drafts/woodchipper/for-ed/woodchipper-and-wci-portal.md` | Five-layer architecture specification |
| `drafts/woodchipper/for-ed/THE-SHAPE.md` | 11-beat ceremony, philosophical grounding |
| `drafts/woodchipper/service-board-spec.md` | Service board spec (built in T-376 sprint) |
| `drafts/woodchipper/jan-entry-layer-requests-june20.md` | Jan's June 20 entry layer instructions — canonical |
| `drafts/woodchipper/FORM-DESIGN-RESEARCH.md` | UX research grounding the form design |
| `frontend/DFT.md` | Full DFT standard and beat map |
| `drafts/woodchipper/classification-systems-spec.md` | Domain taxonomy specification (FORD, DDC, WoS etc.) |
