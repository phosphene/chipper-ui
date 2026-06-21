/**
 * Visual snapshot baselines per ceremony beat — T-368
 *
 * Captures component-scoped screenshots at each ceremony state.
 * Baselines generated on Hetzner (headless Chromium), compared on CI.
 *
 * Each snapshot targets a specific data-testid container — never full-page —
 * to isolate visual regressions to the component that changed.
 */

import { test, expect } from '@playwright/test';

const ACADEMIC_TEXT = [
  'Original experimental study on cortisol regulation in stressed adult primates.',
  'This systematic investigation (n=84, p=0.003) reveals novel pathways in',
  'neuroendocrine feedback mechanisms during chronic social stress. Our findings',
  'demonstrate that hierarchical position modulates HPA axis reactivity through',
  'previously undocumented serotonergic intermediaries.',
].join(' ');

/**
 * Helper: fast-path through ceremony to post-evaluation state.
 * Fills text, skips optional sections, evaluates, waits for pronouncement.
 */
async function fastPathToPronouncment(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.locator('[data-testid="entry-text-field"]')).toBeVisible();

  await page.locator('[data-testid="entry-text-field"]').fill(ACADEMIC_TEXT);
  await page.locator('[data-testid="btn-done-work"]').click();
  await expect(page.locator('[data-testid="section-work-complete"]')).toBeVisible();

  await page.locator('[data-testid="btn-skip-creator-role"]').click();
  await expect(page.locator('[data-testid="section-creator-role-complete"]')).toBeVisible();

  await page.locator('[data-testid="btn-skip-hopes"]').click();
  await expect(page.locator('[data-testid="section-hopes-complete"]')).toBeVisible();

  await page.locator('[data-testid="btn-skip-domain"]').click();

  await page.locator('[data-testid="evaluate-progressive"]').click();
  await expect(page.locator('[data-testid="reading-panel"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-testid="pronouncement"]')).toBeVisible({ timeout: 15_000 });
}

test.describe('Visual snapshots — ceremony states', () => {

  test('01 — landing state: workspace panels', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="workspace-panels"]')).toBeVisible();
    // Let animations settle
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="workspace-panels"]')).toHaveScreenshot(
      'landing-workspace-panels.png',
    );
  });

  test('02 — entry filled: progressive form before evaluate', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="entry-text-field"]')).toBeVisible();

    await page.locator('[data-testid="entry-text-field"]').fill(ACADEMIC_TEXT);
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="progressive-form"]')).toHaveScreenshot(
      'entry-filled-progressive-form.png',
    );
  });

  test('03 — after evaluation: reading panel', async ({ page }) => {
    await fastPathToPronouncment(page);

    await expect(page.locator('[data-testid="reading-panel"]')).toHaveScreenshot(
      'post-eval-reading-panel.png',
    );
  });

  test('04 — pronouncement container', async ({ page }) => {
    await fastPathToPronouncment(page);

    await expect(page.locator('[data-testid="pronouncement"]')).toHaveScreenshot(
      'pronouncement.png',
    );
  });

  test('05 — export strip', async ({ page }) => {
    await fastPathToPronouncment(page);

    // Proceed to export
    await page.locator('[data-testid="pronouncement-proceed"]').click();
    await expect(page.locator('[data-testid="export-strip"]')).toBeVisible();
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="export-strip"]')).toHaveScreenshot(
      'export-strip.png',
    );
  });

  test('06 — board panel', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="workspace-board"]')).toBeVisible();
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="workspace-board"]')).toHaveScreenshot(
      'workspace-board.png',
    );
  });

});
