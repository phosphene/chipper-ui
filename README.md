# chipper-ui

React frontend for the Woodchipper / WCI platform — the ceremony-driven interface for work classification and scoring.

## Stack

- **Next.js 16** (App Router)
- **React 19** / TypeScript
- **Tailwind CSS 4**
- **Zustand 5** (state management)
- **Vitest** + Testing Library (tests)

## Architecture

The UI is organized around the WCI ceremony — a multi-stage flow that guides a work through classification, threshold consent, processing, and pronouncement.

### Ceremony store

All business logic lives in `store/ceremony.ts` (Zustand). The store is pure TypeScript with no React imports, making it independently testable. Invariants throw rather than silently no-op. Types and selectors are split into `ceremony.types.ts` and `ceremony.selectors.ts`.

### Component tree

```
components/
├── entry/           # Entry gate — DOI/URL input, detection, confirmation
│   ├── EntryGate    # Primary entry point
│   ├── SimpleEntry  # Minimal input variant
│   ├── DetectionConfirm
│   └── PartsBar
├── ceremony/        # Ceremony flow stages
│   ├── CeremonyFlow # Orchestrator — renders current stage
│   ├── stages/      # StageI–StageV (maker declaration → pronouncement)
│   ├── Threshold    # Consent gate before scoring
│   ├── Processing   # Scoring animation
│   ├── Pronouncement # Final score reveal
│   ├── ScoreHero    # Score display
│   ├── DimensionGrid # Nine-dimension breakdown
│   ├── ReviewCard   # Review summary
│   ├── JustificationCard
│   └── StageNav     # Stage navigation
├── accordion/       # Collapsible detail views
│   ├── AccordionStage
│   ├── StageHeader
│   └── DetailedEntry
├── boards/
│   └── LiveBoard    # Live scoring board
└── ui/
    └── DepthLabel   # Epistemic depth indicator
```

### Separation of concerns

- **Store** owns state transitions and validation logic
- **Components** are presentational — they read from the store and dispatch actions
- **Hooks** (`hooks/useDetection.ts`, `hooks/useProcessingAnimation.ts`) encapsulate side effects
- **Tests** use MSW for API mocking (`tests/mocks/`)

### Key components

| Component | Role |
|-----------|------|
| `EntryGate` | Accepts DOI or URL, triggers detection |
| `CeremonyFlow` | Orchestrates stage progression |
| `Processing` | Animated scoring phase |
| `Threshold` | Consent gate — user must agree before score is revealed |
| `Pronouncement` | Final score display with dimension breakdown |

## Running locally

**Standalone:**

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Via Docker Compose** (from woodchipper root):

```bash
docker compose up chipper-ui
```

See `DOCKER.md` in the woodchipper root for full container strategy.

## Running tests

```bash
npm test              # single run (vitest)
npm run test:watch    # watch mode
npm run test:coverage # with coverage
```

## CI

GitHub Actions (`.github/workflows/ci.yml` in the chipper-ui repo):

- **test** — type check (`tsc --noEmit`) + store tests (`npm test`)
- **lint** — ESLint

Triggers on push to `main`, `feat/**`, `fix/**` and on PRs to `main`.

## Deployment

- **Live demo:** [https://phosphene.github.io/chipper-ui/](https://phosphene.github.io/chipper-ui/) (GitHub Pages, static)
- **Production:** Fly.io via the `phosphene/woodchipper` deploy workflow (`.github/workflows/deploy.yml`), not this repo. See `deploy/README.md` in the woodchipper root.

## Design reference

- `drafts/woodchipper/dikaiopomp/` — ceremony design documents (in the woodchipper repo)
- `projects/woodchipper/ALIGNMENT.md` — product alignment
- `projects/woodchipper/INTERFACE-ALIGNMENT.md` — interface design alignment
