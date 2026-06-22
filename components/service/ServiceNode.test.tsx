import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ServiceNode } from './ServiceNode';
import type { ServiceNodeState } from './service-board.schema';

/**
 * ServiceNode — RTL snapshot tests.
 *
 * Covers all 5 node lifecycle states: pending, active, complete, stub, failed.
 * Each test renders the component, asserts data attributes, and captures a snapshot.
 *
 * @ticket T-382
 */

describe('ServiceNode', () => {
  const serviceType = 'spellcheck' as const;

  it('renders pending state', () => {
    const nodeState: ServiceNodeState = { status: 'pending' };
    const { container } = render(
      <ServiceNode serviceType={serviceType} nodeState={nodeState} />,
    );
    const node = container.querySelector('[data-testid="service-node-spellcheck"]');
    expect(node).not.toBeNull();
    expect(node?.getAttribute('data-state')).toBe('pending');
    expect(container).toMatchSnapshot();
  });

  it('renders active state', () => {
    const nodeState: ServiceNodeState = {
      status: 'active',
      statusText: 'Running spellcheck…',
    };
    const { container } = render(
      <ServiceNode serviceType={serviceType} nodeState={nodeState} />,
    );
    const node = container.querySelector('[data-testid="service-node-spellcheck"]');
    expect(node).not.toBeNull();
    expect(node?.getAttribute('data-state')).toBe('active');
    expect(container).toMatchSnapshot();
  });

  it('renders complete state', () => {
    const nodeState: ServiceNodeState = {
      status: 'complete',
      result: {
        serviceType: 'spellcheck',
        output: 'Fixed 3 spelling errors in the abstract.',
        outputType: 'corrected-paper',
        changesCount: 3,
      },
    };
    const { container } = render(
      <ServiceNode serviceType={serviceType} nodeState={nodeState} />,
    );
    const node = container.querySelector('[data-testid="service-node-spellcheck"]');
    expect(node).not.toBeNull();
    expect(node?.getAttribute('data-state')).toBe('complete');
    expect(container).toMatchSnapshot();
  });

  it('renders stub state', () => {
    const nodeState: ServiceNodeState = {
      status: 'stub',
      note: 'Stub: would submit to Spellcheck service',
    };
    const { container } = render(
      <ServiceNode serviceType={serviceType} nodeState={nodeState} />,
    );
    const node = container.querySelector('[data-testid="service-node-spellcheck"]');
    expect(node).not.toBeNull();
    expect(node?.getAttribute('data-state')).toBe('stub');
    expect(container).toMatchSnapshot();
  });

  it('renders failed state', () => {
    const nodeState: ServiceNodeState = {
      status: 'failed',
      error: 'Service timeout after 30s',
    };
    const { container } = render(
      <ServiceNode serviceType={serviceType} nodeState={nodeState} />,
    );
    const node = container.querySelector('[data-testid="service-node-spellcheck"]');
    expect(node).not.toBeNull();
    expect(node?.getAttribute('data-state')).toBe('failed');
    expect(container).toMatchSnapshot();
  });

  it('renders different service types correctly', () => {
    const nodeState: ServiceNodeState = { status: 'pending' };
    const { container } = render(
      <ServiceNode serviceType="edit-abstract" nodeState={nodeState} />,
    );
    const node = container.querySelector('[data-testid="service-node-edit-abstract"]');
    expect(node).not.toBeNull();
    expect(node?.getAttribute('data-state')).toBe('pending');
  });
});
