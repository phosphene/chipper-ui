'use client';
/**
 * InlineProcessing — inline Woodchipper reading animation.
 *
 * Renders inside the output feed on the neutral-beige background.
 * NO WCI dependency. This component produces a Woodchipper reading
 * that situates the user and gives feedback. WCI scoring is a
 * separate path the user must explicitly select.
 *
 * Design:
 * - Sits in the content flow under the input
 * - Uses the page background (no bg override)
 * - Dots animate left-to-right, visible to user
 * - On completion, calls onComplete after reading is set
 */

import { useEffect, useCallback } from 'react';
import { useProcessingAnimation, type DotState } from '@/hooks/useProcessingAnimation';
import { useCeremonyStore } from '@/store/ceremony';
import type { WoodchipperReading } from '@/store/ceremony.types';

const PHASES = ['Read', 'Map', 'Situate', 'Assess', 'Frame', 'Gaps', 'Scope', 'Dirs', 'Done'];

interface Props {
  onComplete: () => void;
}

export function InlineProcessing({ onComplete }: Props) {
  const { dots, revealReady, start } = useProcessingAnimation();
  const store = useCeremonyStore();

  useEffect(() => {
    start();
  }, [start]);

  const handleReveal = useCallback(async () => {
    const state = useCeremonyStore.getState();
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://wci-api.fly.dev'; // TODO: move detect to woodchipper-native API

    // Build a Woodchipper reading from the detect endpoint (not /api/score)
    const FALLBACK_READING: WoodchipperReading = {
      workStage: 'draft',
      categorization: state.workClassification?.workType?.value?.replace(/-/g, ' ') ?? 'unclassified',
      strengths: ['Work submitted for review'],
      developmentAreas: ['Woodchipper needs more content to provide specific feedback'],
      claimsGap: null,
      titleAlignment: null,
      bearings: [],
      futureDirections: [],
      unintendedDiscoveries: [],
      basis: 'brief submission — limited signal available',
      relativeContext: null,
    };

    try {
      const res = await fetch(`${apiBase}/api/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: state.makerDeclaration?.freeText ?? '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Build Woodchipper reading from detection data
        const reading: WoodchipperReading = {
          workStage: inferWorkStage(state.makerDeclaration?.freeText ?? ''),
          categorization: data.work_type?.replace(/-/g, ' ') ?? 'unclassified',
          strengths: buildStrengths(data, state.makerDeclaration?.freeText ?? ''),
          developmentAreas: buildDevelopmentAreas(data, state.makerDeclaration?.freeText ?? ''),
          claimsGap: assessClaimsGap(state.makerDeclaration?.freeText ?? ''),
          titleAlignment: null,
          bearings: identifyBearings(data),
          futureDirections: identifyFutureDirections(data),
          unintendedDiscoveries: [],
          basis: `${data.confidence ?? 'low'} confidence — ${assessBasis(state.makerDeclaration?.freeText ?? '')}`,
          relativeContext: data.domain ? `Within ${data.domain.replace(/-/g, ' ')}` : null,
        };
        store.setWoodchipperReading(reading);
      } else {
        store.setWoodchipperReading(FALLBACK_READING);
      }
    } catch {
      store.setWoodchipperReading(FALLBACK_READING);
    }

    onComplete();
  }, [store, onComplete]);

  useEffect(() => {
    if (revealReady) {
      handleReveal();
    }
  }, [revealReady, handleReveal]);

  return (
    <div
      data-testid="inline-processing"
      className="max-w-2xl mx-auto py-8 text-center"
    >
      <p className="font-mono text-[0.6rem] tracking-[0.35em] uppercase text-black/25 mb-6">
        Reading your work
      </p>

      {/* Pulsing sigil */}
      <div className="flex justify-center mb-4">
        <div className="
          w-10 h-10 rounded-full border border-black/10
          flex items-center justify-center
          animate-[pulse_2.5s_ease-in-out_infinite]
          motion-reduce:animate-none
        ">
          <div className="w-5 h-5 rounded-full border border-black/10" />
        </div>
      </div>

      <p className="text-sm text-black/40 mb-1">
        Woodchipper is reading your work.
      </p>
      <p className="text-xs italic text-black/20 mb-6">
        Situating, mapping, identifying what could help.
      </p>

      {/* Phase dots */}
      <div className="flex justify-center gap-4 mb-6">
        {PHASES.map((phase) => (
          <InlineDot key={phase} dim={phase} state={dots[phase] ?? 'pending'} />
        ))}
      </div>
    </div>
  );
}

function InlineDot({ dim, state }: { dim: string; state: DotState }) {
  const dotClass = {
    pending: 'bg-black/8',
    active:  'bg-amber-700/60 shadow-[0_0_4px_rgba(146,100,40,0.3)]',
    done:    'bg-amber-800/30',
  }[state];
  const labelClass = {
    pending: 'text-black/15',
    active:  'text-black/50',
    done:    'text-black/25',
  }[state];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-[7px] h-[7px] rounded-full transition-all duration-300 ${dotClass}`} />
      <span className={`font-mono text-[0.48rem] tracking-wide ${labelClass}`}>{dim}</span>
    </div>
  );
}

// ── Reading builders — heuristic, no WCI ────────────────────

function inferWorkStage(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('idea') || lower.includes('concept') || lower.includes('wondering') || lower.includes('thinking about')) return 'ideas';
  if (lower.includes('draft') || lower.includes('working on') || lower.includes('in progress')) return 'draft';
  if (lower.includes('final') || lower.includes('finished') || lower.includes('complete') || lower.includes('ready')) return 'near-final';
  if (lower.includes('published') || lower.includes('accepted') || lower.includes('peer review')) return 'published';
  return 'draft';
}

function buildStrengths(data: any, text: string): string[] {
  const strengths: string[] = [];
  if (data.academic_markers_detected?.length > 2) strengths.push('Academic structure detected — your work follows scholarly conventions');
  if (text.length > 500) strengths.push('Substantial content provided — enough signal for a meaningful reading');
  if (data.confidence === 'high') strengths.push('Clear domain and work type — Woodchipper is confident in its categorization');
  if (strengths.length === 0) strengths.push('Work submitted for review');
  return strengths;
}

function buildDevelopmentAreas(data: any, text: string): string[] {
  const areas: string[] = [];
  if (text.length < 200) areas.push('More content would strengthen the reading — consider adding your full abstract or key sections');
  if (data.confidence === 'low') areas.push('Categorization uncertain — adding domain context or methodology description would help');
  if (!data.academic_markers_detected?.length) areas.push('No formal academic markers detected — if this is scholarly work, consider including methodology, citations, or structured sections');
  return areas;
}

function assessClaimsGap(text: string): string | null {
  const lower = text.toLowerCase();
  const hasClaims = /\b(argue|claim|demonstrate|show|prove|establish|find|discover)\b/.test(lower);
  const hasEvidence = /\b(data|evidence|sample|study|experiment|survey|analysis|result)\b/.test(lower);
  if (hasClaims && !hasEvidence) return 'Claims detected but supporting evidence not yet visible — consider including your methodology or data description';
  if (!hasClaims && hasEvidence) return 'Evidence described but central claims not yet articulated — consider stating what your work argues or demonstrates';
  return null;
}

function assessBasis(text: string): string {
  if (text.length > 2000) return 'substantial submission, detailed reading possible';
  if (text.length > 500) return 'moderate submission';
  if (text.length > 100) return 'brief submission, limited signal';
  return 'very brief submission, minimal signal available';
}

function identifyBearings(data: any): string[] {
  const bearings: string[] = [];
  if (data.domain) bearings.push(`This work sits within ${data.domain.replace(/-/g, ' ')}`);
  return bearings;
}

function identifyFutureDirections(data: any): string[] {
  return [];
}
