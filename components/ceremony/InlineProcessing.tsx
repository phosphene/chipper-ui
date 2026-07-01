'use client';
/**
 * InlineProcessing — inline evaluation animation.
 *
 * Renders inside the output feed on the neutral-beige background.
 * No dark takeover. No full-screen. Nine dimension dots completing
 * in sequence, then auto-fires API call and completes.
 *
 * Design:
 * - Sits in the content flow under the input
 * - Uses the page background (no bg override)
 * - Dots animate left-to-right, visible to user
 * - On completion, calls onComplete after score is set
 */

import { useEffect, useCallback } from 'react';
import { useProcessingAnimation, type DotState } from '@/hooks/useProcessingAnimation';
import { useCeremonyStore } from '@/store/ceremony';

const DIMS = ['N', 'E', 'P', 'C', 'S', 'Sc', 'L', 'M', 'D'];

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
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://wci-api.fly.dev';

    const DEMO_RESULT = {
      compositeScore: 0,
      band: 'promising' as const,
      dimensionScores: [],
      epistemicLabel: '',
      relativeContext: '',
      rubricVersion: '1.0',
      evaluationDate: new Date().toISOString(),
      provenance: 'warm' as const,
    };

    try {
      const res = await fetch(`${apiBase}/api/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: state.makerDeclaration?.freeText ?? '',
          work_type: state.workClassification?.workType.value ?? 'original-argument',
          standing: state.makerDeclaration?.standing.value ?? 'independent-researcher',
          domain: state.judgeIdentity?.domain.value ?? 'general',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        store.setWCIResult({
          compositeScore: data.composite_score,
          band: data.band,
          dimensionScores: (data.dimension_scores ?? []).map((d: any) => ({
            dimension: d.dimension,
            rawScore: d.raw_score,
            weight: d.weight,
            weightedScore: d.weighted_score,
            justification: d.justification,
            keyPassage: d.key_passage ?? null,
          })),
          epistemicLabel: data.epistemic_label ?? '',
          relativeContext: data.relative_context ?? '',
          rubricVersion: data.rubric_version ?? '1.0',
          evaluationDate: new Date().toISOString(),
          provenance: data.provenance ?? 'cold',
        });
      } else {
        store.setWCIResult(DEMO_RESULT);
      }
    } catch {
      store.setWCIResult(DEMO_RESULT);
    }

    onComplete();
  }, [store, onComplete]);

  // Auto-fire when animation completes
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
        Evaluation in progress
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
        Case is under assessment.
      </p>
      <p className="text-xs italic text-black/20 mb-6">
        Nine dimensions are being examined.
      </p>

      {/* Nine dimension dots */}
      <div className="flex justify-center gap-4 mb-6">
        {DIMS.map((dim) => (
          <InlineDot key={dim} dim={dim} state={dots[dim] ?? 'pending'} />
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
