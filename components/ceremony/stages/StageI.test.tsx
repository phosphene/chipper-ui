import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StageI } from './StageI';

// Mock the ceremony store
vi.mock('@/store/ceremony', () => ({
  useCeremonyStore: () => ({
    advanceStage: vi.fn(),
  }),
}));

// Mock StageNav since it's a child component
vi.mock('../StageNav', () => ({
  StageNav: ({ testidPrefix }: { testidPrefix?: string }) => (
    <div data-testid={testidPrefix ? `${testidPrefix}-nav` : 'stage-nav'}>StageNav</div>
  ),
}));

describe('StageI', () => {
  it('renders correctly', () => {
    const { container } = render(<StageI />);
    expect(container).toMatchSnapshot();
  });

  it('shows creator role buttons', () => {
    const { getByTestId } = render(<StageI />);
    expect(getByTestId('creator-role-sole')).toBeDefined();
    expect(getByTestId('creator-role-llm')).toBeDefined();
  });

  it('shows the hope free text input', () => {
    const { getByTestId } = render(<StageI />);
    expect(getByTestId('hope-freetext')).toBeDefined();
  });
});
