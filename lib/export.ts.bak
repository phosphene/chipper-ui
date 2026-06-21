/**
 * lib/export.ts — Pure export logic for Woodchipper evaluations.
 *
 * These functions have no DOM dependencies and no side effects.
 * They take a WCIResult + work text and return a string.
 * All browser interactions (download, clipboard, window.open) live
 * in the component layer — not here.
 *
 * @behavior Converts a WCIResult into formatted export strings.
 * @invariants buildMarkdown always returns a string starting with '# '.
 * @invariants buildJSON always returns valid JSON with exportedAt, work, evaluation keys.
 */

import type { WCIResult } from '@/store/ceremony.types';

/**
 * Build a Markdown representation of a WCIResult.
 *
 * @param result - The WCI evaluation result from the store.
 * @param workText - The raw work text the user submitted.
 * @returns A complete Markdown document string.
 */
export function buildMarkdown(result: WCIResult, workText: string): string {
  const date = result.evaluationDate
    ? new Date(result.evaluationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const work = workText.trim();

  const lines: string[] = [
    '# Woodchipper Evaluation',
    '',
    `**Date:** ${date}`,
    `**Score:** ${result.compositeScore} / 100 — ${result.band}`,
    `**Epistemic label:** ${result.epistemicLabel}`,
    '',
    '## Work',
    '',
    work || '_No work text provided._',
    '',
    '## Dimension Scores',
    '',
    '| Dimension | Score | Weighted |',
    '|-----------|-------|----------|',
    ...result.dimensionScores.map(
      d => `| ${d.dimension} | ${d.rawScore.toFixed(1)} | ${d.weightedScore.toFixed(1)} |`
    ),
    '',
    '## Dimension Justifications',
    '',
    ...result.dimensionScores.flatMap(d => [
      `### ${d.dimension}`,
      '',
      d.justification,
      ...(d.keyPassage ? [``, `> ${d.keyPassage}`] : []),
      '',
    ]),
    '---',
    `_Evaluated by Woodchipper · ${result.rubricVersion}_`,
  ];

  return lines.join('\n');
}

/**
 * Build a JSON representation of a WCIResult.
 *
 * @param result - The WCI evaluation result from the store.
 * @param workText - The raw work text the user submitted.
 * @returns A pretty-printed JSON string.
 */
export function buildJSON(result: WCIResult, workText: string): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      work: workText.trim() || null,
      evaluation: result,
    },
    null,
    2
  );
}
