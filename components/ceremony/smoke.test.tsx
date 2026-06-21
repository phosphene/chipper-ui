import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock the ceremony store — smoke test only proves RTL setup works.
vi.mock('@/store/ceremony', () => ({
  useCeremonyStore: () => ({}),
}));

describe('RTL smoke test (T-364)', () => {
  it('renders a simple div via RTL', () => {
    const { container } = render(<div data-testid="smoke">hello</div>);
    expect(container).not.toBeNull();
    expect(container.querySelector('[data-testid="smoke"]')).not.toBeNull();
  });
});
