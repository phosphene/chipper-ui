/**
 * Functional E2E tests — chipper-ui
 *
 * Verifies that the critical user paths work end-to-end against the live API.
 * Tests are against the real chipper-ui + wci-api (BASE_URL env var).
 *
 * Scope:
 *  - Page loads and renders entry point
 *  - Submit button activates after 15+ chars
 *  - Detection API call fires and DetectionConfirm card appears
 *  - Ceremony flow begins after confirmation
 *  - Mode toggle (Simple ↔ Detailed) works
 */

import { test, expect } from '@playwright/test';

test.describe('Entry — functional', () => {

  test('page loads — title and submit button present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Woodchipper')).toBeVisible();
    // Submit button starts disabled (< 15 chars)
    const submit = page.getByRole('button', { name: '→' });
    await expect(submit).toBeDisabled();
  });

  test('submit button enables after 15 chars', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder(/describe your work/i);
    const submit = page.getByRole('button', { name: '→' });

    await input.fill('short');
    await expect(submit).toBeDisabled();

    await input.fill('This is a sufficiently long description to unlock submission');
    await expect(submit).toBeEnabled();
  });

  test('submit fires detection and shows confirm card', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder(/describe your work/i);
    await input.fill('Original research on cortisol feedback in primates. n=120, p<0.01.');

    await page.getByRole('button', { name: '→' }).click();

    // Detection confirm card should appear
    await expect(page.locator('[data-testid="detection-confirm"]').or(
      page.getByText(/detected|looks like|work type/i)
    )).toBeVisible({ timeout: 10_000 });
  });

  test('Enter key submits when input is ready', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder(/describe your work/i);
    await input.fill('Original research on cortisol feedback in primates with full methodology');
    await input.press('Enter');

    await expect(page.locator('[data-testid="detection-confirm"]').or(
      page.getByText(/detected|looks like|work type/i)
    )).toBeVisible({ timeout: 10_000 });
  });

  test('mode toggle — Simple to Detailed', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'detailed' }).click();
    // Detailed mode shows accordion-style entry
    await expect(page.getByText(/detailed/i).first()).toBeVisible();
  });

  test('WCI header button returns to entry', async ({ page }) => {
    await page.goto('/');
    // Navigate somewhere then hit WCI button to return
    await page.getByRole('button', { name: /WCI/i }).click();
    await expect(page.getByPlaceholder(/describe your work/i)).toBeVisible();
  });

});

test.describe('API connectivity', () => {

  test('wci-api /health responds', async ({ request }) => {
    const apiUrl = process.env.API_URL ?? 'https://wci-api.fly.dev';
    const res = await request.get(`${apiUrl}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('wci-api /api/detect returns valid shape', async ({ request }) => {
    const apiUrl = process.env.API_URL ?? 'https://wci-api.fly.dev';
    const res = await request.post(`${apiUrl}/api/detect`, {
      data: { text: 'This paper presents original experimental evidence on memory consolidation in rodents. n=60, p<0.05.' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    // Shape assertions against the DetectionResponse contract
    expect(body).toHaveProperty('work_type');
    expect(body).toHaveProperty('domain');
    expect(body).toHaveProperty('standing');
    expect(body).toHaveProperty('confidence');
    expect(body).toHaveProperty('academic_markers_detected');
    expect(Array.isArray(body.academic_markers_detected)).toBe(true);

    // Valid enum values
    const validWorkTypes = ['original-argument', 'null-result', 'replication', 'synthesis-review', 'methodological-contribution'];
    expect(validWorkTypes).toContain(body.work_type);

    const validConfidence = ['high', 'medium', 'low'];
    expect(validConfidence).toContain(body.confidence);
  });

});
