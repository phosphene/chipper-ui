import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Recording } from './Recording';

// Mock the ceremony store with recording state
vi.mock('@/store/ceremony', () => ({
  useCeremonyStore: () => ({
    recordingChoice: null as string | null,
    selectedProperties: new Set<string>(),
    setRecordingChoice: vi.fn(),
    toggleProperty: vi.fn(),
  }),
}));

describe('Recording', () => {
  it('renders correctly', () => {
    const { container } = render(<Recording onDone={vi.fn()} />);
    expect(container).toMatchSnapshot();
  });

  it('shows the three recording choices', () => {
    const { getByTestId } = render(<Recording onDone={vi.fn()} />);
    expect(getByTestId('recording-choice-view-only')).toBeDefined();
    expect(getByTestId('recording-choice-private')).toBeDefined();
    expect(getByTestId('recording-choice-public')).toBeDefined();
  });

  it('has the confirm button', () => {
    const { getByTestId } = render(<Recording onDone={vi.fn()} />);
    expect(getByTestId('recording-confirm')).toBeDefined();
  });
});
