import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IntentSelection } from './IntentSelection';

describe('IntentSelection', () => {
  it('renders the layer-2-intent container', () => {
    const { getByTestId } = render(
      <IntentSelection onProceed={vi.fn()} />
    );
    expect(getByTestId('layer-2-intent')).toBeDefined();
  });

  it('renders all four intent cards', () => {
    const { getByTestId } = render(
      <IntentSelection onProceed={vi.fn()} />
    );
    expect(getByTestId('intent-assess')).toBeDefined();
    expect(getByTestId('intent-develop')).toBeDefined();
    expect(getByTestId('intent-publish')).toBeDefined();
    expect(getByTestId('intent-register')).toBeDefined();
  });

  it('renders header text', () => {
    const { getByText } = render(
      <IntentSelection onProceed={vi.fn()} />
    );
    expect(getByText('What would you like to do with this work?')).toBeDefined();
    expect(getByText('You can select more than one.')).toBeDefined();
  });

  it('renders intent labels and descriptions', () => {
    const { getByText } = render(
      <IntentSelection onProceed={vi.fn()} />
    );
    expect(getByText('Assess')).toBeDefined();
    expect(getByText(/evaluation of your work/)).toBeDefined();
    expect(getByText('Develop')).toBeDefined();
    expect(getByText(/guided iteration/)).toBeDefined();
    expect(getByText('Publish')).toBeDefined();
    expect(getByText(/registry, journal, or Observatory/)).toBeDefined();
    expect(getByText('Register & Index')).toBeDefined();
    expect(getByText(/permanent identifier/)).toBeDefined();
  });

  it('proceed button is disabled when no intent selected', () => {
    const { getByTestId } = render(
      <IntentSelection onProceed={vi.fn()} />
    );
    const btn = getByTestId('intent-proceed') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('proceed button activates when one intent selected', () => {
    const { getByTestId } = render(
      <IntentSelection onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('intent-assess'));
    expect((getByTestId('intent-proceed') as HTMLButtonElement).disabled).toBe(false);
  });

  it('multi-select: can select multiple intents', () => {
    const { getByTestId } = render(
      <IntentSelection onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('intent-assess'));
    fireEvent.click(getByTestId('intent-publish'));

    // Both should have selected styling
    expect(getByTestId('intent-assess').className).toContain('bg-gray-900');
    expect(getByTestId('intent-publish').className).toContain('bg-gray-900');
    // Others should not
    expect(getByTestId('intent-develop').className).not.toContain('border-gray-900');
  });

  it('toggle: clicking a selected intent deselects it', () => {
    const { getByTestId } = render(
      <IntentSelection onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('intent-develop'));
    expect(getByTestId('intent-develop').className).toContain('bg-gray-900');

    fireEvent.click(getByTestId('intent-develop'));
    expect(getByTestId('intent-develop').className).not.toContain('border-gray-900');
  });

  it('proceed becomes disabled again when all intents are deselected', () => {
    const { getByTestId } = render(
      <IntentSelection onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('intent-register'));
    expect((getByTestId('intent-proceed') as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(getByTestId('intent-register'));
    expect((getByTestId('intent-proceed') as HTMLButtonElement).disabled).toBe(true);
  });

  it('calls onProceed with selected intents in canonical order', () => {
    const onProceed = vi.fn();
    const { getByTestId } = render(
      <IntentSelection onProceed={onProceed} />
    );
    // Select in reverse order
    fireEvent.click(getByTestId('intent-register'));
    fireEvent.click(getByTestId('intent-assess'));

    fireEvent.click(getByTestId('intent-proceed'));

    expect(onProceed).toHaveBeenCalledOnce();
    // Should be in canonical order: assess before register
    expect(onProceed.mock.calls[0][0]).toEqual(['assess', 'register']);
  });

  it('calls onProceed with all four intents when all selected', () => {
    const onProceed = vi.fn();
    const { getByTestId } = render(
      <IntentSelection onProceed={onProceed} />
    );
    fireEvent.click(getByTestId('intent-assess'));
    fireEvent.click(getByTestId('intent-develop'));
    fireEvent.click(getByTestId('intent-publish'));
    fireEvent.click(getByTestId('intent-register'));

    fireEvent.click(getByTestId('intent-proceed'));

    expect(onProceed).toHaveBeenCalledOnce();
    expect(onProceed.mock.calls[0][0]).toEqual(['assess', 'develop', 'publish', 'register']);
  });

  it('does not call onProceed when button is disabled', () => {
    const onProceed = vi.fn();
    const { getByTestId } = render(
      <IntentSelection onProceed={onProceed} />
    );
    fireEvent.click(getByTestId('intent-proceed'));
    expect(onProceed).not.toHaveBeenCalled();
  });

  it('does not mention WCI anywhere', () => {
    const { container } = render(
      <IntentSelection onProceed={vi.fn()} />
    );
    const text = container.textContent ?? '';
    expect(text).not.toContain('WCI');
    expect(text).not.toContain('Credibility Index');
    expect(text).not.toContain('credibility index');
  });

  it('selected card has filled background and dark border', () => {
    const { getByTestId } = render(
      <IntentSelection onProceed={vi.fn()} />
    );
    fireEvent.click(getByTestId('intent-assess'));
    const card = getByTestId('intent-assess');
    expect(card.className).toContain('border-gray-900');
    expect(card.className).toContain('bg-gray-900');
    expect(card.className).toContain('text-white');
  });

  it('unselected card has light background and outlined border', () => {
    const { getByTestId } = render(
      <IntentSelection onProceed={vi.fn()} />
    );
    const card = getByTestId('intent-develop');
    expect(card.className).toContain('border-gray-200');
    expect(card.className).toContain('bg-white');
  });
});
