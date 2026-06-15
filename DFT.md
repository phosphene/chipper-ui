# Design for Testability — chipper-ui

Every UI element with behavior gets a stable semantic handle.
Tests never rely on text content, CSS classes, or visual position.

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

### 5. DFT review checklist (before PR)

- [ ] Every new interactive element has a `data-testid`
- [ ] Every new stage container has `data-testid="stage-{beat}"`
- [ ] Every advance/back button has `data-testid="stage-{beat}-advance/back"`
- [ ] E2E test exists that proves the state transition via testid
- [ ] No E2E test uses text content matching as primary assertion
- [ ] No E2E test uses CSS class as primary assertion
