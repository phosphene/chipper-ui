'use client';
/**
 * ScoreHero — T-270
 *
 * Delivers: (1) epistemic label, (2) relative context, (3) number + band.
 * Sequence is locked — do not reorder. Context before number.
 * Number counts up from 0 in 800ms on mount.
 *
 * SoC: zero business logic. Renders WCIResult fields only.
 */
import { useEffect, useState } from 'react';
import type { Band } from '@/store/ceremony.types';

const BAND_STYLES: Record<Band, string> = {
  'landmark':   'border-[#4caf80]/50 text-[#4caf80] bg-[#4caf80]/06',
  'significant':'border-[#4f8ef5]/50 text-[#4f8ef5] bg-[#4f8ef5]/06',
  'promising':  'border-[#f5a623]/40 text-[#f5a623] bg-[#f5a623]/06',
  'developing': 'border-white/15 text-[#888]',
  'early-stage':'border-[#e05252]/35 text-[#e05252] bg-[#e05252]/04',
};

interface Props {
  compositeScore: number;
  band: Band;
  epistemicLabel: string;
  relativeContext: string;
  rubricVersion: string;
  provenance: 'cold' | 'warm' | 'iterative';
}

export function ScoreHero({ compositeScore, band, epistemicLabel, relativeContext, rubricVersion, provenance }: Props) {
  const [displayed, setDisplayed] = useState(0);

  // Count up from 0 to compositeScore over 800ms
  useEffect(() => {
    const start = performance.now();
    const duration = 800;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * compositeScore));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [compositeScore]);

  return (
    <div className="text-center pb-6 border-b border-white/07 mb-5">
      {/* 1. Epistemic label — first */}
      <p className="text-[0.78rem] italic text-[#888] mb-4">{epistemicLabel}</p>

      {/* 2. Relative context — before the number */}
      <div className="inline-block px-4 py-2 rounded-md bg-[#4f8ef5]/04 border border-[#4f8ef5]/15 mb-5">
        <p className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#4f8ef5]/60 mb-1">In context</p>
        <p className="text-[0.82rem] text-[#888]">{relativeContext}</p>
      </div>

      {/* 3. The number + band */}
      <div className="mb-2">
        <span className="font-light text-[4rem] leading-none text-[#e2e2e2] tracking-tight">
          {displayed}
        </span>
      </div>
      <span className={`inline-block px-4 py-1 font-mono text-[0.68rem] tracking-[0.22em] uppercase rounded-sm border mb-3 ${BAND_STYLES[band]}`}>
        {band}
      </span>
      <div className="font-mono text-[0.58rem] tracking-[0.1em] text-[#444]">
        WCI {rubricVersion} · {provenance} read
      </div>
    </div>
  );
}
