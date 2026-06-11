/**
 * Regression tests — chipper-ui
 *
 * Each test is named after the bug it catches.
 * Each test would FAIL on the broken build and PASS on the fixed build.
 * This is the canary file — if any of these fail, a known bug has returned.
 *
 * Bugs caught so far:
 *
 *   BUG-001: NEXT_PUBLIC_API_URL baked as localhost:8000 at build time.
 *            Submit fired but fetch went to localhost — silently died in browser.
 *            Fixed: Dockerfile sets ENV NEXT_PUBLIC_API_URL=https://wci-api.fly.dev before build.
 *
 *   BUG-002: Stale Docker layer cache served a broken build (missing component chunks).
 *            Page loaded but React didn't hydrate — buttons appeared but did nothing.
 *            Fixed: CACHE_BUST ARG passed on every deploy.
 *
 *   BUG-003: Detailed mode textarea unresponsive — updateMakerDeclaration returned null
 *            when makerDeclaration was null (guarded with ternary : null).
 *            Controlled input with dead updater. Typing had no effect.
 *            Fixed: store initializes makerDeclaration with defaults when null.
 *
 *   BUG-004: Server-side HTML cache (s-maxage=31536000) served stale page to users.
 *            Even incognito got old bundles. Hard refresh didn't help (server-side cache).
 *            Fixed: next.config.ts sets Cache-Control: no-cache on HTML pages.
 *
 *   BUG-005: Submit button used disabled="" — excluded from tab order entirely.
 *            Keyboard users couldn't reach it.
 *            Fixed: aria-disabled + tabIndex kept in tab order.
 *
 *   BUG-006: Color contrast failures — mode toggle #555 on #191919 = 2.35:1,
 *            active button #fff on #4f8ef5 = 3.22:1. Both below WCAG 2.1 AA (4.5:1).
 *            Fixed: darkened active bg to #1a5fd4, lightened inactive text to #999.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ── BUG-001: API URL baked as localhost ───────────────────────────────────────

test.describe('BUG-001 regression — API URL must not be localhost', () => {

  test('fetch after submit goes to wci-api.fly.dev, not localhost', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', req => requests.push(req.url()));

    await page.goto('/');
    await page.getByPlaceholder(/describe your work/i).fill(
      'Original experimental study on memory consolidation in adult rodents. n=60, p=0.04.'
    );
    await page.getByRole('button', { name: 'Submit' }).click();

    // Wait for the confirm card — proves the API call succeeded
    await expect(page.locator('[data-testid="detection-confirm"]')).toBeVisible({ timeout: 10_000 });

    // No request should have gone to localhost
    const localhostReqs = requests.filter(u => u.includes('localhost'));
    expect(localhostReqs).toHaveLength(0);

    // A request should have gone to wci-api.fly.dev
    const apiReqs = requests.filter(u => u.includes('wci-api.fly.dev'));
    expect(apiReqs.length).toBeGreaterThan(0);
  });

});

// ── BUG-002: Stale build / React hydration ────────────────────────────────────

test.describe('BUG-002 regression — React must hydrate (buttons must be interactive)', () => {

  test('submit button click handler fires (not a static dead render)', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder(/describe your work/i);

    // Type enough to enable submit
    await input.fill('Original research on cortisol levels in stressed adult primates');

    // If React didn't hydrate, the button would appear but clicking would do nothing
    await page.getByRole('button', { name: 'Submit' }).click();

    // Confirm card proves the click handler ran and the API call completed
    await expect(page.locator('[data-testid="detection-confirm"]')).toBeVisible({ timeout: 10_000 });
  });

  test('mode toggle click handler fires (Detailed mode activates)', async ({ page }) => {
    await page.goto('/');

    // If React didn't hydrate, clicking Detailed would do nothing
    await page.locator('.flex.justify-center button', { hasText: 'detailed' }).click();

    // Simple entry should be gone — proves click handler ran
    await expect(page.getByPlaceholder(/describe your work/i)).not.toBeVisible();

    // Detailed textarea should appear
    await expect(page.getByPlaceholder(/describe what you.re working on/i)).toBeVisible();
  });

});

// ── BUG-003: Detailed mode textarea unresponsive ──────────────────────────────

test.describe('BUG-003 regression — Detailed mode textarea must accept input', () => {

  test('typing in Detailed textarea updates the value', async ({ page }) => {
    await page.goto('/');
    await page.locator('.flex.justify-center button', { hasText: 'detailed' }).click();

    const textarea = page.getByPlaceholder(/describe what you.re working on/i);
    await expect(textarea).toBeVisible();

    // On the broken build, fill() would appear to work but toHaveValue would fail
    // because the controlled input state never updated
    await textarea.fill('A study of cortisol feedback in adult rodents under chronic stress');
    await expect(textarea).toHaveValue('A study of cortisol feedback in adult rodents under chronic stress');
  });

  test('Detailed textarea value persists after typing more text', async ({ page }) => {
    await page.goto('/');
    await page.locator('.flex.justify-center button', { hasText: 'detailed' }).click();

    const textarea = page.getByPlaceholder(/describe what you.re working on/i);

    // Type, then append more — on the broken build second type would reset to empty
    await textarea.fill('First sentence of the description');
    await textarea.press('End');
    await textarea.type('. Second sentence added.');

    const value = await textarea.inputValue();
    expect(value).toContain('First sentence');
    expect(value).toContain('Second sentence');
  });

  test('Detailed Confirm button becomes active after typing in textarea', async ({ page }) => {
    await page.goto('/');
    await page.locator('.flex.justify-center button', { hasText: 'detailed' }).click();

    const textarea = page.getByPlaceholder(/describe what you.re working on/i);
    const confirmBtn = page.getByRole('button', { name: /confirm.*continue/i });

    // Before typing — button state (may be disabled depending on logic)
    const beforeDisabled = await confirmBtn.getAttribute('disabled');

    await textarea.fill('Original research on primate social behavior and hierarchy formation');

    // After typing — button must not be disabled
    await expect(confirmBtn).not.toHaveAttribute('disabled');
  });

});

// ── BUG-004: Server-side HTML cache ──────────────────────────────────────────

test.describe('BUG-004 regression — HTML must not be cached by CDN', () => {

  test('HTML response has no-cache header', async ({ request }) => {
    const res = await request.get(process.env.BASE_URL ?? 'https://chipper-ui.fly.dev');
    const cacheControl = res.headers()['cache-control'] ?? '';

    // Must not have long-lived caching directives on the HTML page
    expect(cacheControl).not.toMatch(/max-age\s*=\s*[1-9]\d{3,}/);  // no max-age > 999s
    expect(cacheControl).not.toContain('s-maxage=31536000');
  });

});

// ── BUG-005: Submit button excluded from tab order ────────────────────────────

test.describe('BUG-005 regression — submit button must be in keyboard tab order', () => {

  test('Tab navigation reaches submit button', async ({ page }) => {
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

    // On the broken build, the button had disabled="" so Tab skipped it entirely
    expect(found).toBe(true);
  });

  test('submit button does not have HTML disabled attribute (uses aria-disabled)', async ({ page }) => {
    await page.goto('/');
    const submit = page.getByRole('button', { name: 'Submit' });

    // Must NOT use disabled="" — that removes it from tab order
    // Must use aria-disabled="" instead
    const disabled = await submit.getAttribute('disabled');
    expect(disabled).toBeNull();

    const ariaDisabled = await submit.getAttribute('aria-disabled');
    expect(ariaDisabled).toBe('true');  // starts aria-disabled until 15 chars typed
  });

});

// ── BUG-006: Color contrast failures ─────────────────────────────────────────

test.describe('BUG-006 regression — color contrast must meet WCAG 2.1 AA', () => {

  test('no color-contrast violations on landing page', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();

    // On the broken build: 3 violations (mode toggle active, inactive, Detailed button)
    expect(results.violations).toHaveLength(0);
  });

  test('no color-contrast violations in Detailed mode', async ({ page }) => {
    await page.goto('/');
    await page.locator('.flex.justify-center button', { hasText: 'detailed' }).click();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();

    expect(results.violations).toHaveLength(0);
  });

});
