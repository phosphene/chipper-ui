/**
 * Processing — T-269
 *
 * Stage VII. Dark full-screen panel. Nine dimension dots completing in sequence.
 * No progress percentage. No estimated time. The scale settles.
 *
 * Design constraints (INTERFACE-ALIGNMENT.md §5):
 * - Do NOT add a progress bar
 * - Do NOT add "This usually takes X seconds"
 * - 1.5s pause after final dot before reveal button appears
 * - prefers-reduced-motion: replace animation with static completed state
 *
 * SoC: animation state in useProcessingAnimation hook.
 * This component renders dot states only.
 */
'use client';

import { useEffect } from 'react';
import { useProcessingAnimation, type DotState } from '@/hooks/useProcessingAnimation';

interface Props {
  onReveal: () => void;  // calls store.revealScore() from parent after setting processingComplete
  autoStart?: boolean;
}

const DIMS = ['N', 'E', 'P', 'C', 'S', 'Sc', 'L', 'M', 'D'];

export function Processing({ onReveal, autoStart = true }: Props) {
  const { dots, revealReady, start } = useProcessingAnimation();

  useEffect(() => {
    if (autoStart) start();
  }, [autoStart, start]);

  return (
    <div className="
      flex flex-col items-center justify-center min-h-screen text-center
      bg-[#060606] px-6
    ">
      <p className="font-mono text-[0.55rem] tracking-[0.35em] uppercase text-white/20 mb-12">
        VII · Evaluation in progress
      </p>

      {/* Pulsing sigil */}
      <div className="
        w-14 h-14 rounded-full border-[1.5px] border-[#4f8ef5]/30
        flex items-center justify-content-center mb-6
        animate-[pulse_2.5s_ease-in-out_infinite]
        motion-reduce:animate-none
      ">
        <div className="w-7 h-7 rounded-full border border-[#4f8ef5]/30 mx-auto" />
      </div>

      <h2 className="text-[1.2rem] font-light text-white/55 mb-2">
        Case is under assessment.
      </h2>
      <p className="text-[0.82rem] italic text-white/25 mb-8">
        Nine dimensions are being examined.
      </p>

      {/* Nine dimension dots */}
      <div className="flex gap-4 mb-8">
        {DIMS.map((dim) => (
          <DotUnit key={dim} dim={dim} state={dots[dim] ?? 'pending'} />
        ))}
      </div>

      {/* Reveal button — fades in 1.5s after final dot */}
      <div className={`transition-opacity duration-500 ${revealReady ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          onClick={onReveal}
          disabled={!revealReady}
          className="
            px-7 py-2.5 rounded-md border border-[#4f8ef5]/35
            text-[#4f8ef5]/75 font-mono text-[0.8rem] tracking-wide
            hover:border-[#4f8ef5] hover:text-[#4f8ef5] hover:bg-[#4f8ef5]/06
            transition-all
          "
        >
          Score Ready — Reveal
        </button>
      </div>
    </div>
  );
}

function DotUnit({ dim, state }: { dim: string; state: DotState }) {
  const dotClass = {
    pending: 'bg-white/08',
    active:  'bg-[#4f8ef5] shadow-[0_0_6px_rgba(79,142,245,0.4)] motion-reduce:bg-[#4caf80]',
    done:    'bg-[#4caf80]/50',
  }[state];

  const labelClass = {
    pending: 'text-white/15',
    active:  'text-white/50',
    done:    'text-white/25',
  }[state];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-[7px] h-[7px] rounded-full transition-all duration-300 ${dotClass}`} />
      <span className={`font-mono text-[0.48rem] tracking-wide ${labelClass}`}>{dim}</span>
    </div>
  );
}
