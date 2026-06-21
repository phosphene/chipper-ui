import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StageII } from './StageII';

// Mock the ceremony store
vi.mock('@/store/ceremony', () => ({
  useCeremonyStore: () => ({
    workClassification: null,
    updateMakerDeclaration: vi.fn(),
    updateWorkClassification: vi.fn(),
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

// Mock fetch for domain taxonomy
global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve([]),
});

describe('StageII', () => {
  it('renders correctly', () => {
    const { container } = render(<StageII />);
    expect(container).toMatchSnapshot();
  });

  it('shows the domain text input', () => {
    const { getByTestId } = render(<StageII />);
    expect(getByTestId('entry-tradition')).toBeDefined();
  });
});
