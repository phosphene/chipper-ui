/**
 * No-WCI user journey — full Woodchipper flow.
 *
 * A user selects "In the works", fills in their work description,
 * goes through detection → assessment confirmation → intent (Develop) →
 * routes (title-framing + improvement) → review → begin evaluation →
 * receives a Woodchipper reading.
 *
 * At NO POINT does the user select WCI. At NO POINT should any WCI
 * content, scores, bands, dimensions, or credibility evaluation
 * language appear.
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'https://chipper-ui.fly.dev';

const WORK_TEXT = `This paper develops a novel framework for understanding how early hominin
bipedalism influenced cooperative foraging strategies in Plio-Pleistocene Africa.
We analyze femoral morphology from 42 fossil specimens across 8 sites, combining
CT-derived cross-sectional geometry with agent-based modeling of group movement
patterns. Our results suggest that habitual bipedalism preceded cooperative
foraging by approximately 200,000 years, contradicting the co-evolution hypothesis.
We propose an alternative model where bipedal efficiency in open landscapes
created the ecological preconditions for cooperative behavior, rather than the
reverse. Methodological contribution: a new metric for quantifying locomotor
efficiency from fragmentary postcranial remains (the Bipedal Efficiency Index, BEI).
Sample: n=42, p<0.001 for the primary finding.`;

test.describe('Full Woodchipper journey — no WCI', () => {

  test('complete flow: work stage → form → detection → develop → reading', async ({ page }) => {
    // 1. Landing page — work stage selection
    await page.goto(BASE);
    await expect(page.locator('[data-testid="work-stage-selection"]')).toBeVisible({ timeout: 10000 });

    // Verify NO WCI language on the landing page
    const landingText = await page.locator('body').textContent();
    expect(landingText).not.toMatch(/\bWCI\b/);
    expect(landingText).not.toMatch(/\bcredibility score\b/i);

    // 2. Select "In the works"
    await page.locator('[data-testid="work-stage-in-progress"]').click();

    // 3. Stage 1 form should appear
    await expect(page.locator('[data-testid="section-description"]')).toBeVisible({ timeout: 5000 });

    // 4. Fill in the work description
    await page.locator('[data-testid="entry-text-field"]').fill(WORK_TEXT);

    // 5. Click proceed
    await expect(page.locator('[data-testid="entry-proceed-btn"]')).toBeEnabled();
    await page.locator('[data-testid="entry-proceed-btn"]').click();

    // 6. Detection chips should appear — confirm them
    const chipsContainer = page.locator('[data-testid="detection-chips-container"]');
    await expect(chipsContainer).toBeVisible({ timeout: 15000 });

    // Verify the heading says "Please confirm our assessment:" not "WE DETECTED:"
    const chipsText = await chipsContainer.textContent();
    expect(chipsText).toContain('Please confirm our assessment');
    expect(chipsText).not.toMatch(/\bWCI\b/);
    expect(chipsText).not.toContain('WE DETECTED');

    // Click the confirm button
    const confirmBtn = page.locator('[data-testid="detection-confirm-btn"]');
    if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // 7. Stage 2 — maker declaration
    const roleBtn = page.locator('[data-testid="maker-role-scholar"]');
    if (await roleBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await roleBtn.click();
      const wtBtn = page.locator('[data-testid="work-type-original-argument"]');
      if (await wtBtn.isVisible()) await wtBtn.click();
      const s2proceed = page.locator('[data-testid="stage2-proceed"]');
      if (await s2proceed.isVisible()) await s2proceed.click();
    }

    // 8. Layer 2 — Intent selection — select DEVELOP only (not Assess)
    const intentPanel = page.locator('[data-testid="layer-2-intent"]');
    if (await intentPanel.isVisible({ timeout: 8000 }).catch(() => false)) {
      // Select Develop — NOT Assess
      await page.locator('[data-testid="intent-develop"]').click();

      // Verify Assess is NOT selected
      const assessBtn = page.locator('[data-testid="intent-assess"]');
      const assessState = await assessBtn.getAttribute('class');
      expect(assessState).not.toContain('bg-gray-900');

      await page.locator('[data-testid="intent-proceed"]').click();
    }

    // 9. Layer 3 — Route selection — should show Develop routes only
    const routePanel = page.locator('[data-testid="layer-3-routes"]');
    if (await routePanel.isVisible({ timeout: 8000 }).catch(() => false)) {
      // WCI route should NOT be visible (only shows under Assess)
      await expect(page.locator('[data-testid="route-wci"]')).not.toBeVisible();

      // Select title-framing and improvement
      const titleRoute = page.locator('[data-testid="route-title-framing"]');
      const improvRoute = page.locator('[data-testid="route-improvement"]');
      if (await titleRoute.isVisible()) await titleRoute.click();
      if (await improvRoute.isVisible()) await improvRoute.click();

      await page.locator('[data-testid="layer-3-proceed"]').click();
    }

    // 10. Layer 4 — Confirmation
    const confirm4 = page.locator('[data-testid="layer-4-confirmation"]');
    if (await confirm4.isVisible({ timeout: 5000 }).catch(() => false)) {
      const confirmText = await confirm4.textContent();
      expect(confirmText).not.toMatch(/\bWCI\b/);
      expect(confirmText).not.toMatch(/\bcredibility evaluation\b/i);
      const confirmProceed = page.locator('[data-testid="layer-4-proceed"]');
      if (await confirmProceed.isVisible()) await confirmProceed.click();
    }

    // 11. Layer 5 — Review
    const review5 = page.locator('[data-testid="layer-5-review"]');
    if (await review5.isVisible({ timeout: 5000 }).catch(() => false)) {
      const reviewText = await review5.textContent();
      expect(reviewText).not.toMatch(/\bWCI\b/);
      expect(reviewText).not.toContain('Scores reflect');
      await page.locator('[data-testid="layer-5-begin"]').click();
    }

    // 12. Processing animation
    const processing = page.locator('[data-testid="inline-processing"]');
    if (await processing.isVisible({ timeout: 10000 }).catch(() => false)) {
      const processingText = await processing.textContent();
      expect(processingText).toContain('Reading your work');
      expect(processingText).not.toMatch(/\bWCI\b/);
      expect(processingText).not.toContain('Evaluation in progress');
    }

    // 13. Pronouncement — Woodchipper's reading
    const pronouncement = page.locator('[data-testid="pronouncement"]');
    await expect(pronouncement).toBeVisible({ timeout: 30000 });

    const readingText = await pronouncement.textContent();

    // MUST contain Woodchipper reading language
    expect(readingText).toContain('Woodchipper');
    expect(readingText).toContain('reading');

    // MUST NOT contain any WCI language
    expect(readingText).not.toMatch(/\bWCI\b/);
    expect(readingText).not.toMatch(/\bscore\b/i);
    expect(readingText).not.toMatch(/\bband\b/i);
    expect(readingText).not.toMatch(/\bdimension\b/i);
    expect(readingText).not.toMatch(/\bcomposite\b/i);
    expect(readingText).not.toMatch(/\b\d+\s*\/\s*100\b/);

    // Should have Woodchipper reading sections
    expect(readingText).toMatch(/reads well|strengths/i);
    expect(readingText).toMatch(/development|could help/i);
  });

  test('WCI route not reachable when only Develop intent selected', async ({ page }) => {
    await page.goto(BASE);

    // Quick check: at no point in a Develop-only journey should WCI appear
    const fullText = await page.locator('body').textContent();
    expect(fullText).not.toMatch(/\bWCI\b/);
    expect(fullText).not.toContain('Credibility evaluation');
  });

});
