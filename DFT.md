# Design for Testability — chipper-ui

Every UI element with behavior gets a stable semantic handle.
Tests never rely on text content, CSS classes, or visual position.

**If an element is not easily reachable in the E2E environment, the element
must be modified until it is. Testability is not optional and is not added
after the fact. An untestable element is an unfinished element.**

---

## The Standard

### 1. `data-testid` naming convention

Format: `{component}-{element}-{variant?}`

| Pattern | Example |
|---------|---------|
| Container | `data-testid="stage-I"` |
| Interactive element | `data-testid="stage-I-advance"` |
| State-bearing element | `data-testid="stage-I-standing-field"` |
| Parameterised | `data-testid={`work-type-${value}`}` |
| Conditional visibility | `data-testid="detection-confirm"` (present = visible) |

### 2. What gets a testid

Every:
- Stage container (`data-testid="stage-{beat}"`)
- Advance / back button (`data-testid="stage-{beat}-advance"`, `stage-{beat}-back"`)
- Primary input (`data-testid="stage-{beat}-{field}"`)
- Selection option (`data-testid="{group}-{value}"`)
- Consent checkbox (`data-testid="consent-{id}"`)
- State-change button (`data-testid="threshold-proceed"`, `"resting-close"`)
- Score reveal (`data-testid="score-reveal"`)
- Result container (`data-testid="pronouncement"`, `"score-hero"`)
- Recording choice (`data-testid="recording-choice-{value}"`)
- Export button (`data-testid="export-{format}"`)

### 3. What tests assert

State transitions via testid presence/absence or aria-disabled:
```ts
// Not this — fragile text match
await expect(page.locator('text=/maker declaration/i')).toBeVisible();

// This — stable semantic handle
await expect(page.locator('[data-testid="stage-I"]')).toBeVisible();
await expect(page.locator('[data-testid="stage-I-advance"]')).toBeEnabled();
```

Store state via visible output:
```ts
// Not this — implementation detail
const store = getStore();
expect(store.workClassification.workType.value).toBe('null-result');

// This — prove via UI effect
await page.locator('[data-testid="work-type-null-result"]').click();
await expect(page.locator('[data-testid="work-type-null-result"]'))
  .toHaveAttribute('aria-pressed', 'true');
```

### 4. Ceremony beat testid map

| Beat | Container | Advance | Key inputs |
|------|-----------|---------|------------|
| I | `stage-I` | `stage-I-advance` | `stage-I-standing-{value}`, `stage-I-tradition` |
| II | `stage-II` | `stage-II-advance` | `work-type-{value}`, `stage-II-description` |
| III | `stage-III` | `stage-III-advance` | _(read-only)_ |
| IV | `stage-IV` | `stage-IV-enter` | `consent-frame`, `stage-IV-decline` |
| V | `stage-V` | `stage-V-rest` | `stage-V-last-word` |
| VI | `threshold` | `threshold-proceed` | _(none)_ |
| VII | `processing` | `score-reveal` | _(none)_ |
| VIII | `pronouncement` | `pronouncement-proceed` | _(none)_ |
| IX | `recording-beat` | `recording-confirm` | `recording-choice-{value}`, `export-{format}` |

### 5. Timed / animated elements

Elements that appear after a delay or animation must expose a `data-state`
attribute so Playwright can wait for readiness without relying on timing:

```ts
// Not this — timing-dependent, fragile under load
await page.waitForTimeout(5000);
await page.locator('[data-testid="score-reveal"]').click();

// This — state-driven, timing-independent
await page.locator('[data-testid="score-reveal-container"][data-state="ready"]')
  .waitFor({ timeout: 15000 });
await page.locator('[data-testid="score-reveal"]').click();
```

Elements with `data-state` values:
| Element | data-testid | data-state values |
|---------|-------------|-------------------|
| Score reveal container | `score-reveal-container` | `waiting` \| `ready` |

Any new element that is conditionally visible/interactive after a delay
or animation **must** follow this pattern before shipping.

### 6. Reachability requirement

An element is **reachable** if a Playwright test can:
1. Navigate to it without manual intervention
2. Interact with it via `data-testid` or ARIA role
3. Assert the resulting state change

If any of these fail — because the element is behind an unreachable state,
because it requires timing that Playwright can't hit, because it's only
visible after an animation with no completion signal — **the component
must be modified**. Options in order of preference:

1. Add a `data-testid` that is present in the DOM regardless of visual state
2. Add an `aria-*` attribute that reflects the current state
3. Add a `data-state` attribute that Playwright can poll
4. Add a test-only prop (`testBypass?: boolean`) that skips animations
5. Restructure the component so the element is reachable without the bypass

Option 5 is always preferred. Options 1–4 are acceptable. An element that
remains unreachable after options 1–5 are considered is not shippable.

### 7. Deterministic enforcement

DFT is not a code review checklist. It is enforced automatically at three layers:

**Layer 1 — Pre-commit hook (local, instant)**
Install once: `npm run hooks:install`

Blocks every `git commit` that:
- Has TypeScript errors
- Is missing a required testid from the beat map
- Has failing Vitest unit tests

Run manually: `npm run gate`

**Layer 2 — DFT audit script (standalone)**

```sh
npm run dft:audit          # soft: warns on untested testids
npm run dft:audit:strict   # hard: fails if any testid lacks E2E coverage
```

The beat map in `scripts/dft-audit.ts` is the canonical source of required testids.
When you add a new interactive element, you add it to `REQUIRED_TESTIDS` there first,
then the pre-commit hook enforces it on every subsequent commit.

**Layer 3 — CI gate (GHA, blocks deploy)**

The `dft-gate` job runs before `deploy-chipper-ui` and `deploy-wci-api`.
Deploy is structurally impossible if:
- TypeScript errors exist
- Any required testid from the beat map is missing from component source
- Unit tests are failing

E2E tests run after deploy against the live URL. They are the final proof.

**The invariant:** if it deploys, it passed DFT. If DFT fails, it cannot deploy.

**Never claim UI behavior works until a Playwright test proves it.**
`curl` and page inspection are not proof. E2E test output is proof.

---

### 8. Adding new elements (mandatory sequence)

1. Add the testid to `REQUIRED_TESTIDS` in `scripts/dft-audit.ts`
2. Add the `data-testid` to the component
3. Write the E2E test assertion
4. Run `npm run gate` — all three layers must pass
5. Then commit

If you commit without step 3, the pre-commit hook blocks you.
If somehow a commit lands without step 3, `--strict` CI will catch it.

---

### 6. DFT review checklist (before PR)

- [ ] Every new interactive element has a `data-testid`
- [ ] Every new stage container has `data-testid="stage-{beat}"`
- [ ] Every advance/back button has `data-testid="stage-{beat}-advance/back"`
- [ ] E2E test exists that proves the state transition via testid
- [ ] No E2E test uses text content matching as primary assertion
- [ ] No E2E test uses CSS class as primary assertion
