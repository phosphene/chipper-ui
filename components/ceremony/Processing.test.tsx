import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Processing } from './Processing';

// Mock the processing animation hook to avoid timers
vi.mock('@/hooks/useProcessingAnimation', () => ({
  useProcessingAnimation: () => ({
    dots: {
      N: 'pending', E: 'pending', P: 'pending',
      C: 'pending', S: 'pending', Sc: 'pending',
      L: 'pending', M: 'pending', D: 'pending',
    },
    revealReady: false,
    start: vi.fn(),
  }),
}));

describe('Processing', () => {
  it('renders correctly', () => {
    const { container } = render(<Processing onReveal={vi.fn()} />);
    expect(container).toMatchSnapshot();
  });

  it('shows nine dimension dots', () => {
    const { getByTestId } = render(<Processing onReveal={vi.fn()} />);
    expect(getByTestId('processing')).toBeDefined();
  });
});
