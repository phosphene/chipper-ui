import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StageV } from './StageV';

// Mock the ceremony store
vi.mock('@/store/ceremony', () => ({
  useCeremonyStore: () => ({
    makerDeclaration: {
      standing: { value: 'graduate-researcher', source: 'user' },
      tradition: { value: 'Behavioral Ecology', source: 'user' },
    },
    workClassification: {
      workType: { value: 'null-result', source: 'user' },
    },
    frameAgreement: {
      lastWord: '',
    },
    rest: vi.fn(),
    updateLastWord: vi.fn(),
  }),
}));

describe('StageV', () => {
  it('renders correctly', () => {
    const { container } = render(<StageV onRested={vi.fn()} />);
    expect(container).toMatchSnapshot();
  });

  it('shows the last word textarea and rest button', () => {
    const { getByTestId } = render(<StageV onRested={vi.fn()} />);
    expect(getByTestId('stage-V-last-word')).toBeDefined();
    expect(getByTestId('stage-V-rest')).toBeDefined();
  });
});
