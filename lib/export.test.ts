/**
 * lib/export.test.ts — TDD proof for export logic
 *
 * RED phase: lib/export.ts does not exist.
 * These tests MUST FAIL here. That is the proof they have value.
 * GREEN phase: once lib/export.ts is written, all tests must pass.
 */
import { describe, it, expect } from 'vitest';
import { buildMarkdown, buildJSON } from './export';
import type { WCIResult } from '@/store/ceremony.types';

const MOCK_RESULT: WCIResult = {
  compositeScore: 74,
  band: 'significant',
  epistemicLabel: 'Original experimental work with adequate methodology',
  relativeContext: 'Upper quartile for independent researchers',
  rubricVersion: 'v2.1',
  evaluationDate: '2026-06-21T00:00:00Z',
  provenance: 'cold' as const,
  dimensionScores: [
    { dimension: 'N' as any, rawScore: 8.2, weight: 0.15, weightedScore: 1.23, justification: 'Novel contribution.', keyPassage: null },
    { dimension: 'E', rawScore: 7.5, weight: 0.15, weightedScore: 1.13, justification: 'Strong evidence.', keyPassage: 'n=84, p=0.003' },
  ],
};

const WORK_TEXT = 'Original experimental study on cortisol regulation in adult primates. n=84, p=0.003.';

describe('buildMarkdown — RED: must fail before lib/export.ts exists', () => {
  it('returns a non-empty string', () => {
    const md = buildMarkdown(MOCK_RESULT, WORK_TEXT);
    expect(md.length).toBeGreaterThan(100);
  });

  it('starts with a markdown heading', () => {
    expect(buildMarkdown(MOCK_RESULT, WORK_TEXT).startsWith('# ')).toBe(true);
  });

  it('includes the composite score', () => {
    expect(buildMarkdown(MOCK_RESULT, WORK_TEXT)).toContain('74');
  });

  it('includes the band', () => {
    expect(buildMarkdown(MOCK_RESULT, WORK_TEXT)).toContain('significant');
  });

  it('includes the work text', () => {
    expect(buildMarkdown(MOCK_RESULT, WORK_TEXT)).toContain(WORK_TEXT);
  });

  it('includes all dimension codes in a table', () => {
    const md = buildMarkdown(MOCK_RESULT, WORK_TEXT);
    expect(md).toContain('| N |');
    expect(md).toContain('| E |');
  });

  it('includes dimension justifications', () => {
    const md = buildMarkdown(MOCK_RESULT, WORK_TEXT);
    expect(md).toContain('Novel contribution.');
    expect(md).toContain('Strong evidence.');
  });

  it('includes key passages when present', () => {
    expect(buildMarkdown(MOCK_RESULT, WORK_TEXT)).toContain('n=84, p=0.003');
  });

  it('includes the rubric version', () => {
    expect(buildMarkdown(MOCK_RESULT, WORK_TEXT)).toContain('v2.1');
  });

  it('handles missing work text gracefully', () => {
    const md = buildMarkdown(MOCK_RESULT, '');
    expect(md.length).toBeGreaterThan(50);
  });
});

describe('buildJSON — RED: must fail before lib/export.ts exists', () => {
  it('returns valid JSON', () => {
    expect(() => JSON.parse(buildJSON(MOCK_RESULT, WORK_TEXT))).not.toThrow();
  });

  it('includes exportedAt timestamp', () => {
    const parsed = JSON.parse(buildJSON(MOCK_RESULT, WORK_TEXT));
    expect(typeof parsed.exportedAt).toBe('string');
    expect(parsed.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('includes the work text', () => {
    const parsed = JSON.parse(buildJSON(MOCK_RESULT, WORK_TEXT));
    expect(parsed.work).toBe(WORK_TEXT);
  });

  it('includes the composite score', () => {
    const parsed = JSON.parse(buildJSON(MOCK_RESULT, WORK_TEXT));
    expect(parsed.evaluation.compositeScore).toBe(74);
  });

  it('includes all dimension scores', () => {
    const parsed = JSON.parse(buildJSON(MOCK_RESULT, WORK_TEXT));
    expect(parsed.evaluation.dimensionScores).toHaveLength(2);
  });

  it('sets work to null when empty', () => {
    const parsed = JSON.parse(buildJSON(MOCK_RESULT, ''));
    expect(parsed.work).toBeNull();
  });
});
