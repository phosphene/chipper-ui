/**
 * Regression tests — chipper-ui
 *
 * Each test in this file is named after the bug it catches and is structured
 * to be self-evidencing: it would FAIL on the broken build and PASS on the fix.
 * This makes the test file a living record of what went wrong and what "fixed"
 * actually means — not just that the code changed, but that the observable
 * symptom is gone.
 *
 * Comment convention follows literate docstring style:
 *   - Mechanism: what structural condition produced the bug
 *   - Symptom: what the user experienced
 *   - Proof: what this test asserts that distinguishes broken from fixed
 *
 * Adding a new regression: when a bug is found in production, write the test
 * FIRST against the broken build to confirm it fails, THEN apply the fix and
 * confirm it passes. Never write a regression test against a build you haven't
 * seen fail.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ── BUG-001 ───────────────────────────────────────────────────────────────────
//
// Mechanism: NEXT_PUBLIC_API_URL is a build-time constant in Next.js — the
//   `NEXT_PUBLIC_` prefix causes it to be inlined into the JS bundle during
//   `npm run build`. The Dockerfile did not set this env var before running
//   the build step, so Next.js fell back to the development default:
//   `http://localhost:8000`. The resulting bundle shipped that string to
//   every browser.
//
// Symptom: User typed in the Simple entry field and clicked →. The button
//   activated (15-char threshold was met), the click handler fired, but the
//   fetch went to localhost:8000 — which is unreachable from the browser.
//   The request failed silently; no error was shown; DetectionConfirm never
//   appeared. The button appeared to do nothing.
//
// Fix: Dockerfile sets `ARG NEXT_PUBLIC_API_URL=https://wci-api.fly.dev` and
//   `ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL` before `npm run build`.
//
// Proof: After submit, no fetch should target localhost. At least one fetch
//   must target wci-api.fly.dev. DetectionConfirm must appear.

test.describe('BUG-001 — API URL baked as localhost at build time', () => {

  test('fetch after submit goes to wci-api.fly.dev, not localhost', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', req => requests.push(req.url()));

    await page.goto('/');
    await page.getByPlaceholder(/describe your work/i).fill(
      'Original experimental study on memory consolidation in adult rodents. n=60, p=0.04.'
    );
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('[data-testid="detection-confirm"]')).toBeVisible({ timeout: 10_000 });

    const localhostReqs = requests.filter(u => u.includes('localhost'));
    expect(localhostReqs).toHaveLength(0);

    const apiReqs = requests.filter(u => u.includes('wci-api.fly.dev'));
    expect(apiReqs.length).toBeGreaterThan(0);
  });

});

// ── BUG-002 ───────────────────────────────────────────────────────────────────
//
// Mechanism: Fly.io's remote builder caches Docker layers by content hash.
//   When `COPY . .` produces the same hash as a previous build (e.g., because
//   only a config file changed), the `RUN npm run build` layer is reused from
//   cache rather than re-executed. This meant the old JS bundle — containing
//   the broken Dimension type import and missing component chunks — was shipped
//   in subsequent deploys even though the source had been fixed.
//
// Symptom: The page loaded and the HTML structure rendered correctly (the
//   server-rendered shell came through). But React never hydrated the page:
//   button click handlers were absent, state transitions did nothing, and
//   the UI was effectively a static screenshot of itself.
//
// Fix: Dockerfile passes `ARG CACHE_BUST=$(date +%s)` from the CI workflow,
//   which invalidates the `RUN npm run build` layer on every deploy.
//
// Proof: Interactive behaviour must work. A click that should trigger a state
//   change (mode toggle) must produce a visible DOM change. If React didn't
//   hydrate, clicking Detailed would leave the Simple input still visible.

test.describe('BUG-002 — Stale Docker build cache suppressed React hydration', () => {

  test('click handler fires on submit (React is hydrated)', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/describe your work/i).fill(
      'Original research on cortisol levels in stressed adult primates'
    );
    await page.getByRole('button', { name: 'Submit' }).click();
    // A non-hydrated page would never show this — the click handler wouldn't exist
    await expect(page.locator('[data-testid="detection-confirm"]')).toBeVisible({ timeout: 10_000 });
  });

  test('mode toggle click handler fires (DOM changes on click)', async ({ page }) => {
    await page.goto('/');
    await page.locator('.flex.justify-center button', { hasText: 'detailed' }).click();
    // Non-hydrated: Simple input stays visible. Hydrated: it disappears.
    await expect(page.getByPlaceholder(/describe your work/i)).not.toBeVisible();
    await expect(page.getByPlaceholder(/describe what you.re working on/i)).toBeVisible();
  });

});

// ── BUG-003 ───────────────────────────────────────────────────────────────────
//
// Mechanism: The Zustand store's `updateMakerDeclaration` action was written
//   with a null guard: `state.makerDeclaration ? {...merge} : null`. The
//   intent was defensive — don't merge into a state that hasn't been
//   initialized. But `makerDeclaration` is only initialized by
//   `initFromDetection`, which fires after a successful `/api/detect` call.
//   In Detailed mode, the user types BEFORE detection — so makerDeclaration
//   was always null, and every keystroke was silently discarded.
//
//   The textarea is a controlled React input: `value={store.makerDeclaration
//   ?.freeText ?? ''}`. With state perpetually null, the value was always ''
//   and React re-rendered the textarea empty on every keystroke. The user
//   saw characters appear for a frame and then vanish, or nothing at all.
//
// Symptom: Jan opened Detailed mode, clicked the textarea, typed — nothing
//   appeared. The field looked interactive but was unresponsive.
//
// Fix: `updateMakerDeclaration` now initializes `makerDeclaration` with
//   sensible defaults when it's null, then merges the update in. This mirrors
//   how a form would work: the first keystroke creates the record.
//
// Proof: After fill(), toHaveValue() must return the filled string. On the
//   broken build it would return '' — the store never updated.

test.describe('BUG-003 — Detailed mode textarea discarded all input', () => {

  test('typing in Detailed textarea updates and retains the value', async ({ page }) => {
    await page.goto('/');
    await page.locator('.flex.justify-center button', { hasText: 'detailed' }).click();

    const textarea = page.getByPlaceholder(/describe what you.re working on/i);
    await expect(textarea).toBeVisible();

    await textarea.fill('A study of cortisol feedback in adult rodents under chronic stress');
    // On broken build: toHaveValue returns '' — state was never updated
    await expect(textarea).toHaveValue('A study of cortisol feedback in adult rodents under chronic stress');
  });

  test('second typing session appends correctly (state persists)', async ({ page }) => {
    await page.goto('/');
    await page.locator('.flex.justify-center button', { hasText: 'detailed' }).click();

    const textarea = page.getByPlaceholder(/describe what you.re working on/i);
    await textarea.fill('First sentence.');
    await textarea.press('End');
    await textarea.type(' Second sentence.');

    const value = await textarea.inputValue();
    // On broken build: value is '' or just ' Second sentence.' (first fill vanished)
    expect(value).toContain('First sentence.');
    expect(value).toContain('Second sentence.');
  });

  test('Confirm button activates after typing (state is live)', async ({ page }) => {
    await page.goto('/');
    await page.locator('.flex.justify-center button', { hasText: 'detailed' }).click();

    const textarea = page.getByPlaceholder(/describe what you.re working on/i);
    await textarea.fill('Original research on primate social hierarchy and cortisol regulation');

    // On broken build: button stays disabled because store.makerDeclaration was null
    // and the canAdvance selector returned false
    const confirm = page.getByRole('button', { name: /confirm.*continue/i });
    await expect(confirm).not.toHaveAttribute('disabled');
  });

});

// ── BUG-004 ───────────────────────────────────────────────────────────────────
//
// Mechanism: Next.js App Router sets `Cache-Control: s-maxage=31536000` on
//   page responses by default, instructing CDN edges (including Fly.io's
//   proxy layer) to cache the HTML for one year. When a new build was
//   deployed, the edge continued serving the old HTML — which referenced the
//   old JS chunk filenames. Browsers fetched those old chunks, which contained
//   the old broken code.
//
// Symptom: After a deploy, users (including in incognito, which bypasses
//   browser cache but not server-side cache) still saw the broken behaviour.
//   The old bundles were served because the HTML pointed to them.
//
// Fix: next.config.ts adds a `headers()` export that sets
//   `Cache-Control: no-cache, no-store, must-revalidate` on all HTML routes.
//   Static assets (`/_next/static/`) retain `immutable` caching — they're
//   content-addressed and safe to cache forever.
//
// Proof: The HTML response must not carry a long-lived max-age directive.

test.describe('BUG-004 — Server-side HTML cache served stale bundles', () => {

  test('HTML page has no long-lived cache-control directive', async ({ request }) => {
    const res = await request.get(process.env.BASE_URL ?? 'https://chipper-ui.fly.dev');
    const cc = res.headers()['cache-control'] ?? '';
    // Must not instruct CDN to cache for extended periods
    // Broken build had: s-maxage=31536000 (one year)
    expect(cc).not.toMatch(/s-maxage\s*=\s*[1-9]\d{3,}/);
    expect(cc).not.toMatch(/max-age\s*=\s*[1-9]\d{4,}/);  // no max-age > 9999s
  });

});

// ── BUG-005 ───────────────────────────────────────────────────────────────────
//
// Mechanism: The submit button used the HTML `disabled` attribute, which has
//   two effects: it prevents the click handler from firing AND it removes the
//   element from the sequential focus order (Tab navigation). Screen reader
//   users and keyboard-only users could not reach the button at all —
//   Tab would jump from the file-attach button to the next focusable element
//   outside the input row, skipping submit entirely.
//
// Symptom: Keyboard users couldn't submit. The button was unreachable via Tab
//   even after typing enough text to satisfy the 15-char threshold, because
//   `disabled` was still set during the navigation pass.
//
// Fix: Submit now uses `aria-disabled` (which communicates the disabled state
//   to assistive technologies) without removing the element from tab order.
//   The click handler is conditionally attached: only fires when the form is
//   ready. The button is always focusable.
//
// Proof: Tab must reach the submit button within a reasonable number of steps.
//   The button must not have the HTML `disabled` attribute. It must have
//   `aria-disabled="true"` in its initial state.

test.describe('BUG-005 — Submit button excluded from keyboard tab order', () => {

  test('submit button is reachable via Tab navigation', async ({ page }) => {
    await page.goto('/');
    let found = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        ariaLabel: (document.activeElement as HTMLElement)?.getAttribute('aria-label'),
      }));
      if (focused.tag === 'BUTTON' && focused.ariaLabel === 'Submit') {
        found = true;
        break;
      }
    }
    // On broken build: Tab skipped the button entirely due to disabled=""
    expect(found).toBe(true);
  });

  test('submit uses aria-disabled, not HTML disabled attribute', async ({ page }) => {
    await page.goto('/');
    const submit = page.getByRole('button', { name: 'Submit' });
    // HTML disabled="" would remove from tab order — must be absent
    expect(await submit.getAttribute('disabled')).toBeNull();
    // aria-disabled communicates state without removing from tab order
    expect(await submit.getAttribute('aria-disabled')).toBe('true');
  });

});

// ── BUG-006 ───────────────────────────────────────────────────────────────────
//
// Mechanism: The dark-theme palette used low-luminance grey text on near-black
//   backgrounds. WCAG 2.1 AA requires a contrast ratio of 4.5:1 for normal
//   text. Three elements failed:
//     - Mode toggle inactive button: #555555 on #191919 → 2.35:1
//     - Mode toggle active button: #ffffff on #4f8ef5 → 3.22:1
//     - "Detailed" hint button in SimpleEntry: #555555 on #111111 → 2.53:1
//
//   These weren't cosmetic failures — low contrast makes text illegible for
//   users with low vision, colour blindness, or in bright environments.
//
// Symptom: Axe audit flagged 3 color-contrast violations at WCAG 2.1 AA level.
//
// Fix:
//   - Active button: bg darkened from #4f8ef5 to #1a5fd4 (passes 4.5:1 with white)
//   - Inactive buttons: text lightened from #555 to #999 (#999 on #191919 = 4.6:1)
//
// Proof: Axe color-contrast rule must report zero violations on both landing
//   page and in Detailed mode (which reveals additional buttons).

test.describe('BUG-006 — Color contrast failures in mode toggle and hint buttons', () => {

  test('no color-contrast violations on landing page', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();
    // On broken build: 3 nodes failed (active toggle, inactive toggle, Detailed hint)
    expect(results.violations).toHaveLength(0);
  });

  test('no color-contrast violations after switching to Detailed mode', async ({ page }) => {
    await page.goto('/');
    await page.locator('.flex.justify-center button', { hasText: 'detailed' }).click();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();
    expect(results.violations).toHaveLength(0);
  });

});
