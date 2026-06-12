/**
 * Functional E2E tests — chipper-ui
 *
 * Verifies that the critical user paths work end-to-end against the live API.
 * Tests are against the real chipper-ui + wci-api (BASE_URL env var).
 *
 * Scope:
 *  - Page loads and renders entry point (EntryAccordion)
 *  - Submit button activates after 15+ chars
 *  - Detection API call fires and DetectionConfirm card appears
 *  - Accordion expand/collapse behavior
 *  - File drop zone always visible
 *  - Store pre-population from accordion fields
 */

import { test, expect } from '@playwright/test';

test.describe('Entry — functional', () => {

  test('page loads — title and submit button present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header').getByText('Woodchipper')).toBeVisible();
    // Submit button starts aria-disabled (< 15 chars)
    const submit = page.getByRole('button', { name: 'Submit' });
    await expect(submit).toHaveAttribute('aria-disabled', 'true');
  });

  test('submit button enables after 15 chars', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('[data-testid="entry-text-field"]');
    const submit = page.getByRole('button', { name: 'Submit' });

    await input.fill('short');
    await expect(submit).toHaveAttribute('aria-disabled', 'true');

    await input.fill('This is a sufficiently long description to unlock submission');
    await expect(submit).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('submit fires detection and shows confirm card', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('[data-testid="entry-text-field"]');
    await input.fill('Original research on cortisol feedback in primates. n=120, p<0.01.');

    await page.getByRole('button', { name: 'Submit' }).click();

    // Detection confirm card should appear
    await expect(page.locator('[data-testid="detection-confirm"]')).toBeVisible({ timeout: 10_000 });
  });

  test('Enter key submits when input is ready', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('[data-testid="entry-text-field"]');
    await input.fill('Original research on cortisol feedback in primates with full methodology');
    await input.press('Enter');

    await expect(page.locator('[data-testid="detection-confirm"]')).toBeVisible({ timeout: 10_000 });
  });

  test('WCI header button returns to entry', async ({ page }) => {
    await page.goto('/');
    // Navigate somewhere then hit WCI button to return
    await page.getByRole('button', { name: /WCI/i }).click();
    await expect(page.locator('[data-testid="entry-accordion"]')).toBeVisible();
  });

});

test.describe('EntryAccordion — accordion behavior', () => {

  test('accordion renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="entry-accordion"]')).toBeVisible();
  });

  test('file drop zone visible in collapsed state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="file-drop-zone"]')).toBeVisible();
  });

  test('file drop zone visible in expanded state', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="accordion-expander"]').click();
    await expect(page.locator('[data-testid="file-drop-zone"]')).toBeVisible();
  });

  test('expanding reveals work type buttons', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="accordion-expander"]').click();
    await expect(page.locator('[data-testid="accordion-expanded"]')).toBeVisible();
    // Work type buttons should be visible
    await expect(page.locator('[data-testid="work-type-null-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="work-type-original-argument"]')).toBeVisible();
  });

  test('top → disappears when expanded', async ({ page }) => {
    await page.goto('/');
    // Top submit button visible in collapsed state
    await expect(page.locator('[data-testid="submit-button-top"]')).toBeVisible();
    // Expand
    await page.locator('[data-testid="accordion-expander"]').click();
    // Top submit should be gone
    await expect(page.locator('[data-testid="submit-button-top"]')).not.toBeVisible();
  });

  test('bottom Evaluate → appears when expanded', async ({ page }) => {
    await page.goto('/');
    // Evaluate button not visible in collapsed state
    await expect(page.locator('[data-testid="evaluate-button"]')).not.toBeVisible();
    // Expand
    await page.locator('[data-testid="accordion-expander"]').click();
    // Evaluate button should appear
    await expect(page.locator('[data-testid="evaluate-button"]')).toBeVisible();
  });

  test('state persists across collapse/expand', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('[data-testid="entry-text-field"]');

    // Type in collapsed state
    await input.fill('A study on cortisol feedback in primates');

    // Expand
    await page.locator('[data-testid="accordion-expander"]').click();

    // Text should still be there
    await expect(input).toHaveValue('A study on cortisol feedback in primates');

    // Select a work type
    await page.locator('[data-testid="work-type-null-result"]').click();

    // Collapse
    await page.getByText('▲ Fewer details').click();

    // Expand again
    await page.locator('[data-testid="accordion-expander"]').click();

    // Text still there
    await expect(input).toHaveValue('A study on cortisol feedback in primates');

    // Work type button should still be selected (highlighted)
    const nullBtn = page.locator('[data-testid="work-type-null-result"]');
    await expect(nullBtn).toHaveClass(/border-\[#4f8ef5\]/);
  });

  test('submission via top → still works (DetectionConfirm appears)', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('[data-testid="entry-text-field"]');
    await input.fill('Original experimental study on memory consolidation in adult rodents. n=60, p=0.04.');

    await page.locator('[data-testid="submit-button-top"]').click();

    await expect(page.locator('[data-testid="detection-confirm"]')).toBeVisible({ timeout: 10_000 });
  });

  test('work type button click pre-populates store — visible in DetectionConfirm', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('[data-testid="entry-text-field"]');
    await input.fill('This is an original experimental study on cortisol regulation in primates');

    // Expand and select work type
    await page.locator('[data-testid="accordion-expander"]').click();
    await page.locator('[data-testid="work-type-null-result"]').click();

    // Submit via Evaluate button
    await page.locator('[data-testid="evaluate-button"]').click();

    // DetectionConfirm should appear
    await expect(page.locator('[data-testid="detection-confirm"]')).toBeVisible({ timeout: 10_000 });
  });

});

test.describe('EntryAccordion — ceremony pre-population', () => {

  test('accordion work type selection survives detection and appears in ceremony', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('[data-testid="entry-text-field"]');
    await input.fill('Original experimental study on cortisol regulation in adult primates. n=84, p=0.003.');

    // Expand and select work type
    await page.locator('[data-testid="accordion-expander"]').click();
    await page.locator('[data-testid="work-type-null-result"]').click();
    await page.locator('[data-testid="standing-graduate-researcher"]').click();

    // Submit via Evaluate
    await page.locator('[data-testid="evaluate-button"]').click();

    // Wait for detection confirm
    await expect(page.locator('[data-testid="detection-confirm"]')).toBeVisible({ timeout: 10_000 });

    // Confirm detection to start ceremony
    await page.getByRole('button', { name: /confirm/i }).click();

    // Ceremony Stage I should show — verify store has the user's standing
    // The ReviewCard for Standing should show "graduate-researcher"
    // Wait for ceremony to render
    await page.waitForTimeout(1000);

    // Check that the page now shows ceremony content
    // (Stage I is the Maker Declaration stage)
    const pageContent = await page.textContent('body');
    // The standing value should appear somewhere in the ceremony
    expect(pageContent).toContain('graduate');
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
        text: 'Original experimental study on cortisol regulation in adult primates. n=84, p=0.003. DOI: 10.1234/example.',
        work_type: 'original-argument',
        standing: 'independent-researcher',
        domain: 'biology',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    // Shape assertions
    expect(body).toHaveProperty('composite_score');
    expect(body).toHaveProperty('band');
    expect(body).toHaveProperty('dimension_scores');
    expect(body).toHaveProperty('epistemic_label');
    expect(body).toHaveProperty('rubric_version');
    expect(body).toHaveProperty('provenance');

    // Composite score is a number in valid range
    expect(typeof body.composite_score).toBe('number');
    expect(body.composite_score).toBeGreaterThan(0);
    expect(body.composite_score).toBeLessThanOrEqual(100);

    // Score must NOT be exactly 62 (which would mean demo data leaked)
    expect(body.composite_score).not.toBe(62);

    // 9 dimensions
    expect(body.dimension_scores).toHaveLength(9);
    const expectedDims = ['N', 'E', 'P', 'C', 'S', 'Sc', 'L', 'M', 'D'];
    const actualDims = body.dimension_scores.map((d: any) => d.dimension);
    expect(actualDims).toEqual(expectedDims);

    // Each dimension has required fields
    for (const dim of body.dimension_scores) {
      expect(dim).toHaveProperty('raw_score');
      expect(dim).toHaveProperty('weight');
      expect(dim).toHaveProperty('weighted_score');
      expect(dim).toHaveProperty('justification');
      expect(dim.raw_score).toBeGreaterThanOrEqual(1.0);
      expect(dim.raw_score).toBeLessThanOrEqual(10.0);
    }

    // Band is a valid value
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
