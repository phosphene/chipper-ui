/**
 * Export E2E tests — chipper-ui
 *
 * TDD proof:
 * RED: These tests failed against stub handlers (alert() only, no download).
 *   Proof: commit 90e5e5e had alert() stubs — download events never fired.
 *   Captured during first T-366 attempt on Hetzner (2026-06-21).
 *
 * GREEN: Tests pass after real export implementation (commit 3e956ff):
 *   buildMarkdown() + buildJSON() in lib/export.ts wired to handlers.
 *
 * Run: BASE_URL=https://chipper-ui.fly.dev npx playwright test tests/e2e/export.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'https://chipper-ui.fly.dev';
const EVAL_TEXT =
  'Original experimental study on cortisol regulation in adult primates. n=84, p=0.003.';

async function reachExportStrip(page: any) {
  await page.goto(BASE);
  await page.locator('[data-testid="entry-text-field"]').fill(EVAL_TEXT);
  const doneBtn = page.locator('[data-testid="btn-done-work"]');
  if (await doneBtn.isVisible()) await doneBtn.click();
  await page.locator('[data-testid="evaluate-progressive"]').click();
  await expect(page.locator('[data-testid="reading-panel"]')).toBeVisible({
    timeout: 20_000,
  });
  const proceed = page.getByRole('button', { name: /proceed to export/i });
  if (await proceed.isVisible()) await proceed.click();
  await page.waitForTimeout(500);
}

async function assertExportButtonsVisible(page: any) {
  await expect(page.locator('[data-testid="export-strip"]')).toBeVisible();
  await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible();
  await expect(page.locator('[data-testid="export-markdown"]')).toBeVisible();
  await expect(page.locator('[data-testid="export-json"]')).toBeVisible();
  await expect(page.locator('[data-testid="export-copy"]')).toBeVisible();
}

test.describe('Export — Markdown', () => {
  test('Markdown button triggers .md file download', async ({ page }) => {
    await reachExportStrip(page);
    await assertExportButtonsVisible(page);
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 8_000 }),
      page.locator('[data-testid="export-markdown"]').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.md$/);
  });
});

test.describe('Export — JSON', () => {
  test('JSON button triggers .json download with valid evaluation content', async ({
    page,
  }) => {
    await reachExportStrip(page);
    await assertExportButtonsVisible(page);
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 8_000 }),
      page.locator('[data-testid="export-json"]').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    const filePath = await download.path();
    if (filePath) {
      const { readFileSync } = await import('fs');
      const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('evaluation');
      expect(parsed.evaluation).toHaveProperty('compositeScore');
    }
  });
});

test.describe('Export — PDF', () => {
  test('PDF button opens print-ready page in new tab', async ({
    page,
    context,
  }) => {
    await reachExportStrip(page);
    await assertExportButtonsVisible(page);
    const [popup] = await Promise.all([
      context.waitForEvent('page', { timeout: 8_000 }),
      page.locator('[data-testid="export-pdf"]').click(),
    ]);
    expect(popup).toBeTruthy();
    await popup.waitForLoadState('load', { timeout: 8_000 }).catch(() => null);
  });
});

test.describe('Export — Copy', () => {
  test('Copy button does not throw and export strip remains visible', async ({
    page,
  }) => {
    await reachExportStrip(page);
    await assertExportButtonsVisible(page);
    // Copy writes to clipboard — can't assert clipboard content in headless
    // but we can assert no error thrown and UI stays intact
    await page.locator('[data-testid="export-copy"]').click();
    await page.waitForTimeout(500);
    await expect(
      page.locator('[data-testid="export-strip"]')
    ).toBeVisible();
  });
});
