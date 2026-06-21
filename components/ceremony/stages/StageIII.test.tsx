import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StageIII } from './StageIII';

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
    backStage: vi.fn(),
  }),
}));

// Mock StageNav
vi.mock('../StageNav', () => ({
  StageNav: ({ testidPrefix }: { testidPrefix?: string }) => (
    <div data-testid={testidPrefix ? `${testidPrefix}-nav` : 'stage-nav'}>StageNav</div>
  ),
}));

describe('StageIII', () => {
  it('renders correctly', () => {
    const { container } = render(<StageIII />);
    expect(container).toMatchSnapshot();
  });

  it('shows the context block when declaration exists', () => {
    const { getByTestId } = render(<StageIII />);
    expect(getByTestId('stage-III')).toBeDefined();
  });
});
