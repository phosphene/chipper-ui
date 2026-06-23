import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmationScreen } from './ConfirmationScreen';
import type { ConfirmationData } from './ConfirmationScreen';

const baseData: ConfirmationData = {
  description: 'A study of primate social hierarchies in captive environments',
  uploadFilename: 'primate-study.pdf',
  role: 'scholar',
  creatorType: 'sole',
  workType: 'original-argument',
  domains: ['Behavioral Biology', 'Primatology'],
  intents: ['assess', 'register'],
  routes: ['wci', 'uri'],
};

describe('ConfirmationScreen', () => {
  // ── Container and header ─────────────────────────────────

  it('renders the layer-4-confirmation container', () => {
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(getByTestId('layer-4-confirmation')).toBeDefined();
  });

  it('renders the header and subheader', () => {
    const { getByText } = render(
      <ConfirmationScreen data={baseData} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(getByText('Before we begin')).toBeDefined();
    expect(getByText(/Check that we.ve understood your work correctly/)).toBeDefined();
  });

  // ── Data display ─────────────────────────────────────────

  it('displays work description', () => {
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(getByTestId('confirm-description').textContent).toContain(
      'A study of primate social hierarchies'
    );
  });

  it('truncates description over 100 characters', () => {
    const longDesc = 'A'.repeat(150);
    const data = { ...baseData, description: longDesc };
    const { getByTestId } = render(
      <ConfirmationScreen data={data} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    const text = getByTestId('confirm-description').textContent!;
    expect(text).toContain('...');
    expect(text.length).toBeLessThan(110);
  });

  it('displays upload filename', () => {
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(getByTestId('confirm-upload').textContent).toBe('primate-study.pdf');
  });

  it('shows "None" when no upload', () => {
    const data = { ...baseData, uploadFilename: null };
    const { getByTestId } = render(
      <ConfirmationScreen data={data} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(getByTestId('confirm-upload').textContent).toBe('None');
  });

  it('displays role label', () => {
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(getByTestId('confirm-role').textContent).toBe('Scholar');
  });

  it('displays creator type label', () => {
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(getByTestId('confirm-creator').textContent).toBe('Sole creator');
  });

  it('displays work type label', () => {
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(getByTestId('confirm-work-type').textContent).toBe('Original Argument');
  });

  it('displays domains as comma-separated list', () => {
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(getByTestId('confirm-domain').textContent).toBe('Behavioral Biology, Primatology');
  });

  it('shows "None selected" when no domains', () => {
    const data = { ...baseData, domains: [] };
    const { getByTestId } = render(
      <ConfirmationScreen data={data} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(getByTestId('confirm-domain').textContent).toBe('None selected');
  });

  it('displays intents', () => {
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(getByTestId('confirm-intents').textContent).toBe('Assess, Register & Index');
  });

  it('displays routes', () => {
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(getByTestId('confirm-routes').textContent).toBe('Credibility evaluation, Woodchipper URI');
  });

  // ── Change links ─────────────────────────────────────────

  it('fires onChangeField("description") when Change clicked', () => {
    const onChangeField = vi.fn();
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={onChangeField} onConfirm={vi.fn()} />
    );
    fireEvent.click(getByTestId('confirm-description-change'));
    expect(onChangeField).toHaveBeenCalledWith('description');
  });

  it('fires onChangeField("role") when Change clicked', () => {
    const onChangeField = vi.fn();
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={onChangeField} onConfirm={vi.fn()} />
    );
    fireEvent.click(getByTestId('confirm-role-change'));
    expect(onChangeField).toHaveBeenCalledWith('role');
  });

  it('fires onChangeField("creatorType") when Change clicked', () => {
    const onChangeField = vi.fn();
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={onChangeField} onConfirm={vi.fn()} />
    );
    fireEvent.click(getByTestId('confirm-creator-change'));
    expect(onChangeField).toHaveBeenCalledWith('creatorType');
  });

  it('fires onChangeField("workType") when Change clicked', () => {
    const onChangeField = vi.fn();
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={onChangeField} onConfirm={vi.fn()} />
    );
    fireEvent.click(getByTestId('confirm-work-type-change'));
    expect(onChangeField).toHaveBeenCalledWith('workType');
  });

  it('fires onChangeField("domains") when Change clicked', () => {
    const onChangeField = vi.fn();
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={onChangeField} onConfirm={vi.fn()} />
    );
    fireEvent.click(getByTestId('confirm-domain-change'));
    expect(onChangeField).toHaveBeenCalledWith('domains');
  });

  // ── Confirm button ───────────────────────────────────────

  it('renders confirm button with correct label', () => {
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    const btn = getByTestId('layer-4-confirm-btn');
    expect(btn.textContent).toContain('This is correct');
  });

  it('fires onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    const { getByTestId } = render(
      <ConfirmationScreen data={baseData} onChangeField={vi.fn()} onConfirm={onConfirm} />
    );
    fireEvent.click(getByTestId('layer-4-confirm-btn'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <ConfirmationScreen data={baseData} onChangeField={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container).toMatchSnapshot();
  });
});
