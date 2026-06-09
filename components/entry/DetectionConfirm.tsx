/**
 * DetectionConfirm — T-266
 *
 * Shows the system's detection result as chips.
 * "We think this is: [X]" — labeled as a guess, one-click editable.
 *
 * SoC: zero business logic. Reads from store via selectors.
 * Rendering only: shows chips, confirm button, adjust button.
 */

'use client';

import type { DetectionResult } from '@/store/ceremony.types';

interface Props {
  result: DetectionResult;
  onConfirm: () => void;
  onAdjust: () => void;
}

export function DetectionConfirm({ result, onConfirm, onAdjust }: Props) {
  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-[#191919] p-5 animate-fade-up">
      <p className="mb-3 text-xs font-mono tracking-widest uppercase text-[#888]">
        We think this is:
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <Chip kind="type" label={result.workType.replace(/-/g, ' ')} />
        <Chip kind="domain" label={result.domain} />
        <Chip kind="confidence" label={`${result.confidence} confidence`} />
        {result.academicMarkersDetected.length > 0 && (
          <Chip
            kind="marker"
            label={`${result.academicMarkersDetected.length} academic markers`}
          />
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          className="px-5 py-2 rounded-md bg-[#4f8ef5] text-white text-sm font-mono tracking-wide hover:opacity-85 transition-opacity"
        >
          Confirm →
        </button>
        <button
          onClick={onAdjust}
          className="px-4 py-2 rounded-md border border-white/10 text-[#888] text-sm font-mono hover:border-white/25 hover:text-[#e2e2e2] transition-all"
        >
          Adjust
        </button>
      </div>
    </div>
  );
}

function Chip({ kind, label }: { kind: 'type' | 'domain' | 'confidence' | 'marker'; label: string }) {
  const styles: Record<typeof kind, string> = {
    type:       'border-[#4fc3f7]/40 text-[#4fc3f7] bg-[#4fc3f7]/06',
    domain:     'border-[#4caf80]/40 text-[#4caf80] bg-[#4caf80]/06',
    confidence: 'border-[#f5a623]/40 text-[#f5a623] bg-[#f5a623]/06',
    marker:     'border-white/15 text-[#888]',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-mono capitalize ${styles[kind]}`}>
      {label}
    </span>
  );
}
