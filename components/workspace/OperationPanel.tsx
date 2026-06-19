/**
 * OperationPanel — Zone B right panel.
 *
 * Shows available operations as cards. The maker selects what to do
 * with their work. Active operations replace the card list with the
 * operation's flow component; completed operations show a done badge.
 *
 * SoC: presentation only. Operation definitions are static config.
 * Ceremony integration via callbacks.
 */

'use client';

import { useState } from 'react';
import { CeremonyFlow } from '@/components/ceremony/CeremonyFlow';
import { useCeremonyStore } from '@/store/ceremony';

export type OperationId = 'evaluate' | 'review' | 'summarize' | 'develop' | 'impact';
export type OperationStatus = 'available' | 'active' | 'done' | 'coming-soon';

interface Operation {
  id: OperationId;
  label: string;
  desc: string;
  available: boolean;
}

const OPERATIONS: Operation[] = [
  { id: 'evaluate', label: 'Evaluate', desc: 'Assess your work across nine dimensions', available: true },
  { id: 'review', label: 'Review', desc: 'Careful review with prompts for refinement', available: false },
  { id: 'summarize', label: 'Summarize', desc: 'Plain-language account of where the work stands', available: false },
  { id: 'develop', label: 'Develop', desc: 'Improve title, framing, and argument structure', available: false },
  { id: 'impact', label: 'Impact Assessment', desc: 'Who this work would reach', available: false },
];

interface CompletedOperation {
  id: OperationId;
  score?: number;
  band?: string;
}

interface Props {
  onReadyGate: () => void;
}

export function OperationPanel({ onReadyGate }: Props) {
  const [activeOp, setActiveOp] = useState<OperationId | null>(null);
  const [completedOps, setCompletedOps] = useState<CompletedOperation[]>([]);
  const store = useCeremonyStore();

  const getStatus = (op: Operation): OperationStatus => {
    if (!op.available) return 'coming-soon';
    if (activeOp === op.id) return 'active';
    if (completedOps.some(c => c.id === op.id)) return 'done';
    return 'available';
  };

  const handleEvaluateClick = () => {
    // Reset ceremony state for a fresh evaluation run
    store.reset();
    setActiveOp('evaluate');
  };

  const handleEvaluateComplete = () => {
    const result = useCeremonyStore.getState().wciResult;
    setCompletedOps(prev => [
      ...prev.filter(c => c.id !== 'evaluate'),
      { id: 'evaluate', score: result?.compositeScore, band: result?.band },
    ]);
    setActiveOp(null);
  };

  const handleEvaluateDecline = () => {
    setActiveOp(null);
  };

  // If evaluate is active, show the CeremonyFlow
  if (activeOp === 'evaluate') {
    return (
      <div
        data-testid="operation-evaluate-active"
        className="h-full flex flex-col overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/07">
          <span className="font-mono text-[0.65rem] tracking-[0.25em] uppercase text-[#888]">
            Evaluating
          </span>
          <button
            data-testid="operation-evaluate-cancel"
            onClick={() => setActiveOp(null)}
            className="text-[0.7rem] text-[#555] hover:text-[#888] transition-colors font-mono"
          >
            ← Back to operations
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <CeremonyFlow
            onScoreReady={handleEvaluateComplete}
            onDecline={handleEvaluateDecline}
          />
        </div>
      </div>
    );
  }

  // Default: show operation cards
  const lastEval = completedOps.find(c => c.id === 'evaluate');

  return (
    <div
      data-testid="operation-panel"
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/07">
        <span className="font-mono text-[0.65rem] tracking-[0.25em] uppercase text-[#888]">
          Operations
        </span>
      </div>

      {/* Operation cards */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Score result summary if evaluation is done */}
        {lastEval && (
          <div
            data-testid="operation-evaluate-result"
            className="p-4 rounded-lg border border-[#4f8ef5]/30 bg-[#4f8ef5]/05 mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#4f8ef5]">
                Last Evaluation
              </span>
              {lastEval.score !== undefined && (
                <span className="font-mono text-[1.1rem] font-semibold text-[#4f8ef5]">
                  {lastEval.score.toFixed(1)}
                </span>
              )}
            </div>
            {lastEval.band && (
              <span className="inline-block px-2 py-0.5 rounded-full border border-[#4f8ef5]/30 text-[0.65rem] font-mono text-[#4f8ef5]">
                {lastEval.band}
              </span>
            )}
            <button
              data-testid="operation-evaluate-rerun"
              onClick={handleEvaluateClick}
              className="mt-3 w-full text-center text-[0.75rem] font-mono text-[#888] hover:text-[#e2e2e2] transition-colors py-1.5 border border-white/08 rounded-md hover:border-white/20"
            >
              Run another evaluation
            </button>
          </div>
        )}

        {OPERATIONS.map((op) => {
          const status = getStatus(op);
          const isAvailable = status === 'available';
          const isDone = status === 'done';
          const isComingSoon = status === 'coming-soon';

          return (
            <button
              key={op.id}
              data-testid={`operation-${op.id}`}
              onClick={() => {
                if (op.id === 'evaluate' && isAvailable) {
                  handleEvaluateClick();
                }
              }}
              disabled={!isAvailable}
              className={`w-full text-left p-4 rounded-lg border transition-all
                ${isComingSoon
                  ? 'border-white/05 bg-[#161616] opacity-40 cursor-not-allowed'
                  : isDone
                  ? 'border-[#4caf80]/30 bg-[#4caf80]/04 cursor-default'
                  : isAvailable
                  ? 'border-white/10 bg-[#191919] hover:border-white/25 hover:bg-[#1e1e1e] cursor-pointer'
                  : 'border-white/08 bg-[#191919]'
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[0.88rem] font-medium
                  ${isDone ? 'text-[#4caf80]' : isAvailable ? 'text-[#e2e2e2]' : 'text-[#555]'}`}>
                  {op.label}
                </span>
                <span className={`font-mono text-[0.55rem] tracking-wider px-2 py-0.5 rounded-full border
                  ${isDone
                    ? 'border-[#4caf80]/40 text-[#4caf80]'
                    : isAvailable
                    ? 'border-white/15 text-[#888]'
                    : 'border-white/06 text-[#444]'
                  }`}>
                  {isDone ? 'done' : isAvailable ? 'available' : 'coming soon'}
                </span>
              </div>
              <p className={`text-[0.75rem] leading-relaxed
                ${isDone ? 'text-[#4caf80]/60' : isAvailable ? 'text-[#888]' : 'text-[#444]'}`}>
                {op.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Ready gate button */}
      <div className="px-5 py-4 border-t border-white/07">
        <button
          data-testid="workspace-ready-gate"
          onClick={onReadyGate}
          disabled={completedOps.length === 0}
          className="w-full py-3 rounded-lg text-[0.85rem] font-mono tracking-wide transition-all
            disabled:opacity-25 disabled:cursor-not-allowed
            bg-[#4f8ef5] text-white hover:opacity-85"
        >
          I am ready — proceed to export →
        </button>
        {completedOps.length === 0 && (
          <p className="text-center text-[0.65rem] text-[#555] mt-2 font-mono">
            Complete at least one operation to proceed
          </p>
        )}
      </div>
    </div>
  );
}
