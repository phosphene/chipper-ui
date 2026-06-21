/**
 * Full ceremony E2E path — Beat I through Recording
 *
 * Exercises the complete progressive-form ceremony flow on the live site:
 *   Entry → Creator Role → Hopes → Domain → Evaluate → Pronouncement → Export
 *
 * The ceremony is the full path through the Woodchipper UI from blank page
 * to a completed evaluation with export options available. Each progressive
 * section rises up in sequence — no page navigation, single-page architecture.
 *
 * T-367
 */

import { test, expect } from '@playwright/test';

const ACADEMIC_TEXT = [
  'Original experimental study on cortisol regulation in stressed adult primates.',
  'This systematic investigation (n=84, p=0.003) reveals novel pathways in',
  'neuroendocrine feedback mechanisms during chronic social stress. Our findings',
  'demonstrate that hierarchical position modulates HPA axis reactivity through',
  'previously undocumented serotonergic intermediaries.',
].join(' ');

test.describe('Full ceremony path — progressive form through export', () => {

  test('complete ceremony: entry → role → hopes → evaluate → pronouncement → export', async ({ page }) => {
    // ── Beat I: Entry ─────────────────────────────────────────────────────
    await page.goto('/');
    await expect(page.locator('[data-testid="progressive-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="entry-text-field"]')).toBeVisible();

    // Evaluate button should be disabled before text entry
    await expect(page.locator('[data-testid="evaluate-progressive"]')).toBeDisabled();

    // Fill work text
    await page.locator('[data-testid="entry-text-field"]').fill(ACADEMIC_TEXT);
    await page.screenshot({ path: '/tmp/pw-test/ceremony-01-entry.png' });

    // Done completes the work section and reveals creator role
    await page.locator('[data-testid="btn-done-work"]').click();
    await expect(page.locator('[data-testid="section-work-complete"]')).toBeVisible();

    // ── Beat II: Creator Role ─────────────────────────────────────────────
    await expect(page.locator('[data-testid="section-creator-role"]')).toBeVisible();
    await expect(page.locator('[data-testid="creator-role-sole"]')).toBeVisible();

    // Select "Sole creator"
    await page.locator('[data-testid="creator-role-sole"]').click();
    await page.locator('[data-testid="btn-done-creator-role"]').click();
    await expect(page.locator('[data-testid="section-creator-role-complete"]')).toBeVisible();
    await page.screenshot({ path: '/tmp/pw-test/ceremony-02-role.png' });

    // ── Beat III: Hopes ───────────────────────────────────────────────────
    await expect(page.locator('[data-testid="section-hopes"]')).toBeVisible();
    await expect(page.locator('[data-testid="hope-analysis"]')).toBeVisible();

    // Select "Analysis" hope
    await page.locator('[data-testid="hope-analysis"]').click();
    await page.locator('[data-testid="btn-done-hopes"]').click();
    await expect(page.locator('[data-testid="section-hopes-complete"]')).toBeVisible();
    await page.screenshot({ path: '/tmp/pw-test/ceremony-03-hopes.png' });

    // ── Beat IV: Domain (optional) ────────────────────────────────────────
    // Domain section appears after hopes — skip it to proceed
    await expect(page.locator('[data-testid="section-domain"]')).toBeVisible();
    await page.locator('[data-testid="btn-skip-domain"]').click();
    await page.screenshot({ path: '/tmp/pw-test/ceremony-04-domain.png' });

    // ── Beat V: Evaluate ──────────────────────────────────────────────────
    // Evaluate button should now be enabled
    const evaluateBtn = page.locator('[data-testid="evaluate-progressive"]');
    await expect(evaluateBtn).toBeEnabled();
    await evaluateBtn.click();

    // ── Beat VI: Pronouncement ────────────────────────────────────────────
    // Reading panel and pronouncement appear after evaluation completes
    await expect(page.locator('[data-testid="reading-panel"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="pronouncement"]')).toBeVisible();
    await page.screenshot({ path: '/tmp/pw-test/ceremony-05-pronouncement.png' });

    // Pronouncement should contain substantive content (not empty)
    const pronouncementText = await page.locator('[data-testid="pronouncement"]').textContent();
    expect(pronouncementText!.length).toBeGreaterThan(50);

    // ── Beat VII: Proceed to Export ───────────────────────────────────────
    await expect(page.locator('[data-testid="pronouncement-proceed"]')).toBeVisible();
    await page.locator('[data-testid="pronouncement-proceed"]').click();
    await page.screenshot({ path: '/tmp/pw-test/ceremony-06-export.png' });

    // ── Beat VIII: Export Strip ────────────────────────────────────────────
    // Export options should be visible
    await expect(page.locator('[data-testid="export-strip"]')).toBeVisible();

    // Workspace panels remain visible throughout — single-page architecture
    await expect(page.locator('[data-testid="workspace-panels"]')).toBeVisible();

    // URL never changed — no page navigation occurred
    expect(page.url()).toMatch(/\/$/);
  });

  test('ceremony with skip path: skip role → skip hopes → skip domain → evaluate', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="entry-text-field"]')).toBeVisible();

    // Fill text and complete work
    await page.locator('[data-testid="entry-text-field"]').fill(ACADEMIC_TEXT);
    await page.locator('[data-testid="btn-done-work"]').click();
    await expect(page.locator('[data-testid="section-work-complete"]')).toBeVisible();

    // Skip creator role
    await page.locator('[data-testid="btn-skip-creator-role"]').click();
    await expect(page.locator('[data-testid="section-creator-role-complete"]')).toBeVisible();

    // Skip hopes
    await page.locator('[data-testid="btn-skip-hopes"]').click();
    await expect(page.locator('[data-testid="section-hopes-complete"]')).toBeVisible();

    // Skip domain
    await page.locator('[data-testid="btn-skip-domain"]').click();

    // Evaluate
    await page.locator('[data-testid="evaluate-progressive"]').click();
    await expect(page.locator('[data-testid="reading-panel"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="pronouncement"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-strip"]')).toBeVisible();

    // Full ceremony completed via skip path
    expect(page.url()).toMatch(/\/$/);
  });

  test('ceremony sections rise in sequence — no premature reveals', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // On load: only work section visible, not subsequent sections
    await expect(page.locator('[data-testid="section-work"]')).toBeVisible();
    await expect(page.locator('[data-testid="section-creator-role"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="section-hopes"]')).not.toBeVisible();

    // Complete work → creator role appears
    await page.locator('[data-testid="entry-text-field"]').fill(ACADEMIC_TEXT);
    await page.locator('[data-testid="btn-done-work"]').click();
    await expect(page.locator('[data-testid="section-creator-role"]')).toBeVisible();
    await expect(page.locator('[data-testid="section-hopes"]')).not.toBeVisible();

    // Complete creator role → hopes appears
    await page.locator('[data-testid="creator-role-sole"]').click();
    await page.locator('[data-testid="btn-done-creator-role"]').click();
    await expect(page.locator('[data-testid="section-hopes"]')).toBeVisible();
    await expect(page.locator('[data-testid="section-domain"]')).not.toBeVisible();

    // Complete hopes → domain appears
    await page.locator('[data-testid="hope-review"]').click();
    await page.locator('[data-testid="btn-done-hopes"]').click();
    await expect(page.locator('[data-testid="section-domain"]')).toBeVisible();
  });

  test('pronouncement contains reading with evaluation content', async ({ page }) => {
    await page.goto('/');

    // Fast path through to pronouncement
    await page.locator('[data-testid="entry-text-field"]').fill(ACADEMIC_TEXT);
    await page.locator('[data-testid="btn-done-work"]').click();
    await page.locator('[data-testid="btn-skip-creator-role"]').click();
    await page.locator('[data-testid="btn-skip-hopes"]').click();
    await page.locator('[data-testid="btn-skip-domain"]').click();
    await page.locator('[data-testid="evaluate-progressive"]').click();

    await expect(page.locator('[data-testid="pronouncement"]')).toBeVisible({ timeout: 15_000 });

    // Pronouncement must have actual evaluation content
    const text = await page.locator('[data-testid="pronouncement"]').textContent();
    expect(text!.length).toBeGreaterThan(100);

    // "Proceed to export" button must be present
    await expect(page.locator('[data-testid="pronouncement-proceed"]')).toBeVisible();
    const btnText = await page.locator('[data-testid="pronouncement-proceed"]').textContent();
    expect(btnText).toMatch(/export/i);
  });

  test('board remains visible throughout ceremony', async ({ page }) => {
    await page.goto('/');

    // Board visible on load
    await expect(page.locator('[data-testid="workspace-board"]')).toBeVisible();

    // Complete ceremony
    await page.locator('[data-testid="entry-text-field"]').fill(ACADEMIC_TEXT);
    await page.locator('[data-testid="btn-done-work"]').click();
    await page.locator('[data-testid="btn-skip-creator-role"]').click();
    await page.locator('[data-testid="btn-skip-hopes"]').click();
    await page.locator('[data-testid="btn-skip-domain"]').click();
    await page.locator('[data-testid="evaluate-progressive"]').click();
    await expect(page.locator('[data-testid="pronouncement"]')).toBeVisible({ timeout: 15_000 });

    // Board still visible after evaluation
    await expect(page.locator('[data-testid="workspace-board"]')).toBeVisible();
    await expect(page.locator('[data-testid="live-board-canvas"]')).toBeVisible();
  });

});
