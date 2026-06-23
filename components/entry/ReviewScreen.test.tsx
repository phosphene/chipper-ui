import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReviewScreen } from './ReviewScreen';
import type { RouteValue } from './RouteSelection';

describe('ReviewScreen', () => {
  const routes: RouteValue[] = ['wci', 'uri'];

  // ── Container and header ─────────────────────────────────

  it('renders the layer-5-review container', () => {
    const { getByTestId } = render(
      <ReviewScreen selectedRoutes={routes} onBegin={vi.fn()} />
    );
    expect(getByTestId('layer-5-review')).toBeDefined();
  });

  it('renders "Ready to begin" header', () => {
    const { getByText } = render(
      <ReviewScreen selectedRoutes={routes} onBegin={vi.fn()} />
    );
    expect(getByText('Ready to begin')).toBeDefined();
  });

  // ── Route descriptions ───────────────────────────────────

  it('shows description for wci route', () => {
    const { getByTestId } = render(
      <ReviewScreen selectedRoutes={['wci']} onBegin={vi.fn()} />
    );
    expect(getByTestId('review-route-wci').textContent).toContain(
      'structured evaluation'
    );
    expect(getByTestId('review-route-wci').textContent).toContain(
      'nine dimensions'
    );
  });

  it('shows description for uri route', () => {
    const { getByTestId } = render(
      <ReviewScreen selectedRoutes={['uri']} onBegin={vi.fn()} />
    );
    expect(getByTestId('review-route-uri').textContent).toContain(
      'permanent, citable identifier'
    );
  });

  it('shows description for quick-review route', () => {
    const { getByTestId } = render(
      <ReviewScreen selectedRoutes={['quick-review']} onBegin={vi.fn()} />
    );
    expect(getByTestId('review-route-quick-review').textContent).toContain(
      'plain-language summary'
    );
  });

  it('renders one paragraph per selected route', () => {
    const manyRoutes: RouteValue[] = ['wci', 'uri', 'impact', 'export'];
    const { getByTestId } = render(
      <ReviewScreen selectedRoutes={manyRoutes} onBegin={vi.fn()} />
    );
    for (const route of manyRoutes) {
      expect(getByTestId(`review-route-${route}`)).toBeDefined();
    }
  });

  it('only shows descriptions for selected routes', () => {
    const { queryByTestId } = render(
      <ReviewScreen selectedRoutes={['wci']} onBegin={vi.fn()} />
    );
    expect(queryByTestId('review-route-wci')).toBeDefined();
    expect(queryByTestId('review-route-uri')).toBeNull();
    expect(queryByTestId('review-route-impact')).toBeNull();
  });

  // ── Scope limitations ────────────────────────────────────

  it('shows scope limitations', () => {
    const { getByTestId } = render(
      <ReviewScreen selectedRoutes={routes} onBegin={vi.fn()} />
    );
    expect(getByTestId('review-limitation-0').textContent).toContain('not peer review');
    expect(getByTestId('review-limitation-1').textContent).toContain('instrument');
    expect(getByTestId('review-limitation-2').textContent).toContain('human expert judgment');
  });

  it('shows "What this does not cover" heading', () => {
    const { getByText } = render(
      <ReviewScreen selectedRoutes={routes} onBegin={vi.fn()} />
    );
    expect(getByText('What this does not cover')).toBeDefined();
  });

  // ── Begin button ─────────────────────────────────────────

  it('renders begin button with correct label', () => {
    const { getByTestId } = render(
      <ReviewScreen selectedRoutes={routes} onBegin={vi.fn()} />
    );
    expect(getByTestId('layer-5-begin').textContent).toBe('Begin');
  });

  it('fires onBegin when begin button clicked', () => {
    const onBegin = vi.fn();
    const { getByTestId } = render(
      <ReviewScreen selectedRoutes={routes} onBegin={onBegin} />
    );
    fireEvent.click(getByTestId('layer-5-begin'));
    expect(onBegin).toHaveBeenCalledOnce();
  });

  // ── All routes have descriptions ─────────────────────────

  it('every route value has a plain-language description', () => {
    const allRoutes: RouteValue[] = [
      'quick-review', 'wci', 'full-eval', 'impact',
      'title-framing', 'improvement',
      'registry', 'journal', 'observatory', 'export',
      'uri', 'orcid', 'doi', 'arxiv', 'sherpa',
    ];
    const { getByTestId } = render(
      <ReviewScreen selectedRoutes={allRoutes} onBegin={vi.fn()} />
    );
    for (const route of allRoutes) {
      const el = getByTestId(`review-route-${route}`);
      expect(el.textContent!.length).toBeGreaterThan(10);
    }
  });
});
