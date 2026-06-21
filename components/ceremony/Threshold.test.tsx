import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Threshold } from './Threshold';

describe('Threshold', () => {
  it('renders correctly', () => {
    const { container } = render(<Threshold onProceed={vi.fn()} />);
    expect(container).toMatchSnapshot();
  });

  it('has the proceed button', () => {
    const { getByTestId } = render(<Threshold onProceed={vi.fn()} />);
    expect(getByTestId('threshold-proceed')).toBeDefined();
  });
});
