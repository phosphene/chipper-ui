import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Opening } from './Opening';

describe('Opening', () => {
  it('renders correctly', () => {
    const { container } = render(<Opening onBegin={vi.fn()} />);
    expect(container).toMatchSnapshot();
  });

  it('has the begin button', () => {
    const { getByTestId } = render(<Opening onBegin={vi.fn()} />);
    expect(getByTestId('opening-begin')).toBeDefined();
  });
});
