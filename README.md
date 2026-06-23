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

| Layer | Tool |
|-------|------|
| Framework | Next.js (App Router), React 19 |
| State | Zustand 5 |
| Schemas | Effect Schema (`@effect/schema`) |
| State machines | XState v5 |
| Styling | Tailwind CSS |
| Unit tests | Vitest + React Testing Library |
| E2E tests | Playwright (runs on Hetzner server) |

---

## Design for Testability (DFT)

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
