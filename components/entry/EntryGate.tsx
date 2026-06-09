/**
 * EntryGate — T-266, T-267
 *
 * The top-level entry component. Manages Simple/Detailed mode switch.
 * Mode state is local (not in ceremony store — it's a UI concern, not ceremony state).
 *
 * SoC: mode switch is UI state. Ceremony state is in Zustand store.
 */

'use client';

import { useState } from 'react';
import { SimpleEntry } from './SimpleEntry';
import { DetailedEntry } from '@/components/accordion/DetailedEntry';

type Mode = 'simple' | 'detailed';

interface Props {
  onCeremonyStart: () => void;
}

export function EntryGate({ onCeremonyStart }: Props) {
  const [mode, setMode] = useState<Mode>('simple');

  return (
    <div className="w-full">
      {/* Mode toggle */}
      <div className="flex justify-center mb-6">
        <div className="flex gap-0.5 p-0.5 bg-[#191919] border border-white/08 rounded-md">
          {(['simple', 'detailed'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`
                px-4 py-1.5 rounded text-[0.68rem] font-mono tracking-wide capitalize transition-all
                ${mode === m
                  ? 'bg-[#4f8ef5] text-white'
                  : 'text-[#555] hover:text-[#888]'
                }
              `}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === 'simple' ? (
        <SimpleEntry
          onConfirmed={onCeremonyStart}
          onSwitchToDetailed={() => setMode('detailed')}
        />
      ) : (
        <DetailedEntry onCeremonyStart={onCeremonyStart} />
      )}
    </div>
  );
}
