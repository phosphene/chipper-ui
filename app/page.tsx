'use client';
/**
 * Woodchipper — top-pinned input, output streams below.
 *
 * Layout: input stays at top of viewport. Results (processing animation,
 * pronouncement, etc.) render below the input, newest first.
 * The user never leaves their position.
 */

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ProgressiveForm } from '@/components/workspace/ProgressiveForm';
import { InlineProcessing } from '@/components/ceremony/InlineProcessing';
import { Pronouncement } from '@/components/ceremony/Pronouncement';
import { useCeremonyStore } from '@/store/ceremony';

type OutputEntry =
  | { kind: 'processing'; id: string }
  | { kind: 'result'; id: string };

export default function Home() {
  const [outputs, setOutputs] = useState<OutputEntry[]>([]);
  const [processingActive, setProcessingActive] = useState(false);
  const [outputVisible, setOutputVisible] = useState(true);
  const store = useCeremonyStore();

  const handleEvaluationStart = useCallback(() => {
    const id = crypto.randomUUID();
    setProcessingActive(true);
    setOutputs(prev => [{ kind: 'processing', id }, ...prev.filter(o => o.kind !== 'processing')]);
  }, []);

  const handleEvaluationComplete = useCallback(() => {
    setProcessingActive(false);
    const id = crypto.randomUUID();
    setOutputs(prev => [
      { kind: 'result', id },
      ...prev.filter(o => o.kind !== 'processing'),
    ]);
  }, []);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 py-2.5 border-b border-black/5 flex-shrink-0">
        <span className="font-mono text-xs tracking-[0.35em] uppercase text-black/40">
          Woodchipper
        </span>
        <button
          data-testid="board-toggle"
          onClick={() => setOutputVisible(v => !v)}
          className="text-[0.6rem] font-mono text-black/40 hover:text-black/60 px-1.5 py-0.5 border border-black/10 rounded"
        >
          {outputVisible ? 'hide output ×' : 'show output ◫'}
        </button>
      </header>

      {/* ── Pinned input area ── */}
      <section
        data-testid="workspace-panels"
        className="flex-shrink-0 border-b border-black/5"
      >
        <ProgressiveForm
          onEvaluationStart={handleEvaluationStart}
          processingActive={processingActive}
        />
      </section>

      {/* ── Output feed — newest at top ── */}
      {outputVisible && <section
        data-testid="workspace-board"
        className="flex-1 overflow-y-auto px-5 py-6"
      >
        {outputs.length === 0 && !processingActive && (
          <div className="max-w-3xl mx-auto py-10">
            {/* Hero illustration */}
            <div className="rounded-2xl overflow-hidden mb-6">
              <Image
                src="/brand/hero.jpg"
                alt="Woodchipper — raw work transforms into structured, evaluated output"
                width={1200}
                height={675}
                className="w-full h-auto"
                priority
              />
            </div>
            <p className="text-center text-sm text-black/25 italic">
              Results will appear here
            </p>
          </div>
        )}

        {outputs.map(entry => {
          if (entry.kind === 'processing') {
            return (
              <div key={entry.id} className="mb-6 animate-rise">
                <InlineProcessing
                  onComplete={handleEvaluationComplete}
                />
              </div>
            );
          }
          if (entry.kind === 'result') {
            return (
              <div key={entry.id} className="mb-6 animate-rise">
                <Pronouncement
                  onProceedToRecording={() => {}}
                  onRequestImprovement={() => {}}
                  onExport={() => {}}
                />
              </div>
            );
          }
          return null;
        })}
      </section>}
    </main>
  );
}
