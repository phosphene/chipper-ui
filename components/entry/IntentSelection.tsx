'use client';
/**
 * IntentSelection — Layer 2: Intent selection.
 *
 * Appears after Stage 2 (maker declaration + work classification) is complete.
 * The maker selects one or more intents — what they want to do with their work.
 *
 * Four intent option cards (multi-select, click to toggle):
 *   1. Assess — "Get an evaluation of your work's credibility and contribution"
 *   2. Develop — "Improve your work through guided iteration and feedback"
 *   3. Publish — "Submit to a registry, journal, or Observatory"
 *   4. Register & Index — "Assign a permanent identifier and index your work"
 *
 * IMPORTANT: No WCI mentioned anywhere on this screen. WCI only appears in
 * Layer 3 under the Assess route.
 *
 * Proceed button activates when ≥1 intent is selected.
 *
 * T-393
 */

import { useState, useCallback } from 'react';

// ── Intent definitions ───────────────────────────────────────

export type IntentValue = 'assess' | 'develop' | 'publish' | 'register';

interface IntentOption {
  value: IntentValue;
  label: string;
  description: string;
  icon: string;
  testId: string;
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    value: 'assess',
    label: 'Assess',
    description: 'Get an evaluation of your work\u2019s credibility and contribution',
    icon: '\u2696',
    testId: 'intent-assess',
  },
  {
    value: 'develop',
    label: 'Develop',
    description: 'Improve your work through guided iteration and feedback',
    icon: '\u2699',
    testId: 'intent-develop',
  },
  {
    value: 'publish',
    label: 'Publish',
    description: 'Submit to a registry, journal, or Observatory',
    icon: '\uD83D\uDCE4',
    testId: 'intent-publish',
  },
  {
    value: 'register',
    label: 'Register & Index',
    description: 'Assign a permanent identifier and index your work',
    icon: '\uD83D\uDDD7',
    testId: 'intent-register',
  },
];

// ── Props ────────────────────────────────────────────────────

export interface IntentSelectionProps {
  /** Callback when Proceed is clicked with selected intents */
  onProceed: (intents: IntentValue[]) => void;
}

// ── Component ────────────────────────────────────────────────

export function IntentSelection({ onProceed }: IntentSelectionProps) {
  const [selected, setSelected] = useState<Set<IntentValue>>(new Set());

  const toggleIntent = useCallback((intent: IntentValue) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(intent)) {
        next.delete(intent);
      } else {
        next.add(intent);
      }
      return next;
    });
  }, []);

  const canProceed = selected.size > 0;

  const handleProceed = useCallback(() => {
    if (!canProceed) return;
    // Preserve canonical order
    const ordered = INTENT_OPTIONS
      .filter(opt => selected.has(opt.value))
      .map(opt => opt.value);
    onProceed(ordered);
  }, [canProceed, selected, onProceed]);

  return (
    <div data-testid="layer-2-intent" className="space-y-6">
      {/* ── Header ── */}
      <div className="space-y-1">
        <h2 className="text-xl font-light text-black leading-tight">
          What would you like to do with this work?
        </h2>
        <p className="text-sm text-gray-500">
          You can select more than one.
        </p>
      </div>

      {/* ── Intent cards ── */}
      <div className="grid gap-3">
        {INTENT_OPTIONS.map(({ value, label, description, icon, testId }) => {
          const isSelected = selected.has(value);
          return (
            <button
              key={value}
              data-testid={testId}
              onClick={() => toggleIntent(value)}
              className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all
                ${isSelected
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true">{icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {label}
                  </p>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                    {description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Proceed button ── */}
      <button
        data-testid="intent-proceed"
        onClick={handleProceed}
        disabled={!canProceed}
        className={`w-full py-4 rounded-xl text-sm font-medium transition-all
          ${canProceed
            ? 'bg-gray-900 text-white hover:bg-gray-700 cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
      >
        Proceed \u2192
      </button>
    </div>
  );
}
