# chipper-ui

React frontend for Woodchipper — the ceremony-driven interface for work classification, evaluation, and routing.

**Live:** https://chipper-ui.fly.dev

---

## Architecture

The UI implements a five-layer entry architecture followed by an optional WCI ceremony. Layers 1–5 collect context and intent; the ceremony only activates if the maker selects the "Credibility evaluation" route in Layer 3.

```
Layer 1  Entry form (Stage 1 + Stage 2)
           Stage 1: description → upload → details → role → domain
           Stage 2: maker declaration + work classification
           Detection: system detects work type / domain / standing → chips for confirmation

Layer 2  Intent selection
           What do you want to do? Assess / Develop / Publish / Register & Index

Layer 3  Route selection
           Routes shown per selected intents.
           "Credibility evaluation" (WCI) first appears here, under Assess.

Layer 4  Confirmation (GOV.UK check-your-answers pattern)
           System reflects full understanding back to maker.
           Every value has a Change link.

Layer 5  Review + Begin
           Plain-language summary of what will happen and what scope excludes.
           "Begin" triggers evaluation.

  ↓ (if Credibility evaluation selected)

WCI Ceremony (dikaiopompeia)
  Opening → Beats I–V → Threshold → Processing → Pronouncement → Recording

  ↓ (post-ceremony)

Service Board
  Solemn palette (beige/gold/walnut). Flow performs services.
  Mock logic built — real API (woodchipper-services) pending T-370–T-374.
```

### WCI containment invariant

WCI must never appear in Layers 1–5. It is a route the maker selects, not a default behaviour.
- No `/api/score` calls before Layer 5 Begin
- No "9 dimensions" language in entry layer
- "Credibility evaluation" is the user-facing label — the acronym WCI is internal only
- E2E test `entry-layer.spec.ts` asserts `route-wci` not visible before Assess intent selected

---

## Component tree

```
components/
├── entry/               # Layers 1–5
│   ├── DomainPicker     # 30-discipline taxonomy with subtopic cascade
│   ├── DetectionChips   # Detection-first confirmation chips (confirmed/edited states)
│   ├── Stage2           # Maker declaration + work classification
│   ├── IntentSelection  # Layer 2 — Assess/Develop/Publish/Register
│   ├── RouteSelection   # Layer 3 — per-intent route cards
│   ├── ConfirmationScreen # Layer 4 — check your answers
│   ├── ReviewScreen     # Layer 5 — begin
│   └── PartsBar         # Work type icon bar (dormant)
├── workspace/
│   └── ProgressiveForm  # Rising form — sections compress upward on completion
├── service/             # Post-ceremony service board (T-376 sprint)
│   ├── service-board.*  # Schema, machine, logic, view (Trio pattern)
│   ├── ServiceNode      # Node card: pending/active/complete/stub/failed
│   ├── ServiceOptions   # Service selector filtered by work_type/standing
│   ├── ResultsPanel     # Corrected paper + receipt download
│   └── Receipt          # Structured receipt document
├── ceremony/            # WCI ceremony (activates via Layer 3 route only)
│   ├── CeremonyFlow     # Orchestrator
│   ├── stages/          # StageI–StageV
│   ├── Threshold        # Marked crossing into judgment space
│   ├── Processing       # Nine-dimension scoring animation
│   ├── Pronouncement    # Score as a reading, not a number
│   ├── Recording        # Consent architecture
│   └── ...
├── boards/
│   └── LiveBoard        # Live evaluation board
└── ui/
    └── DepthLabel       # Epistemic depth indicator
```

---

## Stack

### Core

| Tool | Version | Role |
|------|---------|------|
| **Next.js** | 16.2.7 | App Router, SSR, API routes |
| **React** | 19.2.4 | UI rendering |
| **TypeScript** | 6.0.3 | `strict: true`, `target: ES2017`, `module: esnext` |
| **Tailwind CSS** | 4.x | Utility-first styling — no CSS modules, no inline style |

### State & Logic

| Tool | Version | Role |
|------|---------|------|
| **Zustand** | 5.0.14 | Global ceremony store — pure TypeScript, no React imports, independently testable |
| **XState v5** | 5.32.1 | All stateful UI logic. `setup()` pattern with typed context and events. `@xstate/react` 6.1.0 for component binding via `useMachine` / `useActor`. |
| **Effect Schema** | @effect/schema 0.75.5 | All data contracts. No Zod. No raw TypeScript interfaces as source of truth. |
| **Effect (core)** | 3.21.4 | I/O, error handling, dependency injection in logic layer |

### Testing

| Tool | Version | Role |
|------|---------|------|
| **Vitest** | 4.1.9 | Unit tests and component snapshots. jsdom environment. |
| **React Testing Library** | 16.3.2 | Component rendering in tests. `@testing-library/user-event` 14.6.1 for interactions. |
| **Playwright** | 1.60.0 | E2E / BDD — browser-level acceptance tests. `toHaveScreenshot` for visual baselines. |
| **axe-core/playwright** | 4.11.3 | WCAG 2.1 AA accessibility auditing in E2E |
| **Vite** | 8.0.16 | Build tooling. `@vitejs/plugin-react` 6.0.2 for JSX transform and RTL support. |

**React 19 gotcha:** React 19 only exports `act()` from the development CJS build, not production. Without `define: { 'process.env.NODE_ENV': JSON.stringify('test') }` in vitest.config.ts, RTL fails silently with `React.act is not a function`. The config forces Vite to resolve the dev build during test runs.

**Current test count:** 223 unit/component tests · 6 visual snapshot baselines · Playwright E2E suite

---

## Design for Testability (DFT) — and why frontend testing is hard

### The problem with frontend acceptance testing

Frontend testing has a fundamental adversarial relationship with the UI it's testing.

**The DOM is a moving target.** CSS class names change, text copy changes, DOM structure changes. Tests that assert on class names or text strings break on every cosmetic update — they become a maintenance burden rather than a safety net. The test suite becomes noise that the team learns to ignore.

**JavaScript hydration is invisible.** A page can render HTML that *looks* correct but has no working JavaScript attached. Buttons that appear clickable do nothing. Forms that look filled are actually empty. `curl` and page inspection cannot detect this — only a real browser running real JavaScript can prove that React has hydrated and event handlers are attached. This was the core failure mode we hit in the chipper-ui early builds: I sent claims that "it works" based on HTML inspection, Jan tested on his phone and found nothing worked. The lesson: a UI claim without a Playwright test proving it is not a verified claim.

**Timing is hostile.** Animations, artificial delays (which we use deliberately for epistemic weight), and async API calls all create windows where a test can interact with an element before it’s ready. Tests that use `waitForTimeout(5000)` are lies — they’ll pass on a fast machine and fail under load. The solution is `data-state` attributes that signal readiness, and `waitForSelector('[data-state="ready"]')` instead of arbitrary sleeps.

**System deps make local headless testing hard.** Playwright’s Chromium requires `libatk-1.0.so.0` and other system libraries. On Amazon Linux (this sandbox), those libs aren’t available. This forced us to run E2E on the Hetzner production server — which has the correct deps — rather than locally. The lesson: the CI environment matters as much as the test code.

### How we solve it

**Semantic handles, not CSS selectors.** Every interactive element gets a `data-testid` before the component is written (DFT-first). Tests assert on `[data-testid="stage-2-proceed"]`, not `.btn-primary` or `text="Proceed"`. Copy can change. Styles can change. The testid is a contract that says "this element exists and does this thing."

**State on the DOM, not in timers.** Timed elements expose `data-state="waiting|ready"` so Playwright can `waitFor` readiness without `setTimeout`. The animation runs whatever pace it needs; the test waits for the state, not the clock.

**Three testing layers, each doing one job:**
- **Vitest + RTL** (jsdom): fast, no browser, proves structure and transitions. Runs in 15s. Catches wrong DOM, bad machine states, broken logic.
- **Vitest snapshots**: DOM tree diffs on component render. Catches unintended structural changes before Playwright runs.
- **Playwright** (real browser on Hetzner): proves hydration, interaction, download events, visual state. Slow (minutes), but ground truth.

**The pyramid:** many fast unit tests, fewer component snapshots, a small Playwright suite proving critical paths only. Playwright tests that duplicate what RTL already covers are waste.

**The TDD proof:** for every new feature, write the Playwright test first against the broken/absent state (RED), then implement, then verify GREEN. A test that passes before the implementation exists has no value. The red state is the proof of value.

### DFT enforcement

Every interactive element has a `data-testid`. Every testid is registered in `scripts/dft-audit.ts` before the component is written (DFT-first). Deployment is blocked if any required testid is missing.

```bash
npm run dft:audit          # check coverage (soft)
npm run dft:audit:strict   # hard fail if any testid lacks E2E assertion
npm run gate               # TypeScript + DFT + Vitest (pre-commit)
npm run hooks:install      # install git pre-commit hook
```

**Current coverage:** 223 unit tests · 70+ DFT testids · 6 visual snapshot baselines

---

## Running locally

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run test         # unit tests
npm run gate         # full pre-commit gate
```

---

## Testing

```bash
npm run test              # Vitest unit tests (223 tests)
npm run test:watch        # watch mode
npm run test:e2e:live     # Playwright E2E against chipper-ui.fly.dev
```

E2E tests require Playwright system deps. On Amazon Linux (this sandbox), run on Hetzner:
```bash
ssh -i /home/node/.ssh/observatory_prod root@144.76.166.36
cd /tmp/chipper-test && BASE_URL=https://chipper-ui.fly.dev npx playwright test
```

---

## CI / Deployment

CI pipeline (woodchipper `deploy.yml`):

```
push to main
  → dft-gate job (TypeScript + DFT audit --strict + Vitest)
      → deploy-chipper-ui (Fly.io, fly.chipper-ui.toml)
      → deploy-wci-api (Fly.io)
          → E2E tests (live, Playwright, Desktop Chrome)
```

Deploys are **structurally blocked** if DFT audit fails.

---

## Known issues / open work

| Issue | Status | Ticket |
|-------|--------|--------|
| E2E tests can't run in sandbox (missing libatk) | Workaround: Hetzner | — |
| 6 pre-existing StageAdvanceError store tests fixed | Done | T-363 |
| WCI scoring chain removed from entry layer | Done | T-388 |
| Real woodchipper-services API (replaces mock logic) | Pending | T-370–T-374 |
| CeremonyFlow not mounted in any app route | Pending — ceremony accessible via store only | T-323 |
| Export buttons need deploy to go live | Export fix committed (3e956ff), deploy pending CI | T-366 |

---

## Design references

| Document | Location |
|----------|----------|
| Interface alignment (canonical) | `projects/woodchipper/INTERFACE-ALIGNMENT.md` |
| Five-layer architecture | `drafts/woodchipper/for-ed/woodchipper-and-wci-portal.md` |
| 11-beat ceremony | `drafts/woodchipper/for-ed/THE-SHAPE.md` |
| Service board spec | `drafts/woodchipper/service-board-spec.md` |
| Jan's June 20 entry instructions | `drafts/woodchipper/jan-entry-layer-requests-june20.md` |
| DFT standard | `frontend/DFT.md` |
