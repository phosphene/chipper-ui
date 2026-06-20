'use client';
/**
 * Woodchipper — single page, no mode swaps.
 *
 * Everything lives here: entry text, progressive form sections, board.
 * No screen jumps. Content moves to the user — user stays put.
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { LiveBoard, type BoardTheme } from '@/components/boards/LiveBoard';
import { ProgressiveForm } from '@/components/workspace/ProgressiveForm';
import { useCeremonyStore } from '@/store/ceremony';

const BOARD_DEFAULT_PCT = 30;
const BOARD_MIN_PCT     = 15;
const BOARD_MAX_PCT     = 60;

export default function Home() {
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('circuit');
  const [boardPct, setBoardPct]     = useState(BOARD_DEFAULT_PCT);
  const [boardOpen, setBoardOpen]   = useState(true);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const dragging     = useRef(false);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !workspaceRef.current) return;
    const rect    = workspaceRef.current.getBoundingClientRect();
    const fromRight = rect.right - e.clientX;
    const pct     = Math.round((fromRight / rect.width) * 100);
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

  return (
    <main className="h-screen bg-white text-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 flex-shrink-0">
        <span className="font-mono text-xs tracking-[0.35em] uppercase text-gray-500">Woodchipper</span>
        <div className="flex items-center gap-3">
          {boardOpen && (
            <div data-testid="board-theme-selector" className="flex gap-1">
              {(['circuit', 'aqueduct', 'chipper'] as BoardTheme[]).map(t => (
                <button key={t} data-testid={`board-theme-${t}`}
                  onClick={() => setBoardTheme(t)}
                  className={`px-2 py-0.5 rounded text-[0.55rem] font-mono uppercase tracking-wider transition-all
                    ${boardTheme === t ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                  {t === 'circuit' ? '⚡' : t === 'aqueduct' ? '🏛' : '⚙'} {t}
                </button>
              ))}
            </div>
          )}
          <button data-testid="board-toggle" onClick={() => setBoardOpen(v => !v)}
            className="text-[0.6rem] font-mono text-gray-500 hover:text-gray-700 px-1.5 py-0.5 border border-gray-200 rounded">
            {boardOpen ? 'hide board ×' : 'show board ◫'}
          </button>
          {/* Dev shortcut — jump past entry */}
          <button data-testid="stage2-jump"
            onClick={() => useCeremonyStore.getState().acknowledgeExpectations?.()}
            className="px-2 py-0.5 border border-dashed border-gray-200 rounded text-[0.55rem] font-mono text-gray-400 hover:text-gray-600">
            dev
          </button>
        </div>
      </header>

      {/* Body — left form + right board */}
      <div data-testid="workspace-panels" ref={workspaceRef}
        className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT — ProgressiveForm owns everything: entry + sections + reading */}
        <div data-testid="workspace-forms"
          className="flex-1 min-w-0 overflow-hidden"
          style={{ width: boardOpen ? `${100 - boardPct}%` : '100%' }}>
          <ProgressiveForm />
        </div>

        {boardOpen && (
          <div data-testid="board-resizer"
            className="w-[4px] cursor-col-resize flex-shrink-0 bg-gray-100 hover:bg-gray-300 transition-colors"
            onMouseDown={() => { dragging.current = true; }} />
        )}

        {boardOpen && (
          <div data-testid="workspace-board"
            className="flex-shrink-0 overflow-hidden border-l border-gray-200"
            style={{ width: `${boardPct}%` }}>
            <LiveBoard theme={boardTheme} />
          </div>
        )}
      </div>
    </main>
  );
}
