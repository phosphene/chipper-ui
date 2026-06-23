import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RouteSelection } from './RouteSelection';
import type { IntentValue } from './IntentSelection';

describe('RouteSelection', () => {
  const allIntents: IntentValue[] = ['assess', 'develop', 'publish', 'register'];

  it('renders the layer-3-routes container', () => {
    const { getByTestId } = render(
      <RouteSelection selectedIntents={allIntents} onProceed={vi.fn()} />
    );
    expect(getByTestId('layer-3-routes')).toBeDefined();
  });

  it('renders header and subheader', () => {
    const { getByText } = render(
      <RouteSelection selectedIntents={allIntents} onProceed={vi.fn()} />
    );
    expect(getByText(/Select what you.d like to do/)).toBeDefined();
    expect(getByText('Based on what you told us, these are available.')).toBeDefined();
  });

  // ── Track visibility ─────────────────────────────────────

  it('shows Assess routes when assess intent selected', () => {
    const { getByTestId } = render(
      <RouteSelection selectedIntents={['assess']} onProceed={vi.fn()} />
    );
    expect(getByTestId('route-quick-review')).toBeDefined();
    expect(getByTestId('route-wci')).toBeDefined();
    expect(getByTestId('route-full-eval')).toBeDefined();
    expect(getByTestId('route-impact')).toBeDefined();
  });

  it('shows Develop routes when develop intent selected', () => {
    const { getByTestId } = render(
      <RouteSelection selectedIntents={['develop']} onProceed={vi.fn()} />
    );
    expect(getByTestId('route-title-framing')).toBeDefined();
    expect(getByTestId('route-improvement')).toBeDefined();
  });

  it('shows Publish routes when publish intent selected', () => {
    const { getByTestId } = render(
      <RouteSelection selectedIntents={['publish']} onProceed={vi.fn()} />
    );
    expect(getByTestId('route-registry')).toBeDefined();
    expect(getByTestId('route-journal')).toBeDefined();
    expect(getByTestId('route-observatory')).toBeDefined();
    expect(getByTestId('route-export')).toBeDefined();
  });

  it('shows Register routes when register intent selected', () => {
    const { getByTestId } = render(
      <RouteSelection selectedIntents={['register']} onProceed={vi.fn()} />
    );
    expect(getByTestId('route-uri')).toBeDefined();
    expect(getByTestId('route-orcid')).toBeDefined();
    expect(getByTestId('route-doi')).toBeDefined();
    expect(getByTestId('route-arxiv')).toBeDefined();
    expect(getByTestId('route-sherpa')).toBeDefined();
  });

  it('hides Assess routes when assess intent not selected', () => {
    const { queryByTestId } = render(
      <RouteSelection selectedIntents={['develop']} onProceed={vi.fn()} />
    );
    expect(queryByTestId('route-quick-review')).toBeNull();
    expect(queryByTestId('route-wci')).toBeNull();
    expect(queryByTestId('route-full-eval')).toBeNull();
    expect(queryByTestId('route-impact')).toBeNull();
  });

  it('hides Develop routes when develop intent not selected', () => {
    const { queryByTestId } = render(
      <RouteSelection selectedIntents={['assess']} onProceed={vi.fn()} />
    );
    expect(queryByTestId('route-title-framing')).toBeNull();
    expect(queryByTestId('route-improvement')).toBeNull();
  });

  it('hides Publish routes when publish intent not selected', () => {
    const { queryByTestId } = render(
      <RouteSelection selectedIntents={['assess']} onProceed={vi.fn()} />
    );
    expect(queryByTestId('route-registry')).toBeNull();
    expect(queryByTestId('route-journal')).toBeNull();
    expect(queryByTestId('route-observatory')).toBeNull();
    expect(queryByTestId('route-export')).toBeNull();
  });

  it('hides Register routes when register intent not selected', () => {
    const { queryByTestId } = render(
      <RouteSelection selectedIntents={['assess']} onProceed={vi.fn()} />
    );
    expect(queryByTestId('route-uri')).toBeNull();
    expect(queryByTestId('route-orcid')).toBeNull();
    expect(queryByTestId('route-doi')).toBeNull();
    expect(queryByTestId('route-arxiv')).toBeNull();
    expect(queryByTestId('route-sherpa')).toBeNull();
  });

  it('shows multiple tracks when multiple intents selected', () => {
    const { getByTestId, queryByTestId } = render(
      <RouteSelection selectedIntents={['assess', 'publish']} onProceed={vi.fn()} />
    );
    // Assess visible
    expect(getByTestId('route-wci')).toBeDefined();
    // Publish visible
    expect(getByTestId('route-registry')).toBeDefined();
    // Develop hidden
    expect(queryByTestId('route-title-framing')).toBeNull();
    // Register hidden
    expect(queryByTestId('route-uri')).toBeNull();
  });

  // ── Track section headers ────────────────────────────────

  it('renders track section headers', () => {
    const { getByText } = render(
      <RouteSelection selectedIntents={allIntents} onProceed={vi.fn()} />
    );
    expect(getByText('Assess')).toBeDefined();
    expect(getByText('Develop')).toBeDefined();
    expect(getByText('Publish')).toBeDefined();
    expect(getByText('Register & Index')).toBeDefined();
  });

  // ── Route labels and descriptions ────────────────────────

  it('renders route labels and descriptions', () => {
    const { getByText } = render(
      <RouteSelection selectedIntents={allIntents} onProceed={vi.fn()} />
    );
    expect(getByText('Quick summary review')).toBeDefined();
    expect(getByText(/Plain-language account/)).toBeDefined();
    expect(getByText('Credibility evaluation')).toBeDefined();
    expect(getByText(/nine dimensions of intellectual contribution/)).toBeDefined();
    expect(getByText('Impact assessment')).toBeDefined();
    expect(getByText('Title and framing')).toBeDefined();
    expect(getByText('Improvement rounds')).toBeDefined();
    expect(getByText('Woodchipper registry')).toBeDefined();
    expect(getByText('Journal submission export')).toBeDefined();
    expect(getByText('Submit to Observatory.wiki')).toBeDefined();
    expect(getByText('Print / export')).toBeDefined();
    expect(getByText('Woodchipper URI')).toBeDefined();
    expect(getByText('ORCID work record')).toBeDefined();
    expect(getByText('DOI via Zenodo')).toBeDefined();
    expect(getByText('arXiv deposit')).toBeDefined();
    expect(getByText('SHERPA/RoMEO check')).toBeDefined();
  });

  // ── Selection ────────────────────────────────────────────

  it('proceed button is disabled when no route selected', () => {
    const { getByTestId } = render(
      <RouteSelection selectedIntents={allIntents} onProceed={vi.fn()} />
    );
    const btn = getByTestId('layer-3-proceed') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('proceed button activates when one route selected', () => {
    const { getByTestId } = render(
      <RouteSelection selectedIntents={['assess']} onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('route-wci'));
    expect((getByTestId('layer-3-proceed') as HTMLButtonElement).disabled).toBe(false);
  });

  it('multi-select: can select routes from different tracks', () => {
    const { getByTestId } = render(
      <RouteSelection selectedIntents={['assess', 'publish']} onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('route-wci'));
    fireEvent.click(getByTestId('route-observatory'));

    expect(getByTestId('route-wci').className).toContain('bg-gray-900');
    expect(getByTestId('route-observatory').className).toContain('bg-gray-900');
    expect(getByTestId('route-quick-review').className).not.toContain('border-gray-900');
  });

  it('toggle: clicking a selected route deselects it', () => {
    const { getByTestId } = render(
      <RouteSelection selectedIntents={['assess']} onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('route-impact'));
    expect(getByTestId('route-impact').className).toContain('bg-gray-900');

    fireEvent.click(getByTestId('route-impact'));
    expect(getByTestId('route-impact').className).not.toContain('border-gray-900');
  });

  it('proceed becomes disabled again when all routes deselected', () => {
    const { getByTestId } = render(
      <RouteSelection selectedIntents={['develop']} onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('route-improvement'));
    expect((getByTestId('layer-3-proceed') as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(getByTestId('route-improvement'));
    expect((getByTestId('layer-3-proceed') as HTMLButtonElement).disabled).toBe(true);
  });

  it('calls onProceed with selected routes in canonical order', () => {
    const onProceed = vi.fn();
    const { getByTestId } = render(
      <RouteSelection selectedIntents={allIntents} onProceed={onProceed} />
    );
    // Select in reverse order across tracks
    fireEvent.click(getByTestId('route-sherpa'));
    fireEvent.click(getByTestId('route-quick-review'));

    fireEvent.click(getByTestId('layer-3-proceed'));

    expect(onProceed).toHaveBeenCalledOnce();
    // quick-review (assess) should come before sherpa (register) in canonical order
    expect(onProceed.mock.calls[0][0]).toEqual(['quick-review', 'sherpa']);
  });

  it('calls onProceed with routes from multiple tracks', () => {
    const onProceed = vi.fn();
    const { getByTestId } = render(
      <RouteSelection selectedIntents={['assess', 'develop', 'register']} onProceed={onProceed} />
    );
    fireEvent.click(getByTestId('route-doi'));
    fireEvent.click(getByTestId('route-wci'));
    fireEvent.click(getByTestId('route-improvement'));

    fireEvent.click(getByTestId('layer-3-proceed'));

    expect(onProceed).toHaveBeenCalledOnce();
    expect(onProceed.mock.calls[0][0]).toEqual(['wci', 'improvement', 'doi']);
  });

  it('does not call onProceed when button is disabled', () => {
    const onProceed = vi.fn();
    const { getByTestId } = render(
      <RouteSelection selectedIntents={allIntents} onProceed={onProceed} />
    );
    fireEvent.click(getByTestId('layer-3-proceed'));
    expect(onProceed).not.toHaveBeenCalled();
  });

  // ── WCI naming rule ──────────────────────────────────────

  it('does not use WCI acronym in user-facing labels', () => {
    const { container } = render(
      <RouteSelection selectedIntents={['assess']} onProceed={vi.fn()} />
    );
    const text = container.textContent ?? '';
    expect(text).not.toContain('WCI');
  });

  it('describes credibility evaluation in plain language', () => {
    const { getByText } = render(
      <RouteSelection selectedIntents={['assess']} onProceed={vi.fn()} />
    );
    expect(getByText('Credibility evaluation')).toBeDefined();
    expect(getByText(/nine dimensions of intellectual contribution/)).toBeDefined();
  });

  // ── Card styling ─────────────────────────────────────────

  it('selected card has filled background', () => {
    const { getByTestId } = render(
      <RouteSelection selectedIntents={['assess']} onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('route-wci'));
    const card = getByTestId('route-wci');
    expect(card.className).toContain('border-gray-900');
    expect(card.className).toContain('bg-gray-900');
    expect(card.className).toContain('text-white');
  });

  it('unselected card has light background', () => {
    const { getByTestId } = render(
      <RouteSelection selectedIntents={['assess']} onProceed={vi.fn()} />
    );
    const card = getByTestId('route-quick-review');
    expect(card.className).toContain('border-gray-200');
    expect(card.className).toContain('bg-white');
  });

  // ── Empty intents edge case ──────────────────────────────

  it('shows no tracks when no intents provided', () => {
    const { queryByTestId, getByTestId } = render(
      <RouteSelection selectedIntents={[]} onProceed={vi.fn()} />
    );
    // Container still renders
    expect(getByTestId('layer-3-routes')).toBeDefined();
    // But no routes
    expect(queryByTestId('route-quick-review')).toBeNull();
    expect(queryByTestId('route-title-framing')).toBeNull();
    expect(queryByTestId('route-registry')).toBeNull();
    expect(queryByTestId('route-uri')).toBeNull();
  });
});
