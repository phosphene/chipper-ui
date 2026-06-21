import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pronouncement } from './Pronouncement';

// Mock the ceremony store with a WCI result for rich rendering
vi.mock('@/store/ceremony', () => ({
  useCeremonyStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      wciResult: {
        compositeScore: 62,
        band: 'promising',
        dimensionScores: [
          { dimension: 'N', rawScore: 4.0, weight: 1.0, weightedScore: 4.0, justification: 'Structurally expected.', keyPassage: null },
          { dimension: 'E', rawScore: 8.0, weight: 1.5, weightedScore: 12.0, justification: 'Three independent sites.', keyPassage: null },
          { dimension: 'M', rawScore: 8.5, weight: 1.5, weightedScore: 12.75, justification: 'Excellent calibration.', keyPassage: null },
        ],
        epistemicLabel: 'corpus-level — test',
        relativeContext: 'Null-result papers typically score 55–68.',
        rubricVersion: '1.0',
        evaluationDate: '2026-01-01T00:00:00Z',
        provenance: 'warm',
      },
      workClassification: { workType: { value: 'null-result', source: 'user' } },
      judgeIdentity: { domain: { value: 'Behavioral Ecology', source: 'detected' } },
    };
    return selector(state);
  },
}));

describe('Pronouncement', () => {
  it('renders correctly with WCI result', () => {
    const { container } = render(
      <Pronouncement
        onProceedToRecording={vi.fn()}
        onRequestImprovement={vi.fn()}
        onExport={vi.fn()}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('has the proceed button', () => {
    const { getByTestId } = render(
      <Pronouncement
        onProceedToRecording={vi.fn()}
        onRequestImprovement={vi.fn()}
        onExport={vi.fn()}
      />
    );
    expect(getByTestId('pronouncement-proceed')).toBeDefined();
  });
});
