/**
 * Functional E2E tests — chipper-ui
 *
 * Single-page architecture: no mode swaps. ProgressiveForm owns Stage 1.
 * Entry text (description) is always visible first. Proceed → turns black at 15+ chars.
 * Subsequent sections rise up — no page jumps.
 *
 * T-389: Updated for Stage 1 field order (description, upload, details, role, domain).
 */

import { test, expect } from '@playwright/test';

// ── Helpers ──────────────────────────────────────────────────────────────────

const LONG_TEXT = 'Original experimental study on cortisol regulation in adult primates. n=84, p=0.003.';
const SHORT_TEXT = 'short';

test.describe('Entry — page loads', () => {

  test('header shows Woodchipper', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header').getByText('Woodchipper')).toBeVisible();
  });

  test('entry text field present on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="entry-text-field"]')).toBeVisible();
  });

  test('workspace-panels present on load — no mode jump required', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="workspace-panels"]')).toBeVisible();
  });

  test('progressive-form present on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="progressive-form"]')).toBeVisible();
  });

});

test.describe('Entry — Proceed button', () => {

  test('Proceed button disabled before 15 chars', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('[data-testid="entry-proceed-btn"]');
    await expect(btn).toBeDisabled();
  });

  test('Proceed button enables after 15+ chars', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="entry-text-field"]').fill(LONG_TEXT);
    const btn = page.locator('[data-testid="entry-proceed-btn"]');
    await expect(btn).not.toBeDisabled();
  });

  test('short text keeps Proceed disabled', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="entry-text-field"]').fill(SHORT_TEXT);
    const btn = page.locator('[data-testid="entry-proceed-btn"]');
    await expect(btn).toBeDisabled();
  });

});

test.describe('Entry — Stage 1 field order', () => {

  test('description section is active on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="section-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="entry-text-field"]')).toBeVisible();
  });

  test('"As you proceed..." section visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="as-you-proceed"]')).toBeVisible();
    const text = await page.locator('[data-testid="as-you-proceed"]').textContent();
    expect(text).toContain('Woodchipper facilitates development');
    expect(text).toContain('Each phase of your work will be saved');
    expect(text).toContain('open about its capabilities');
  });

  test('Proceed button text says "Proceed →"', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('[data-testid="entry-proceed-btn"]');
    await expect(btn).toHaveText('Proceed →');
  });

});

test.describe('Entry — no page navigation', () => {

  test('URL stays at / during form interaction', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="entry-text-field"]').fill(LONG_TEXT);
    await page.waitForTimeout(500);
    expect(page.url()).toMatch(/\/$/);
  });

  test('workspace-panels stays visible during interaction', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="entry-text-field"]').fill(LONG_TEXT);
    await expect(page.locator('[data-testid="workspace-panels"]')).toBeVisible();
    await expect(page.locator('[data-testid="progressive-form"]')).toBeVisible();
  });

});

test.describe('Board', () => {

  test('board toggle hides and shows board', async ({ page }) => {
    await page.goto('/');
    const board = page.locator('[data-testid="workspace-board"]');
    await expect(board).toBeVisible();
    await page.locator('[data-testid="board-toggle"]').click();
    await expect(board).not.toBeVisible();
    await page.locator('[data-testid="board-toggle"]').click();
    await expect(board).toBeVisible();
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

  test('wci-api /api/score returns valid 9-dimension response', async ({ request }) => {
    const apiUrl = process.env.API_URL ?? 'https://wci-api.fly.dev';
    const res = await request.post(`${apiUrl}/api/score`, {
      data: {
        text: 'This systematic review and meta-analysis examines 47 studies on memory consolidation, sleep deprivation, and hippocampal plasticity. et al., p<0.01, n=1240.',
        work_type: 'original-argument',
        standing: 'independent-researcher',
        domain: 'biology',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('composite_score');
    expect(body).toHaveProperty('band');
    expect(body).toHaveProperty('dimension_scores');
    expect(body).toHaveProperty('epistemic_label');
    expect(body).toHaveProperty('rubric_version');
    expect(body).toHaveProperty('provenance');
    expect(typeof body.composite_score).toBe('number');
    expect(body.composite_score).toBeGreaterThan(0);
    expect(body.composite_score).toBeLessThanOrEqual(100);
    expect(body.composite_score).not.toBe(62);
    expect(body.dimension_scores).toHaveLength(9);
    const expectedDims = ['N', 'E', 'P', 'C', 'S', 'Sc', 'L', 'M', 'D'];
    const actualDims = body.dimension_scores.map((d: any) => d.dimension);
    expect(actualDims).toEqual(expectedDims);
    for (const dim of body.dimension_scores) {
      expect(dim).toHaveProperty('raw_score');
      expect(dim).toHaveProperty('weight');
      expect(dim).toHaveProperty('weighted_score');
      expect(dim).toHaveProperty('justification');
      expect(dim.raw_score).toBeGreaterThanOrEqual(1.0);
      expect(dim.raw_score).toBeLessThanOrEqual(10.0);
    }
    const validBands = ['landmark', 'significant', 'promising', 'developing', 'early-stage'];
    expect(validBands).toContain(body.band);
  });

  test('wci-api /api/detect returns valid shape', async ({ request }) => {
    const apiUrl = process.env.API_URL ?? 'https://wci-api.fly.dev';
    const res = await request.post(`${apiUrl}/api/detect`, {
      data: { text: 'This paper presents original experimental evidence on memory consolidation in rodents. n=60, p<0.05.' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('work_type');
    expect(body).toHaveProperty('domain');
    expect(body).toHaveProperty('standing');
    expect(body).toHaveProperty('confidence');
    expect(body).toHaveProperty('academic_markers_detected');
    expect(Array.isArray(body.academic_markers_detected)).toBe(true);
    const validWorkTypes = ['original-argument', 'null-result', 'replication', 'synthesis-review', 'methodological-contribution'];
    expect(validWorkTypes).toContain(body.work_type);
    const validConfidence = ['high', 'medium', 'low'];
    expect(validConfidence).toContain(body.confidence);
  });

});

test.describe('Brand integrity', () => {

  test('landing page has no WCI mention', async ({ page }) => {
    await page.goto('/');
    const content = await page.locator('main').textContent();
    expect(content).not.toMatch(/credibility index/i);
    expect(content).not.toContain('⚖ WCI');
  });

  test('dev jump button present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="stage2-jump"]')).toBeVisible();
  });

  test('page title is Woodchipper', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/^Woodchipper/);
    const title = await page.title();
    expect(title).not.toMatch(/credibility index/i);
  });

});
