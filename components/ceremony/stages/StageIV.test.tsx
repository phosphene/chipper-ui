import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StageIV } from './StageIV';

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
    advanceStage: vi.fn(),
  }),
}));

describe('StageIV', () => {
  it('renders correctly', () => {
    const { container } = render(<StageIV onDecline={vi.fn()} />);
    expect(container).toMatchSnapshot();
  });

  it('shows enter and decline buttons', () => {
    const { getByTestId } = render(<StageIV onDecline={vi.fn()} />);
    expect(getByTestId('stage-IV-enter')).toBeDefined();
    expect(getByTestId('stage-IV-decline')).toBeDefined();
  });
});
