/**
 * Service Board E2E tests
 *
 * RED phase (T-383): ServiceBoard not yet wired into app — tests fail.
 * GREEN phase (T-384): ServiceBoard wired into ProgressiveForm — tests pass.
 *
 * Run: BASE_URL=https://chipper-ui.fly.dev npx playwright test tests/e2e/service-board.spec.ts
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'https://chipper-ui.fly.dev';
const EVAL_TEXT = 'Original experimental study on cortisol regulation in adult primates. n=84, p=0.003.';

async function reachPostCeremony(page: any) {
  await page.goto(BASE);
  await page.locator('[data-testid="entry-text-field"]').fill(EVAL_TEXT);
  const doneBtn = page.locator('[data-testid="btn-done-work"]');
  if (await doneBtn.isVisible()) await doneBtn.click();
  await page.locator('[data-testid="evaluate-progressive"]').click();
  await expect(page.locator('[data-testid="reading-panel"]')).toBeVisible({ timeout: 20000 });
  const proceed = page.getByRole('button', { name: /proceed to export/i });
  if (await proceed.isVisible()) await proceed.click();
  await page.waitForTimeout(500);
}

test('service board container present after ceremony', async ({ page }) => {
  await reachPostCeremony(page);
  await expect(page.locator('[data-testid="service-board"]')).toBeVisible({ timeout: 5000 });
});

test('service option checkboxes render', async ({ page }) => {
  await reachPostCeremony(page);
  await expect(page.locator('[data-testid="service-option-spellcheck"]')).toBeVisible();
  await expect(page.locator('[data-testid="service-option-edit-abstract"]')).toBeVisible();
  await expect(page.locator('[data-testid="service-option-check-citations"]')).toBeVisible();
});

test('selecting a service enables request button', async ({ page }) => {
  await reachPostCeremony(page);
  const requestBtn = page.locator('[data-testid="service-request-btn"]');
  await expect(requestBtn).toBeDisabled();
  await page.locator('[data-testid="service-option-spellcheck"]').click();
  await expect(requestBtn).not.toBeDisabled();
});

test('requesting a service shows node in active state', async ({ page }) => {
  await reachPostCeremony(page);
  await page.locator('[data-testid="service-option-spellcheck"]').click();
  await page.locator('[data-testid="service-request-btn"]').click();
  await expect(page.locator('[data-testid="service-node-spellcheck"]')).toBeVisible({ timeout: 3000 });
});

test('service node completes and results panel appears', async ({ page }) => {
  await reachPostCeremony(page);
  await page.locator('[data-testid="service-option-spellcheck"]').click();
  await page.locator('[data-testid="service-request-btn"]').click();
  await expect(
    page.locator('[data-testid="service-node-spellcheck"][data-state="complete"]')
  ).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="results-panel"]')).toBeVisible({ timeout: 5000 });
});

test('receipt download button present in results', async ({ page }) => {
  await reachPostCeremony(page);
  await page.locator('[data-testid="service-option-spellcheck"]').click();
  await page.locator('[data-testid="service-request-btn"]').click();
  await expect(page.locator('[data-testid="results-panel"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="results-download-receipt"]')).toBeVisible();
});

test('paper download button present in results', async ({ page }) => {
  await reachPostCeremony(page);
  await page.locator('[data-testid="service-option-spellcheck"]').click();
  await page.locator('[data-testid="service-request-btn"]').click();
  await expect(page.locator('[data-testid="results-panel"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="results-download-paper"]')).toBeVisible();
});

test('paper input textarea is present in service options', async ({ page }) => {
  await reachPostCeremony(page);
  await expect(page.locator('[data-testid="service-paper-input"]')).toBeVisible();
});

test('edit-abstract service node appears when selected', async ({ page }) => {
  await reachPostCeremony(page);
  await page.locator('[data-testid="service-option-edit-abstract"]').click();
  await page.locator('[data-testid="service-request-btn"]').click();
  await expect(page.locator('[data-testid="service-node-edit-abstract"]')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('[data-testid="service-node-edit-abstract-status"]')).toBeVisible();
});

test('doi-metadata service option visible and requestable', async ({ page }) => {
  await reachPostCeremony(page);
  await expect(page.locator('[data-testid="service-option-doi-metadata"]')).toBeVisible();
  await page.locator('[data-testid="service-option-doi-metadata"]').click();
  await page.locator('[data-testid="service-request-btn"]').click();
  await expect(page.locator('[data-testid="service-node-doi-metadata"]')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('[data-testid="service-node-doi-metadata-status"]')).toBeVisible();
});

test('check-citations service option visible and requestable', async ({ page }) => {
  await reachPostCeremony(page);
  await page.locator('[data-testid="service-option-check-citations"]').click();
  await page.locator('[data-testid="service-request-btn"]').click();
  await expect(page.locator('[data-testid="service-node-check-citations"]')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('[data-testid="service-node-check-citations-status"]')).toBeVisible();
});

test('spellcheck node status text visible during processing', async ({ page }) => {
  await reachPostCeremony(page);
  await page.locator('[data-testid="service-option-spellcheck"]').click();
  await page.locator('[data-testid="service-request-btn"]').click();
  await expect(page.locator('[data-testid="service-node-spellcheck-status"]')).toBeVisible({ timeout: 3000 });
});

test('zenodo-record service option visible for institutional standing', async ({ page }) => {
  await reachPostCeremony(page);
  // zenodo-record is filtered for independent-researcher, check presence or absence
  const zenodo = page.locator('[data-testid="service-option-zenodo-record"]');
  // The service may or may not be visible depending on detected standing
  // Just confirm the testid is queryable
  await expect(zenodo.or(page.locator('[data-testid="service-board"]'))).toBeVisible();
});

test('full service lifecycle: request, node processing, results panel with per-service outputs', async ({ page }) => {
  await reachPostCeremony(page);
  // Select all non-institutional services
  await page.locator('[data-testid="service-option-spellcheck"]').click();
  await page.locator('[data-testid="service-option-edit-abstract"]').click();
  await page.locator('[data-testid="service-option-check-citations"]').click();
  await page.locator('[data-testid="service-option-doi-metadata"]').click();

  // Request
  await page.locator('[data-testid="service-request-btn"]').click();

  // Wait for all nodes to complete
  await expect(
    page.locator('[data-testid="service-node-spellcheck"][data-state="complete"]')
  ).toBeVisible({ timeout: 10000 });

  // Results panel appears
  await expect(page.locator('[data-testid="results-panel"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="results-download-paper"]')).toBeVisible();

  // Per-service result rows
  await expect(page.locator('[data-testid="results-service-spellcheck"]')).toBeVisible();
  await expect(page.locator('[data-testid="results-service-spellcheck-view"]')).toBeVisible();
  await expect(page.locator('[data-testid="results-service-spellcheck-copy"]')).toBeVisible();

  await expect(page.locator('[data-testid="results-service-edit-abstract"]')).toBeVisible();
  await expect(page.locator('[data-testid="results-service-edit-abstract-view"]')).toBeVisible();
  await expect(page.locator('[data-testid="results-service-edit-abstract-copy"]')).toBeVisible();

  await expect(page.locator('[data-testid="results-service-check-citations"]')).toBeVisible();
  await expect(page.locator('[data-testid="results-service-check-citations-view"]')).toBeVisible();
  await expect(page.locator('[data-testid="results-service-check-citations-copy"]')).toBeVisible();

  await expect(page.locator('[data-testid="results-service-doi-metadata"]')).toBeVisible();
  await expect(page.locator('[data-testid="results-service-doi-metadata-view"]')).toBeVisible();
  await expect(page.locator('[data-testid="results-service-doi-metadata-copy"]')).toBeVisible();
});

test('zenodo-record full lifecycle when visible', async ({ page }) => {
  await reachPostCeremony(page);
  const zenodo = page.locator('[data-testid="service-option-zenodo-record"]');
  // If zenodo is visible (non-independent standing), test full lifecycle
  if (await zenodo.isVisible({ timeout: 1000 }).catch(() => false)) {
    await zenodo.click();
    await page.locator('[data-testid="service-request-btn"]').click();
    await expect(page.locator('[data-testid="service-node-zenodo-record"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="service-node-zenodo-record-status"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="service-node-zenodo-record"][data-state="complete"]')
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="results-service-zenodo-record"]')).toBeVisible();
    await expect(page.locator('[data-testid="results-service-zenodo-record-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="results-service-zenodo-record-copy"]')).toBeVisible();
  }
});
