'use client';
import { useState } from 'react';
import { EntryGate } from '@/components/entry/EntryGate';
import { CeremonyFlow } from '@/components/ceremony/CeremonyFlow';

export default function Home() {
  const [mode, setMode] = useState<'entry' | 'ceremony' | 'done'>('entry');

  return (
    <main className="min-h-screen bg-[#111] text-[#e2e2e2]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/07">
        <span className="font-mono text-xs tracking-[0.35em] uppercase text-[#888]">
          Woodchipper
        </span>
        <button
          data-testid="stage2-jump"
          onClick={() => setMode('ceremony')}
          className="px-3 py-1.5 border border-dashed border-[#555]/60 rounded text-[#666] text-[0.65rem] font-mono tracking-wide hover:border-[#888]/60 hover:text-[#888] transition-all"
        >
          STAGE 2 JUMP
          <span className="block text-[0.5rem] text-[#555] tracking-normal">direct access</span>
        </button>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {mode === 'entry' && (
          <>
            <h1 className="text-[2rem] font-light text-[#e2e2e2] mb-6 leading-tight">
              What are you working on?
            </h1>
            <EntryGate onCeremonyStart={() => setMode('ceremony')} />
          </>
        )}

        {mode === 'ceremony' && (
          <CeremonyFlow
            onScoreReady={() => setMode('done')}
            onDecline={() => setMode('entry')}
          />
        )}

        {mode === 'done' && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full border-[1.5px] border-[#4f8ef5]/40 flex items-center justify-center mx-auto mb-6">
              <div className="w-6 h-6 rounded-full border border-[#4f8ef5]/40" />
            </div>
            <h2 className="text-xl font-light text-[#e2e2e2] mb-3">The Ceremony is Complete</h2>
            <p className="text-[0.88rem] text-[#888] italic mb-8 max-w-sm mx-auto leading-relaxed">
              Your work has been evaluated and its record is preserved.
            </p>
            <button
              onClick={() => setMode('entry')}
              className="px-6 py-2.5 border border-white/10 rounded-md text-[#888] text-sm font-mono hover:border-white/20 hover:text-[#e2e2e2] transition-all"
            >
              Evaluate Another Work
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
