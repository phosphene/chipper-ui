'use client';
/**
 * RouteSelection — Layer 3: Route selection.
 *
 * Appears after Layer 2 (intent selection) is complete.
 * Shows routes relevant to the intent(s) selected in Layer 2.
 * Only tracks whose parent intent was selected are displayed.
 *
 * Multi-select: each route is a selectable card with description.
 * Proceed button activates when ≥1 route is selected.
 *
 * IMPORTANT: The "Credibility evaluation" route is described in plain
 * language — no "WCI" acronym in the user-facing label. This is where
 * WCI first appears, described as "A structured evaluation across nine
 * dimensions of intellectual contribution."
 *
 * @remarks
 * WCI containment: the "Credibility evaluation" route is described in plain
 * language here — no "WCI" acronym in the user-facing label. This is the
 * architecturally correct first appearance of the evaluation instrument:
 * the maker has declared intent (Assess) and explicitly navigated to this
 * screen. WCI arriving earlier — in Layers 1-5 — would violate the two-entity
 * architecture in woodchipper-and-wci-portal.md: Woodchipper routes to WCI;
 * WCI does not contaminate Woodchipper's entry layer.
 *
 * The route value `'wci'` is an internal identifier only. The rendered label
 * and description are what the maker sees.
 *
 * T-394
 */

import { useState, useCallback } from 'react';
import type { IntentValue } from '@/components/entry/IntentSelection';

// ── Route definitions ────────────────────────────────────────

export type RouteValue =
  // Assess
  | 'quick-review'
  | 'wci'
  | 'full-eval'
  | 'impact'
  // Develop
  | 'title-framing'
  | 'improvement'
  // Publish
  | 'registry'
  | 'journal'
  | 'observatory'
  | 'export'
  // Register
  | 'uri'
  | 'orcid'
  | 'doi'
  | 'arxiv'
  | 'sherpa';

interface RouteOption {
  value: RouteValue;
  label: string;
  description: string;
  testId: string;
}

interface TrackDefinition {
  intent: IntentValue;
  label: string;
  routes: RouteOption[];
}

const TRACKS: TrackDefinition[] = [
  {
    intent: 'assess',
    label: 'Assess',
    routes: [
      {
        value: 'quick-review',
        label: 'Quick summary review',
        description: 'Plain-language account, no score',
        testId: 'route-quick-review',
      },
      {
        value: 'wci',
        label: 'Credibility evaluation',
        description: 'A structured evaluation across nine dimensions of intellectual contribution',
        testId: 'route-wci',
      },
      {
        value: 'full-eval',
        label: 'Full evaluation + recommendations',
        description: 'Evaluation plus improvement set',
        testId: 'route-full-eval',
      },
      {
        value: 'impact',
        label: 'Impact assessment',
        description: 'Who this work would reach',
        testId: 'route-impact',
      },
    ],
  },
  {
    intent: 'develop',
    label: 'Develop',
    routes: [
      {
        value: 'title-framing',
        label: 'Title and framing',
        description: 'Improve title, abstract, and opening frame',
        testId: 'route-title-framing',
      },
      {
        value: 'improvement',
        label: 'Improvement rounds',
        description: 'Evaluate, recommend, revise, re-evaluate',
        testId: 'route-improvement',
      },
    ],
  },
  {
    intent: 'publish',
    label: 'Publish',
    routes: [
      {
        value: 'registry',
        label: 'Woodchipper registry',
        description: 'Permanent URI assigned to your work',
        testId: 'route-registry',
      },
      {
        value: 'journal',
        label: 'Journal submission export',
        description: 'Pre-filled for EditFlow, ScholarOne, or direct journal API',
        testId: 'route-journal',
      },
      {
        value: 'observatory',
        label: 'Submit to Observatory.wiki',
        description: 'Editorial review for public-facing article',
        testId: 'route-observatory',
      },
      {
        value: 'export',
        label: 'Print / export',
        description: 'PDF, structured markdown, citation-ready export',
        testId: 'route-export',
      },
    ],
  },
  {
    intent: 'register',
    label: 'Register & Index',
    routes: [
      {
        value: 'uri',
        label: 'Woodchipper URI',
        description: 'Permanent, citable identifier assigned immediately',
        testId: 'route-uri',
      },
      {
        value: 'orcid',
        label: 'ORCID work record',
        description: 'Push to your ORCID profile',
        testId: 'route-orcid',
      },
      {
        value: 'doi',
        label: 'DOI via Zenodo',
        description: 'Mint a citable DOI for preprints and reports',
        testId: 'route-doi',
      },
      {
        value: 'arxiv',
        label: 'arXiv deposit',
        description: 'Domain-filtered; available when work type is compatible',
        testId: 'route-arxiv',
      },
      {
        value: 'sherpa',
        label: 'SHERPA/RoMEO check',
        description: 'What self-archiving is permitted under your publication terms',
        testId: 'route-sherpa',
      },
    ],
  },
];

// ── Props ────────────────────────────────────────────────────

export interface RouteSelectionProps {
  /** Intents selected in Layer 2 — determines which tracks are shown */
  selectedIntents: IntentValue[];
  /** Callback when Proceed is clicked with selected routes */
  onProceed: (routes: RouteValue[]) => void;
}

// ── Component ────────────────────────────────────────────────

export function RouteSelection({ selectedIntents, onProceed }: RouteSelectionProps) {
  const [selected, setSelected] = useState<Set<RouteValue>>(new Set());

  const toggleRoute = useCallback((route: RouteValue) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(route)) {
        next.delete(route);
      } else {
        next.add(route);
      }
      return next;
    });
  }, []);

  const canProceed = selected.size > 0;

  const handleProceed = useCallback(() => {
    if (!canProceed) return;
    // Preserve canonical order from TRACKS
    const allRouteValues = TRACKS.flatMap(t => t.routes.map(r => r.value));
    const ordered = allRouteValues.filter(v => selected.has(v));
    onProceed(ordered);
  }, [canProceed, selected, onProceed]);

  // Filter to only show tracks whose intent was selected
  const visibleTracks = TRACKS.filter(t => selectedIntents.includes(t.intent));

  return (
    <div data-testid="layer-3-routes" className="space-y-6">
      {/* ── Header ── */}
      <div className="space-y-1">
        <h2 className="text-xl font-light text-black leading-tight">
          Select what you&rsquo;d like to do
        </h2>
        <p className="text-sm text-gray-500">
          Based on what you told us, these are available.
        </p>
      </div>

      {/* ── Track sections ── */}
      {visibleTracks.map(track => (
        <div key={track.intent} className="space-y-3">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-widest">
            {track.label}
          </h3>
          <div className="grid gap-2">
            {track.routes.map(({ value, label, description, testId }) => {
              const isSelected = selected.has(value);
              return (
                <button
                  key={value}
                  data-testid={testId}
                  onClick={() => toggleRoute(value)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all
                    ${isSelected
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'}`}
                >
                  <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {label}
                  </p>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                    {description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Proceed button ── */}
      <button
        data-testid="layer-3-proceed"
        onClick={handleProceed}
        disabled={!canProceed}
        className={`w-full py-4 rounded-xl text-sm font-medium transition-all
          ${canProceed
            ? 'bg-gray-900 text-white hover:bg-gray-700 cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
      >
        Proceed &rarr;
      </button>
    </div>
  );
}
