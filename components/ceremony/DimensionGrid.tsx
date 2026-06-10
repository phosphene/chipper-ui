'use client';
/**
 * DimensionGrid — T-270
 *
 * Nine dimension bars with weights. E and M gold (weighted 1.5×).
 * Bars animate to width on mount.
 * SoC: pure rendering from DimensionScore array.
 */
import { useEffect, useState } from 'react';
import type { DimensionScore } from '@/store/ceremony.types';

const WEIGHTED_DIMS = new Set(['E', 'M']);

interface Props {
  dimensionScores: DimensionScore[];
}

export function DimensionGrid({ dimensionScores }: Props) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Stagger: animate bars after a short delay
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mb-2">
      {dimensionScores.map((ds, i) => {
        const isWeighted = WEIGHTED_DIMS.has(ds.dimension);
        const pct = (ds.rawScore / 10) * 100;
        return (
          <div
            key={ds.dimension}
            className="grid grid-cols-[32px_1fr_36px] gap-3 items-center py-[6px] border-b border-white/07 last:border-0"
          >
            <span className="font-mono text-[0.78rem] font-semibold text-[#e2e2e2]">
              {ds.dimension}
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[0.72rem] text-[#888]">{ds.dimension === 'N' ? 'Novelty' : ds.dimension === 'E' ? 'Evidence Density' : ds.dimension === 'P' ? 'Predictive Power' : ds.dimension === 'C' ? 'Coherence' : ds.dimension === 'S' ? 'Parsimony' : ds.dimension === 'Sc' ? 'Scope' : ds.dimension === 'L' ? 'Literature' : ds.dimension === 'M' ? 'Claim-Evidence Match' : 'Demarcation'}</span>
                <span className="font-mono text-[0.55rem] text-[#444]">×{ds.weight.toFixed(1)}</span>
              </div>
              <div className="h-[3px] bg-white/07 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${isWeighted ? 'bg-[#4f8ef5]' : 'bg-white/30'}`}
                  style={{
                    width: animated ? `${pct}%` : '0%',
                    transitionDelay: `${i * 60}ms`,
                  }}
                />
              </div>
            </div>
            <span className="font-mono text-[0.78rem] text-[#888] text-right">{ds.rawScore.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}
