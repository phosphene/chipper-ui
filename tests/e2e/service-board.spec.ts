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
