/**
 * DomainPicker — Unit tests.
 * T-390
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DomainPicker, DOMAIN_TAXONOMY } from './DomainPicker';
import type { SelectedDomain } from './DomainPicker';

// ── Helpers ──────────────────────────────────────────────────

function renderPicker(
  selected: SelectedDomain[] = [],
  onChange?: (d: SelectedDomain[]) => void
) {
  const onChangeFn = onChange ?? vi.fn();
  return {
    onChange: onChangeFn,
    ...render(<DomainPicker selected={selected} onChange={onChangeFn} />),
  };
}

// ── Tests ────────────────────────────────────────────────────

describe('DomainPicker', () => {
  it('renders with correct test id', () => {
    renderPicker();
    expect(screen.getByTestId('domain-picker')).toBeInTheDocument();
    expect(screen.getByTestId('domain-search-input')).toBeInTheDocument();
  });

  it('has at least 25 domain entries in seed taxonomy', () => {
    expect(DOMAIN_TAXONOMY.length).toBeGreaterThanOrEqual(25);
  });

  it('all entries have required fields', () => {
    for (const entry of DOMAIN_TAXONOMY) {
      expect(entry.id).toBeTruthy();
      expect(entry.label).toBeTruthy();
      expect(entry.synonyms.length).toBeGreaterThan(0);
      expect(entry.domainPath).toBeTruthy();
      expect(entry.codes).toBeTruthy();
      expect(entry.subtopics.length).toBeGreaterThanOrEqual(1);
      expect(entry.subtopics[0]).toBe('General');
    }
  });

  it('shows dropdown options on focus', async () => {
    const user = userEvent.setup();
    renderPicker();
    const input = screen.getByTestId('domain-search-input');
    await user.click(input);
    // Should show at least some entries
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
  });

  it('filters entries by label text', async () => {
    const user = userEvent.setup();
    renderPicker();
    const input = screen.getByTestId('domain-search-input');
    await user.type(input, 'paleoanth');
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(1);
    expect(options[0]).toHaveTextContent('Paleoanthropology');
  });

  it('filters entries by synonym', async () => {
    const user = userEvent.setup();
    renderPicker();
    const input = screen.getByTestId('domain-search-input');
    await user.type(input, 'NLP');
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(1);
    expect(options[0]).toHaveTextContent('Linguistics');
  });

  it('filters entries by domain path', async () => {
    const user = userEvent.setup();
    renderPicker();
    const input = screen.getByTestId('domain-search-input');
    await user.type(input, 'Humanities > Philosophy');
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(1);
    expect(options[0]).toHaveTextContent('Philosophy');
  });

  it('calls onChange with selected domain when clicking an option', async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker();
    const input = screen.getByTestId('domain-search-input');
    await user.type(input, 'Ecology');
    const options = screen.getAllByRole('option');
    await user.click(options[0]);
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        entry: expect.objectContaining({ id: 'nat.bio.ecology', label: 'Ecology' }),
        subtopic: 'General',
      }),
    ]);
  });

  it('renders chips for selected domains with codes', () => {
    const entry = DOMAIN_TAXONOMY.find(e => e.id === 'nat.bio.evol.paleoanthro')!;
    renderPicker([{ entry, subtopic: 'General' }]);
    const chip = screen.getByTestId('domain-chip-nat.bio.evol.paleoanthro');
    expect(chip).toHaveTextContent('Paleoanthropology');
    expect(chip).toHaveTextContent('FORD 1.6');
  });

  it('renders remove button on chips', () => {
    const entry = DOMAIN_TAXONOMY.find(e => e.id === 'soc.econ')!;
    renderPicker([{ entry, subtopic: 'General' }]);
    expect(screen.getByTestId('domain-chip-soc.econ-remove')).toBeInTheDocument();
  });

  it('calls onChange without removed domain when clicking ×', async () => {
    const user = userEvent.setup();
    const entry1 = DOMAIN_TAXONOMY.find(e => e.id === 'soc.econ')!;
    const entry2 = DOMAIN_TAXONOMY.find(e => e.id === 'soc.psych')!;
    const selected: SelectedDomain[] = [
      { entry: entry1, subtopic: 'General' },
      { entry: entry2, subtopic: 'General' },
    ];
    const { onChange } = renderPicker(selected);
    await user.click(screen.getByTestId('domain-chip-soc.econ-remove'));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ entry: expect.objectContaining({ id: 'soc.psych' }) }),
    ]);
  });

  it('renders subtopic dropdown for each selected domain', () => {
    const entry = DOMAIN_TAXONOMY.find(e => e.id === 'nat.bio.neuro')!;
    renderPicker([{ entry, subtopic: 'General' }]);
    const select = screen.getByTestId('domain-subtopic-nat.bio.neuro');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('General');
    // Check all subtopics are present as options
    const options = within(select).getAllByRole('option');
    expect(options.length).toBe(entry.subtopics.length);
  });

  it('calls onChange with updated subtopic when changing dropdown', async () => {
    const user = userEvent.setup();
    const entry = DOMAIN_TAXONOMY.find(e => e.id === 'nat.bio.neuro')!;
    const { onChange } = renderPicker([{ entry, subtopic: 'General' }]);
    const select = screen.getByTestId('domain-subtopic-nat.bio.neuro');
    await user.selectOptions(select, 'Cognitive Neuroscience');
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        entry: expect.objectContaining({ id: 'nat.bio.neuro' }),
        subtopic: 'Cognitive Neuroscience',
      }),
    ]);
  });

  it('does not show already-selected domains in dropdown', async () => {
    const user = userEvent.setup();
    const entry = DOMAIN_TAXONOMY.find(e => e.id === 'nat.bio.ecology')!;
    renderPicker([{ entry, subtopic: 'General' }]);
    const input = screen.getByTestId('domain-search-input');
    await user.type(input, 'Ecology');
    // Only Marine Ecology from the domainPath should NOT match ecology entry since it's selected
    const options = screen.queryAllByRole('option');
    const ecologyOptions = options.filter(o => o.textContent?.includes('Ecology') && !o.textContent?.includes('Paleoecology'));
    // The selected "Ecology" itself should not appear
    expect(ecologyOptions.every(o => !o.textContent?.startsWith('Ecology'))).toBe(true);
  });

  it('shows "No matching domains found" for empty search results', async () => {
    const user = userEvent.setup();
    renderPicker();
    const input = screen.getByTestId('domain-search-input');
    await user.type(input, 'xyznonexistent');
    expect(screen.getByText('No matching domains found')).toBeInTheDocument();
  });

  it('closes dropdown on Escape', async () => {
    const user = userEvent.setup();
    renderPicker();
    const input = screen.getByTestId('domain-search-input');
    await user.click(input);
    expect(screen.queryAllByRole('option').length).toBeGreaterThan(0);
    await user.keyboard('{Escape}');
    expect(screen.queryAllByRole('option').length).toBe(0);
  });
});
