'use client';
/**
 * ReviewScreen — Layer 5: Final review before execution.
 *
 * Plain language. No jargon. No WCI mention unless user selected
 * the credibility evaluation route.
 *
 * System states what it will do — one paragraph per selected route,
 * plain language. Then: what this evaluation does NOT cover.
 *
 * T-395
 */

import { useCallback } from 'react';
import type { RouteValue } from '@/components/entry/RouteSelection';

// ── Route descriptions (plain language) ──────────────────────

const ROUTE_DESCRIPTIONS: Record<RouteValue, string> = {
  'quick-review':
    'We\u2019ll provide a plain-language summary of your work\u2019s strengths and areas for development.',
  wci:
    'We\u2019ll provide a structured evaluation of your work across nine dimensions of intellectual contribution.',
  'full-eval':
    'We\u2019ll evaluate your work across nine dimensions and provide specific recommendations for improvement.',
  impact:
    'We\u2019ll assess who this work would reach and what it could change in its field.',
  'title-framing':
    'We\u2019ll help improve your title, abstract, and opening frame to better represent your work.',
  improvement:
    'We\u2019ll run iterative rounds of evaluation, recommendation, revision, and re-evaluation.',
  registry:
    'We\u2019ll assign a permanent Woodchipper URI to your work \u2014 citable immediately.',
  journal:
    'We\u2019ll prepare your work for journal submission with pre-filled metadata for editorial systems.',
  observatory:
    'We\u2019ll submit your work to the Observatory.wiki editorial queue for expert review.',
  export:
    'We\u2019ll generate publication-ready exports in PDF, structured markdown, or citation-ready formats.',
  uri:
    'We\u2019ll assign a permanent, citable identifier to your work.',
  orcid:
    'We\u2019ll push a work record to your ORCID profile via OAuth.',
  doi:
    'We\u2019ll mint a citable DOI for your work through Zenodo or DataCite.',
  arxiv:
    'We\u2019ll deposit your work on arXiv in the appropriate domain category.',
  sherpa:
    'We\u2019ll check what self-archiving is permitted under your publication terms.',
};

// ── Scope limitations ────────────────────────────────────────

const SCOPE_LIMITATIONS: string[] = [
  'This is not peer review. It does not certify publication readiness.',
  'Scores reflect the instrument\u2019s criteria \u2014 they are not the field\u2019s verdict.',
  'Automated evaluation cannot replace human expert judgment in all cases.',
];

// ── Props ────────────────────────────────────────────────────

export interface ReviewScreenProps {
  selectedRoutes: RouteValue[];
  onBegin: () => void;
}

// ── Component ────────────────────────────────────────────────

export function ReviewScreen({ selectedRoutes, onBegin }: ReviewScreenProps) {
  const handleBegin = useCallback(() => {
    onBegin();
  }, [onBegin]);

  return (
    <div data-testid="layer-5-review" className="space-y-6">
      {/* ── Header ── */}
      <div className="space-y-1">
        <h2 className="text-xl font-light text-black leading-tight">
          Ready to begin
        </h2>
      </div>

      {/* ── What we will do ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-widest">
          What happens next
        </h3>
        <div className="space-y-2">
          {selectedRoutes.map(route => (
            <p
              key={route}
              data-testid={`review-route-${route}`}
              className="text-sm text-gray-700 leading-relaxed"
            >
              {ROUTE_DESCRIPTIONS[route]}
            </p>
          ))}
        </div>
      </div>

      {/* ── What this does NOT cover ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-widest">
          What this does not cover
        </h3>
        <div className="space-y-2">
          {SCOPE_LIMITATIONS.map((limitation, idx) => (
            <p
              key={idx}
              data-testid={`review-limitation-${idx}`}
              className="text-sm text-gray-500 leading-relaxed"
            >
              {limitation}
            </p>
          ))}
        </div>
      </div>

      {/* ── Begin button ── */}
      <button
        data-testid="layer-5-begin"
        onClick={handleBegin}
        className="w-full py-4 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 cursor-pointer transition-all"
      >
        Begin
      </button>
    </div>
  );
}
