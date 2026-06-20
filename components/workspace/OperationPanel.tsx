'use client';
/**
 * OperationPanel — Zone B right panel.
 * Evaluate button launches full-page evaluation (handled by parent via onEvaluate).
 * No score shown here. No operation cards. No headings.
 */

interface Props {
  onEvaluate: () => void;
  onReadyGate: () => void;
  evaluationDone?: boolean;
}

export function OperationPanel({ onEvaluate, onReadyGate, evaluationDone }: Props) {
  return (
    <div data-testid="operation-panel" className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-6">

        {evaluationDone && (
          <div data-testid="operation-evaluate-result" className="mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">Evaluation complete. You can run another evaluation, or proceed to export when ready.</p>
            <button
              data-testid="operation-evaluate-rerun"
              onClick={onEvaluate}
              className="mt-3 text-sm text-gray-700 hover:text-gray-900 underline underline-offset-2 transition-colors"
            >
              Run another evaluation
            </button>
          </div>
        )}

        {!evaluationDone && (
          <button
            data-testid="operation-evaluate"
            onClick={onEvaluate}
            className="w-full py-4 rounded-xl border-2 border-gray-900 bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Evaluate →
          </button>
        )}

      </div>

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
