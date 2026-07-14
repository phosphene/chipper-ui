import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pronouncement } from './Pronouncement';

// Mock the ceremony store with a Woodchipper reading (no WCI)
vi.mock('@/store/ceremony', () => ({
  useCeremonyStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      woodchipperReading: {
        workStage: 'draft',
        categorization: 'original argument',
        strengths: ['Academic structure detected', 'Substantial content provided'],
        developmentAreas: ['Categorization uncertain — adding domain context would help'],
        claimsGap: 'Claims detected but supporting evidence not yet visible',
        titleAlignment: null,
        bearings: ['This work sits within behavioral ecology'],
        futureDirections: [],
        unintendedDiscoveries: [],
        basis: 'medium confidence — moderate submission',
        relativeContext: 'Within behavioral ecology',
      },
      workClassification: { workType: { value: 'original-argument', source: 'user' } },
      judgeIdentity: { domain: { value: 'behavioral-ecology', source: 'detected' } },
    };
    return selector(state);
  },
}));

describe('Pronouncement', () => {
  it('renders correctly with Woodchipper reading', () => {
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

  it('shows Woodchipper reading header, not WCI', () => {
    const { container } = render(
      <Pronouncement
        onProceedToRecording={vi.fn()}
        onRequestImprovement={vi.fn()}
        onExport={vi.fn()}
      />
    );
    expect(container.textContent).toContain('Woodchipper');
    expect(container.textContent).toContain('reading');
    expect(container.textContent).not.toContain('WCI');
    expect(container.textContent).not.toContain('score');
  });

  it('shows claims-content gap when present', () => {
    const { container } = render(
      <Pronouncement
        onProceedToRecording={vi.fn()}
        onRequestImprovement={vi.fn()}
        onExport={vi.fn()}
      />
    );
    expect(container.textContent).toContain('Claims');
    expect(container.textContent).toContain('evidence not yet visible');
  });
});
