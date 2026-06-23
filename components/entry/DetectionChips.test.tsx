import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DetectionChips } from './DetectionChips';
import type { DetectionResult } from '@/store/ceremony.types';
import type { DetectionChipsResult } from './DetectionChips';

const mockResult: DetectionResult = {
  workType: 'original-argument',
  domain: 'evolutionary-biology',
  standing: 'professor',
  confidence: 'high',
  academicMarkersDetected: [],
};

function noop(_result: DetectionChipsResult): void { /* no-op */ }

describe('DetectionChips', () => {
  it('renders loading state', () => {
    const { container, getByTestId } = render(
      <DetectionChips
        result={null as unknown as DetectionResult}
        isLoading={true}
        error={null}
        onComplete={noop}
      />
    );
    expect(getByTestId('detection-chips-container')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('renders error state', () => {
    const { container, getByTestId } = render(
      <DetectionChips
        result={null as unknown as DetectionResult}
        isLoading={false}
        error="Detection failed"
        onComplete={noop}
      />
    );
    expect(getByTestId('detection-chips-container')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('renders all three detection chips', () => {
    const { container, getByTestId } = render(
      <DetectionChips
        result={mockResult}
        isLoading={false}
        error={null}
        onComplete={noop}
      />
    );
    expect(getByTestId('detection-chips-container')).toBeDefined();
    expect(getByTestId('detection-chip-work-type')).toBeDefined();
    expect(getByTestId('detection-chip-domain')).toBeDefined();
    expect(getByTestId('detection-chip-standing')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('confirms a chip on click', () => {
    const { getByTestId } = render(
      <DetectionChips
        result={mockResult}
        isLoading={false}
        error={null}
        onComplete={noop}
      />
    );
    const workTypeChip = getByTestId('detection-chip-work-type');
    expect(workTypeChip.getAttribute('data-state')).toBe('pending');

    fireEvent.click(workTypeChip);
    expect(workTypeChip.getAttribute('data-state')).toBe('confirmed');
  });

  it('fires onComplete when all chips confirmed', () => {
    let captured: DetectionChipsResult | null = null;
    const onComplete = (r: DetectionChipsResult) => { captured = r; };
    const { getByTestId } = render(
      <DetectionChips
        result={mockResult}
        isLoading={false}
        error={null}
        onComplete={onComplete}
      />
    );

    fireEvent.click(getByTestId('detection-chip-work-type'));
    fireEvent.click(getByTestId('detection-chip-domain'));
    fireEvent.click(getByTestId('detection-chip-standing'));

    expect(captured).toEqual({
      workType: 'original-argument',
      domain: 'evolutionary-biology',
      standing: 'professor',
    });
  });

  it('enters edit mode on edit button click', () => {
    const { getByTestId } = render(
      <DetectionChips
        result={mockResult}
        isLoading={false}
        error={null}
        onComplete={noop}
      />
    );
    const editBtn = getByTestId('detection-chip-work-type-edit');
    fireEvent.click(editBtn);
    expect(getByTestId('detection-chip-work-type-input')).toBeDefined();
  });
});
