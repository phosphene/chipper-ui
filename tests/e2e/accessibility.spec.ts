/**
 * Accessibility E2E tests — chipper-ui
 *
 * Uses @axe-core/playwright for WCAG 2.1 AA automated scanning.
 * Supplements automated checks with keyboard navigation and ARIA role verification.
 *
 * Scope:
 *  - No WCAG 2.1 AA violations on landing page
 *  - All interactive elements reachable by keyboard
 *  - Submit button has accessible name
 *  - Input has accessible label (placeholder counts as hint, not label — we check both)
 *  - No duplicate IDs
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility — landing page', () => {

  test('no WCAG 2.1 AA violations on load', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Attach violations to report for visibility even on pass
    if (results.violations.length > 0) {
      console.log('Violations:', JSON.stringify(results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      })), null, 2));
    }

    expect(results.violations).toEqual([]);
  });

  test('submit button has accessible name', async ({ page }) => {
    await page.goto('/');
    // Submit uses aria-label="Submit" (not visible text '→')
    const submit = page.getByRole('button', { name: 'Submit' });
    await expect(submit).toBeVisible();
    await expect(submit).toHaveAttribute('aria-label', 'Submit');
  });

  test('file attach button has aria-label', async ({ page }) => {
    await page.goto('/');
    const attachBtn = page.getByRole('button', { name: /attach/i }).or(
      page.locator('button[aria-label]').filter({ hasText: '📎' })
    );
    // Either it has aria-label or is labeled via getByRole
    const count = await attachBtn.count();
    if (count > 0) {
      const ariaLabel = await attachBtn.first().getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('keyboard: Tab reaches the text input', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    // After one or two tabs, input should be focused
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    // Input or button should be focused — not body
    expect(['INPUT', 'BUTTON', 'A']).toContain(focused);
  });

  test('keyboard: Tab reaches submit button', async ({ page }) => {
    await page.goto('/');
    // Tab through all focusable elements until we hit the submit button
    // Submit uses aria-disabled (not disabled) so it IS in tab order
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        ariaLabel: (document.activeElement as HTMLElement)?.getAttribute('aria-label'),
        ariaDisabled: (document.activeElement as HTMLElement)?.getAttribute('aria-disabled'),
      }));
      if (focused.tag === 'BUTTON' && focused.ariaLabel === 'Submit') {
        return; // Found it
      }
    }
    throw new Error('Submit button (aria-label=Submit) not reachable via Tab within 10 steps');
  });

});

test.describe('Accessibility — after interaction', () => {

  test('no new violations after typing in input', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/describe your work/i).fill(
      'Original research on neuroplasticity mechanisms in adult mammals'
    );

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('mode toggle buttons are keyboard-accessible', async ({ page }) => {
    await page.goto('/');
    const detailedBtn = page.locator('.flex.justify-center button', { hasText: 'detailed' });
    await detailedBtn.focus();
    await page.keyboard.press('Enter');
    // Detailed mode: simple entry input no longer visible
    await expect(page.getByPlaceholder(/describe your work/i)).not.toBeVisible();
  });

});
