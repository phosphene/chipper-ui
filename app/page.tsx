/**
 * Woodchipper — Three-Zone Architecture
 *
 * Zone A — Intake: text entry → file drop → detection → confirm → expectations
 * Zone B — Iterative Loop: board (left) + operations (right)
 * Zone C — Ready Gate: export / recording
 *
 * Modes: entry | expectations | workspace | ready-gate | done
 */

'use client';

import { useState } from 'react';
import { EntryGate } from '@/components/entry/EntryGate';
import { ExpectationsScreen } from '@/components/entry/ExpectationsScreen';
import { LiveBoard, type BoardTheme } from '@/components/boards/LiveBoard';
import { OperationPanel } from '@/components/workspace/OperationPanel';
import { Recording } from '@/components/ceremony/Recording';
import { useCeremonyStore } from '@/store/ceremony';

type Mode = 'entry' | 'expectations' | 'workspace' | 'ready-gate' | 'done';

export default function Home() {
  const [mode, setMode] = useState<Mode>('entry');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('circuit');
  const { expectationsAcknowledged, acknowledgeExpectations } = useCeremonyStore();

  return (
    <main
      data-testid="woodchipper-main"
      className="min-h-screen bg-[#111] text-[#e2e2e2] flex flex-col"
    >
      {/* ── Zone A: Intake ────────────────────────────── */}
      {mode === 'entry' && (
        <>
          {/* Header — entry mode */}
          <header className="flex items-center justify-between px-8 py-4 border-b border-white/07">
            <span className="font-mono text-xs tracking-[0.35em] uppercase text-[#888]">
              Woodchipper
            </span>
            <button
              data-testid="stage2-jump"
              onClick={() => {
                acknowledgeExpectations();
                useCeremonyStore.getState().acknowledgeOpening();
                setMode('workspace');
              }}
              className="px-3 py-1.5 border border-dashed border-[#888]/60 rounded text-[#999] text-[0.65rem] font-mono tracking-wide hover:border-[#888]/60 hover:text-[#888] transition-all"
            >
              STAGE 2 JUMP
              <span className="block text-[0.5rem] text-[#888] tracking-normal">direct access</span>
            </button>
          </header>

          <div className="max-w-2xl mx-auto px-6 py-12 flex-1">
            <h1 className="text-[2rem] font-light text-[#e2e2e2] mb-6 leading-tight">
              What are you working on?
            </h1>
            <EntryGate
              onCeremonyStart={() => {
                if (expectationsAcknowledged) {
                  setMode('workspace');
                } else {
                  setMode('expectations');
                }
              }}
            />
          </div>
        </>
      )}

      {/* ── Expectations (between Zone A and Zone B) ──── */}
      {mode === 'expectations' && (
        <>
          <header className="flex items-center justify-between px-8 py-4 border-b border-white/07">
            <span className="font-mono text-xs tracking-[0.35em] uppercase text-[#888]">
              Woodchipper
            </span>
          </header>

          <div className="max-w-2xl mx-auto px-6 py-12 flex-1">
            <ExpectationsScreen
              onBegin={() => {
                acknowledgeExpectations();
                setMode('workspace');
              }}
            />
          </div>
        </>
      )}

      {/* ── Zone B: Workspace — Two-Panel Iterative Loop ─── */}
      {mode === 'workspace' && (
        <>
          {/* Header — workspace mode: wordmark + theme selector only */}
          <header className="flex items-center justify-between px-6 py-3 border-b border-white/07">
            <span className="font-mono text-xs tracking-[0.35em] uppercase text-[#888]">
              Woodchipper
            </span>
            {/* Theme selector */}
            <div data-testid="board-theme-selector" className="flex gap-1">
              {(['circuit', 'aqueduct', 'chipper'] as BoardTheme[]).map((t) => (
                <button
                  key={t}
                  data-testid={`board-theme-${t}`}
                  onClick={() => setBoardTheme(t)}
                  className={`px-2 py-1 rounded text-[0.6rem] font-mono tracking-wide transition-all
                    ${boardTheme === t
                      ? 'bg-white/10 text-[#e2e2e2] border border-white/20'
                      : 'text-[#555] border border-transparent hover:text-[#888] hover:border-white/08'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </header>

          {/* Two-panel layout */}
          <div
            data-testid="workspace-panels"
            className="flex-1 flex min-h-0"
          >
            {/* Left: Board (~40%) */}
            <div
              data-testid="workspace-board"
              className="w-[40%] border-r border-white/07 overflow-hidden"
            >
              <LiveBoard theme={boardTheme} />
            </div>

            {/* Right: Operations (~60%) */}
            <div
              data-testid="workspace-operations"
              className="w-[60%] overflow-hidden"
            >
              <OperationPanel
                onReadyGate={() => setMode('ready-gate')}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Zone C: Ready Gate — Recording & Export ────── */}
      {mode === 'ready-gate' && (
        <>
          <header className="flex items-center justify-between px-8 py-4 border-b border-white/07">
            <span className="font-mono text-xs tracking-[0.35em] uppercase text-[#888]">
              Woodchipper
            </span>
            <button
              data-testid="ready-gate-back"
              onClick={() => setMode('workspace')}
              className="text-[0.7rem] text-[#555] hover:text-[#888] transition-colors font-mono"
            >
              ← Back to workspace
            </button>
          </header>

          <div className="max-w-2xl mx-auto px-6 py-12 flex-1">
            <Recording
              onDone={() => setMode('done')}
            />
          </div>
        </>
      )}

      {/* ── Done ──────────────────────────────────────── */}
      {mode === 'done' && (
        <>
          <header className="flex items-center justify-between px-8 py-4 border-b border-white/07">
            <span className="font-mono text-xs tracking-[0.35em] uppercase text-[#888]">
              Woodchipper
            </span>
          </header>

          <div className="max-w-2xl mx-auto px-6 py-12 flex-1">
            <div
              data-testid="woodchipper-done"
              className="text-center py-16"
            >
              <div className="w-12 h-12 rounded-full border-[1.5px] border-[#4f8ef5]/40 flex items-center justify-center mx-auto mb-6">
                <div className="w-6 h-6 rounded-full border border-[#4f8ef5]/40" />
              </div>
              <h2 className="text-xl font-light text-[#e2e2e2] mb-3">Complete</h2>
              <p className="text-[0.88rem] text-[#888] italic mb-8 max-w-sm mx-auto leading-relaxed">
                Your work has been evaluated and its record is preserved.
              </p>
              <button
                data-testid="woodchipper-restart"
                onClick={() => {
                  useCeremonyStore.getState().reset();
                  setMode('entry');
                }}
                className="px-6 py-2.5 border border-white/10 rounded-md text-[#888] text-sm font-mono hover:border-white/20 hover:text-[#e2e2e2] transition-all"
              >
                Evaluate Another Work
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
