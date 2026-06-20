'use client';
/**
 * OperationPanel — Zone B right panel.
 * No operation cards list. No "Operations" heading. No "available"/"coming soon" badges.
 * Just: the ceremony flow when Evaluate is active, or a simple Evaluate button + ready gate.
 * No score shown after evaluation — qualitative reading only (handled in CeremonyFlow/Pronouncement).
 */

import { useState } from 'react';
import { CeremonyFlow } from '@/components/ceremony/CeremonyFlow';
import { useCeremonyStore } from '@/store/ceremony';

interface Props {
  onReadyGate: () => void;
}

export function OperationPanel({ onReadyGate }: Props) {
  const [activeOp, setActiveOp] = useState<'evaluate' | null>(null);
  const [evaluationDone, setEvaluationDone] = useState(false);
  const store = useCeremonyStore();

  const handleEvaluateClick = () => {
    store.reset();
    setActiveOp('evaluate');
  };

  const handleEvaluateComplete = () => {
    setEvaluationDone(true);
    setActiveOp(null);
  };

  // Ceremony flow is active
  if (activeOp === 'evaluate') {
    return (
      <div data-testid="operation-evaluate-active" className="h-full flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
          <span className="text-xs text-gray-400 font-mono tracking-widest uppercase">Evaluating</span>
          <button
            data-testid="operation-evaluate-cancel"
            onClick={() => setActiveOp(null)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <CeremonyFlow
            onScoreReady={handleEvaluateComplete}
            onDecline={() => setActiveOp(null)}
          />
        </div>
      </div>
    );
  }

  // Default panel — no cards list, just an Evaluate button and ready gate
  return (
    <div data-testid="operation-panel" className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-6">

        {/* Post-evaluation state */}
        {evaluationDone && (
          <div data-testid="operation-evaluate-result" className="mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">Evaluation complete. You can run another evaluation, or proceed to export when ready.</p>
            <button
              data-testid="operation-evaluate-rerun"
              onClick={handleEvaluateClick}
              className="mt-3 text-sm text-gray-700 hover:text-gray-900 underline underline-offset-2 transition-colors"
            >
              Run another evaluation
            </button>
          </div>
        )}

        {/* Evaluate button */}
        {!evaluationDone && (
          <button
            data-testid="operation-evaluate"
            onClick={handleEvaluateClick}
            className="w-full py-4 rounded-xl border-2 border-gray-900 bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Evaluate →
          </button>
        )}

      </div>

      {/* Ready gate */}
      <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
        <button
          data-testid="workspace-ready-gate"
          onClick={onReadyGate}
          className="w-full py-3 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all"
        >
          I am ready — proceed to export →
        </button>
      </div>
    </div>
  );
}
