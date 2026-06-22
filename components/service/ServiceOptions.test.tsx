import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ServiceOptions } from './ServiceOptions';
import type { ServiceType } from './service-board.schema';

/**
 * ServiceOptions — RTL snapshot tests.
 *
 * Covers: no selection (button disabled), one selected (button enabled),
 * zenodo hidden for independent-researcher, zenodo visible for other standings.
 *
 * @ticket T-382
 */

const defaultProps = {
  workType: 'journal-article',
  standing: 'postdoctoral',
  selected: [] as ServiceType[],
  onToggle: vi.fn(),
  onPaperChange: vi.fn(),
  paperText: '',
  onRequest: vi.fn(),
};

describe('ServiceOptions', () => {
  it('renders with no selection — request button disabled', () => {
    const { container, getByTestId } = render(
      <ServiceOptions {...defaultProps} selected={[]} />,
    );
    const btn = getByTestId('service-request-btn');
    expect(btn).toBeDisabled();
    expect(getByTestId('service-option-zenodo-record')).not.toBeNull();
    expect(container).toMatchSnapshot();
  });

  it('renders with one service selected — request button enabled', () => {
    const { container, getByTestId } = render(
      <ServiceOptions {...defaultProps} selected={['spellcheck']} />,
    );
    const btn = getByTestId('service-request-btn');
    expect(btn).not.toBeDisabled();
    expect(container).toMatchSnapshot();
  });

  it('hides zenodo-record for independent-researcher standing', () => {
    const { container, queryByTestId } = render(
      <ServiceOptions
        {...defaultProps}
        standing="independent-researcher"
        selected={[]}
      />,
    );
    expect(queryByTestId('service-option-zenodo-record')).toBeNull();
    // Other services still visible
    expect(queryByTestId('service-option-spellcheck')).not.toBeNull();
    expect(queryByTestId('service-option-edit-abstract')).not.toBeNull();
    expect(container).toMatchSnapshot();
  });

  it('shows zenodo-record for institutional standing', () => {
    const { container, getByTestId } = render(
      <ServiceOptions
        {...defaultProps}
        standing="faculty"
        selected={[]}
      />,
    );
    expect(getByTestId('service-option-zenodo-record')).not.toBeNull();
    expect(container).toMatchSnapshot();
  });

  it('renders with multiple services selected', () => {
    const { container, getByTestId } = render(
      <ServiceOptions
        {...defaultProps}
        selected={['spellcheck', 'edit-abstract', 'check-citations']}
      />,
    );
    const btn = getByTestId('service-request-btn');
    expect(btn).not.toBeDisabled();
    expect(container).toMatchSnapshot();
  });
});
