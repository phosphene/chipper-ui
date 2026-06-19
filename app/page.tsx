'use client';
/**
 * Woodchipper — Three-Zone Architecture
 *
 * Zone A — Entry: "What are you working on?" → detect → confirm → expectations
 * Zone B — Workspace: forms LEFT (70%) + visual board RIGHT (30%, resizable/dismissible)
 *   - Forms drive the work: fill fields, run operations, fill again, loop
 *   - Board tracks the work: each form action adds a node/edge on the board
 *   - Board is interactive: clicking a board item surfaces the relevant form
 *   - Board is resizable (drag) and dismissible (click ×)
 * Zone C — Ready Gate: export options. WCI indexing appears here and only here.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { EntryGate } from '@/components/entry/EntryGate';
import { ExpectationsScreen } from '@/components/entry/ExpectationsScreen';
import { LiveBoard, type BoardTheme } from '@/components/boards/LiveBoard';
import { OperationPanel } from '@/components/workspace/OperationPanel';
import { Recording } from '@/components/ceremony/Recording';
import { useCeremonyStore } from '@/store/ceremony';

type Mode = 'entry' | 'expectations' | 'workspace' | 'ready-gate' | 'done';

const BOARD_DEFAULT_PCT = 30;   // default board width as % of workspace
const BOARD_MIN_PCT     = 15;   // minimum board width when open
const BOARD_MAX_PCT     = 60;   // maximum board width

export default function Home() {
  const [mode, setMode]           = useState<Mode>('entry');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('circuit');
  const [boardPct, setBoardPct]   = useState(BOARD_DEFAULT_PCT);
  const [boardOpen, setBoardOpen] = useState(true);

  const { expectationsAcknowledged, acknowledgeExpectations } = useCeremonyStore();

  // ── Resizer drag ──────────────────────────────────────────────────────────
  const workspaceRef = useRef<HTMLDivElement>(null);
  const dragging     = useRef(false);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !workspaceRef.current) return;
    const rect  = workspaceRef.current.getBoundingClientRect();
    const fromRight = rect.right - e.clientX;
    const pct   = Math.round((fromRight / rect.width) * 100);
    setBoardPct(Math.min(BOARD_MAX_PCT, Math.max(BOARD_MIN_PCT, pct)));
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',  onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',  onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // ── Header ────────────────────────────────────────────────────────────────
  const Header = ({ children }: { children?: React.ReactNode }) => (
    <header className="flex items-center justify-between px-6 py-3 border-b border-white/07 flex-shrink-0">
      <span className="font-mono text-xs tracking-[0.35em] uppercase text-[#555]">
        Woodchipper
      </span>
      {children}
    </header>
  );

  // ── Zone A ────────────────────────────────────────────────────────────────
  if (mode === 'entry') return (
    <main className="min-h-screen bg-[#111] text-[#e2e2e2] flex flex-col">
      <Header>
        <button
          data-testid="stage2-jump"
          onClick={() => { acknowledgeExpectations(); useCeremonyStore.getState().acknowledgeOpening(); setMode('workspace'); }}
          className="px-3 py-1 border border-dashed border-white/10 rounded text-[#555] text-[0.6rem] font-mono hover:text-[#888] hover:border-white/20 transition-all"
        >
          skip to workspace
        </button>
      </Header>
      <div className="max-w-2xl mx-auto px-6 py-12 flex-1 w-full">
        <h1 className="text-[1.8rem] font-light text-[#e2e2e2] mb-8 leading-tight">
          What are you working on?
        </h1>
        <EntryGate
          onCeremonyStart={() => setMode(expectationsAcknowledged ? 'workspace' : 'expectations')}
        />
      </div>
    </main>
  );

  if (mode === 'expectations') return (
    <main className="min-h-screen bg-[#111] text-[#e2e2e2] flex flex-col">
      <Header />
      <div className="max-w-2xl mx-auto px-6 py-12 flex-1 w-full">
        <ExpectationsScreen onBegin={() => { acknowledgeExpectations(); setMode('workspace'); }} />
      </div>
    </main>
  );

  // ── Zone C ────────────────────────────────────────────────────────────────
  if (mode === 'ready-gate') return (
    <main className="min-h-screen bg-[#111] text-[#e2e2e2] flex flex-col">
      <Header>
        <button data-testid="ready-gate-back" onClick={() => setMode('workspace')}
          className="text-[0.65rem] text-[#555] hover:text-[#888] font-mono transition-colors">
          ← back to workspace
        </button>
      </Header>
      <div className="max-w-2xl mx-auto px-6 py-10 flex-1 w-full">
        <Recording onDone={() => setMode('done')} />
      </div>
    </main>
  );

  if (mode === 'done') return (
    <main className="min-h-screen bg-[#111] text-[#e2e2e2] flex flex-col">
      <Header />
      <div data-testid="woodchipper-done" className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-10 h-10 rounded-full border border-[#4caf80]/40 flex items-center justify-center mx-auto mb-6">
            <div className="w-5 h-5 rounded-full border border-[#4caf80]/40" />
          </div>
          <h2 className="text-lg font-light text-[#e2e2e2] mb-2">Complete</h2>
          <p className="text-[0.82rem] text-[#888] mb-8">Your work and its record are preserved.</p>
          <button data-testid="woodchipper-restart"
            onClick={() => { useCeremonyStore.getState().reset(); setMode('entry'); }}
            className="px-5 py-2 border border-white/10 rounded text-[#888] text-xs font-mono hover:border-white/20 hover:text-[#e2e2e2] transition-all">
            Evaluate another work
          </button>
        </div>
      </div>
    </main>
  );

  // ── Zone B — Workspace ────────────────────────────────────────────────────
  // Forms LEFT (100-boardPct% when board open, 100% when closed)
  // Board RIGHT (boardPct%, resizable, dismissible)
  return (
    <main className="h-screen bg-[#111] text-[#e2e2e2] flex flex-col overflow-hidden">
      {/* Workspace header */}
      <header className="flex items-center justify-between px-5 py-2.5 border-b border-white/07 flex-shrink-0">
        <span className="font-mono text-xs tracking-[0.35em] uppercase text-[#555]">Woodchipper</span>
        <div className="flex items-center gap-3">
          {/* Board controls — only when board is open */}
          {boardOpen && (
            <div data-testid="board-theme-selector" className="flex gap-1">
              {(['circuit', 'aqueduct', 'chipper'] as BoardTheme[]).map(t => (
                <button key={t} data-testid={`board-theme-${t}`}
                  onClick={() => setBoardTheme(t)}
                  className={`px-2 py-0.5 rounded text-[0.55rem] font-mono uppercase tracking-wider transition-all
                    ${boardTheme === t ? 'text-[#e2e2e2] bg-white/08' : 'text-[#444] hover:text-[#888]'}`}>
                  {t === 'circuit' ? '⚡' : t === 'aqueduct' ? '🏛' : '⚙'} {t}
                </button>
              ))}
            </div>
          )}
          {/* Toggle board */}
          <button
            data-testid="board-toggle"
            onClick={() => setBoardOpen(v => !v)}
            title={boardOpen ? 'Hide board' : 'Show board'}
            className="text-[0.6rem] font-mono text-[#444] hover:text-[#888] transition-colors px-1.5 py-0.5 border border-white/06 rounded"
          >
            {boardOpen ? 'hide board ×' : 'show board ◫'}
          </button>
        </div>
      </header>

      {/* Two-panel body */}
      <div
        data-testid="workspace-panels"
        ref={workspaceRef}
        className="flex-1 flex min-h-0 overflow-hidden"
      >
        {/* LEFT — Forms (grows to fill remaining space) */}
        <div
          data-testid="workspace-forms"
          className="flex-1 min-w-0 overflow-y-auto"
          style={{ width: boardOpen ? `${100 - boardPct}%` : '100%' }}
        >
          <OperationPanel onReadyGate={() => setMode('ready-gate')} />
        </div>

        {/* Resizer handle */}
        {boardOpen && (
          <div
            data-testid="board-resizer"
            className="w-[4px] cursor-col-resize flex-shrink-0 hover:bg-white/10 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            onMouseDown={() => { dragging.current = true; }}
          />
        )}

        {/* RIGHT — Visual Board (resizable) */}
        {boardOpen && (
          <div
            data-testid="workspace-board"
            className="flex-shrink-0 overflow-hidden border-l border-white/06"
            style={{ width: `${boardPct}%` }}
          >
            <LiveBoard theme={boardTheme} />
          </div>
        )}
      </div>
    </main>
  );
}
