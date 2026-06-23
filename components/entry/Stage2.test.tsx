import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Stage2 } from './Stage2';
import type { Stage2Data } from './Stage2';
import type { SelectedDomain } from './DomainPicker';

const mockDomains: SelectedDomain[] = [
  {
    entry: {
      id: 'nat.bio.evol',
      label: 'Evolutionary Biology',
      parent: 'nat.bio',
      synonyms: [],
      domainPath: 'Natural Sciences > Biology > Evolutionary Biology',
      codes: 'FORD 1.6',
      subtopics: ['General', 'Phylogenetics'],
    },
    subtopic: 'Phylogenetics',
  },
];

describe('Stage2', () => {
  it('renders both sections', () => {
    const { getByText } = render(
      <Stage2 selectedDomains={[]} onProceed={vi.fn()} />
    );
    expect(getByText('About you')).toBeDefined();
    expect(getByText('About your work')).toBeDefined();
  });

  it('renders all maker role pills', () => {
    const { getByTestId } = render(
      <Stage2 selectedDomains={[]} onProceed={vi.fn()} />
    );
    expect(getByTestId('maker-role-student')).toBeDefined();
    expect(getByTestId('maker-role-scholar')).toBeDefined();
    expect(getByTestId('maker-role-practitioner')).toBeDefined();
  });

  it('renders all creator type pills', () => {
    const { getByTestId } = render(
      <Stage2 selectedDomains={[]} onProceed={vi.fn()} />
    );
    expect(getByTestId('maker-creator-sole')).toBeDefined();
    expect(getByTestId('maker-creator-co-creator')).toBeDefined();
    expect(getByTestId('maker-creator-llm')).toBeDefined();
    expect(getByTestId('maker-creator-llm-assisted')).toBeDefined();
  });

  it('renders all work type pills', () => {
    const { getByTestId } = render(
      <Stage2 selectedDomains={[]} onProceed={vi.fn()} />
    );
    expect(getByTestId('work-type-original-argument')).toBeDefined();
    expect(getByTestId('work-type-null-result')).toBeDefined();
    expect(getByTestId('work-type-replication')).toBeDefined();
    expect(getByTestId('work-type-synthesis-review')).toBeDefined();
    expect(getByTestId('work-type-methodological')).toBeDefined();
    expect(getByTestId('work-type-evidentiary')).toBeDefined();
    expect(getByTestId('work-type-none')).toBeDefined();
  });

  it('proceed button is disabled when nothing selected', () => {
    const { getByTestId } = render(
      <Stage2 selectedDomains={[]} onProceed={vi.fn()} />
    );
    const btn = getByTestId('stage2-proceed');
    expect(btn).toBeDefined();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('proceed button is disabled with only role selected (no work type)', () => {
    const { getByTestId } = render(
      <Stage2 selectedDomains={[]} onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('maker-role-scholar'));
    expect((getByTestId('stage2-proceed') as HTMLButtonElement).disabled).toBe(true);
  });

  it('proceed button is disabled with only work type selected (no role)', () => {
    const { getByTestId } = render(
      <Stage2 selectedDomains={[]} onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('work-type-replication'));
    expect((getByTestId('stage2-proceed') as HTMLButtonElement).disabled).toBe(true);
  });

  it('proceed button activates when role AND work type selected', () => {
    const onProceed = vi.fn();
    const { getByTestId } = render(
      <Stage2 selectedDomains={[]} onProceed={onProceed} />
    );
    fireEvent.click(getByTestId('maker-role-student'));
    fireEvent.click(getByTestId('work-type-original-argument'));
    expect((getByTestId('stage2-proceed') as HTMLButtonElement).disabled).toBe(false);
  });

  it('calls onProceed with correct data', () => {
    const onProceed = vi.fn();
    const { getByTestId } = render(
      <Stage2 selectedDomains={mockDomains} onProceed={onProceed} />
    );
    fireEvent.click(getByTestId('maker-role-practitioner'));
    fireEvent.click(getByTestId('maker-creator-llm-assisted'));
    fireEvent.click(getByTestId('work-type-null-result'));
    fireEvent.click(getByTestId('stage2-proceed'));

    expect(onProceed).toHaveBeenCalledOnce();
    const data: Stage2Data = onProceed.mock.calls[0][0];
    expect(data.makerRole).toBe('practitioner');
    expect(data.creatorType).toBe('llm-assisted');
    expect(data.workType).toBe('null-result');
    expect(data.domains).toBe(mockDomains);
  });

  it('"None of these" counts as a valid work type for proceed', () => {
    const onProceed = vi.fn();
    const { getByTestId } = render(
      <Stage2 selectedDomains={[]} onProceed={onProceed} />
    );
    fireEvent.click(getByTestId('maker-role-scholar'));
    fireEvent.click(getByTestId('work-type-none'));
    expect((getByTestId('stage2-proceed') as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(getByTestId('stage2-proceed'));
    expect(onProceed).toHaveBeenCalledOnce();
    expect(onProceed.mock.calls[0][0].workType).toBe('none');
  });

  it('displays pre-filled domains from Stage 1', () => {
    const { getByTestId, getByText } = render(
      <Stage2 selectedDomains={mockDomains} onProceed={vi.fn()} />
    );
    expect(getByTestId('stage2-domain-display')).toBeDefined();
    expect(getByText('Evolutionary Biology')).toBeDefined();
  });

  it('does not show domain display when no domains selected', () => {
    const { queryByTestId } = render(
      <Stage2 selectedDomains={[]} onProceed={vi.fn()} />
    );
    expect(queryByTestId('stage2-domain-display')).toBeNull();
  });

  it('single-select: selecting a different role deselects the previous', () => {
    const { getByTestId } = render(
      <Stage2 selectedDomains={[]} onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('maker-role-student'));
    expect(getByTestId('maker-role-student').className).toContain('bg-gray-900');

    fireEvent.click(getByTestId('maker-role-scholar'));
    expect(getByTestId('maker-role-scholar').className).toContain('bg-gray-900');
    expect(getByTestId('maker-role-student').className).not.toContain('bg-gray-900');
  });

  it('single-select: selecting a different work type deselects the previous', () => {
    const { getByTestId } = render(
      <Stage2 selectedDomains={[]} onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('work-type-replication'));
    expect(getByTestId('work-type-replication').className).toContain('bg-gray-900');

    fireEvent.click(getByTestId('work-type-evidentiary'));
    expect(getByTestId('work-type-evidentiary').className).toContain('bg-gray-900');
    expect(getByTestId('work-type-replication').className).not.toContain('bg-gray-900');
  });

  it('defaults creatorType to sole when not explicitly selected', () => {
    const onProceed = vi.fn();
    const { getByTestId } = render(
      <Stage2 selectedDomains={[]} onProceed={onProceed} />
    );
    fireEvent.click(getByTestId('maker-role-student'));
    fireEvent.click(getByTestId('work-type-original-argument'));
    fireEvent.click(getByTestId('stage2-proceed'));
    expect(onProceed.mock.calls[0][0].creatorType).toBe('sole');
  });

  it('matches snapshot', () => {
    const { container } = render(
      <Stage2 selectedDomains={[]} onProceed={vi.fn()} />
    );
    expect(container).toMatchSnapshot();
  });
});
