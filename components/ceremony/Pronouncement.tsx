'use client';
/**
 * Pronouncement — Beat VIII.
 * Qualitative reading only. No score. No band. No dimensions.
 * Woodchipper tells the maker what it found in plain language.
 * Score/WCI indexing available only at export stage.
 */

import { useCeremonyStore } from '@/store/ceremony';

interface Props {
  onProceedToRecording?: () => void;
  onRequestImprovement: () => void;
  onExport: () => void;
}

export function Pronouncement({ onProceedToRecording, onRequestImprovement, onExport }: Props) {
  const wciResult = useCeremonyStore((s) => s.wciResult);
  const workType = useCeremonyStore((s) => s.workClassification?.workType?.value);
  const domain = useCeremonyStore((s) => s.judgeIdentity?.domain?.value);

  // Build a qualitative reading from available data
  const epistemicLabel = wciResult?.epistemicLabel;
  const relativeContext = wciResult?.relativeContext;

  // Extract the strongest and weakest dimensions for qualitative feedback
  const dimScores = wciResult?.dimensionScores ?? [];
  const strong = dimScores
    .filter(d => d.rawScore >= 7.0)
    .map(d => d.justification)
    .filter(Boolean)
    .slice(0, 2);
  const weak = dimScores
    .filter(d => d.rawScore < 5.0)
    .map(d => d.justification)
    .filter(Boolean)
    .slice(0, 2);

  return (
    <div data-testid="pronouncement" className="max-w-2xl mx-auto py-6">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
          Woodchipper's reading
        </p>
        {workType && (
          <p className="text-sm text-gray-500">
            {workType.replace(/-/g, ' ')}{domain ? ` · ${domain}` : ''}
          </p>
        )}
      </div>

      {/* Epistemic basis */}
      {epistemicLabel && (
        <div className="mb-5 p-4 rounded-xl border border-gray-200 bg-gray-50">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Basis of this reading</p>
          <p className="text-sm text-gray-700 italic">{epistemicLabel}</p>
        </div>
      )}

      {/* Qualitative reading — what Woodchipper found */}
      {strong.length > 0 && (
        <div className="mb-5 p-4 rounded-xl border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">What reads well</p>
          <ul className="space-y-2">
            {strong.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-gray-300 flex-shrink-0">&bull;</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {weak.length > 0 && (
        <div className="mb-5 p-4 rounded-xl border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">Where development could help</p>
          <ul className="space-y-2">
            {weak.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-gray-300 flex-shrink-0">&bull;</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Relative context — no score, just context */}
      {relativeContext && (
        <div className="mb-5 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-sm text-gray-600">{relativeContext}</p>
        </div>
      )}

      {/* Fallback if no result yet */}
      {!wciResult && (
        <div className="mb-5 p-4 rounded-xl border border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 italic">
            Woodchipper has reviewed your work. Proceed to export to record this evaluation or explore further options.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-5 border-t border-gray-100 space-y-2">
        <button
          data-testid="pronouncement-proceed"
          onClick={onProceedToRecording}
          className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors"
        >
          <span className="text-sm font-medium">Proceed to export</span>
          <span className="text-white/60">→</span>
        </button>
        <button
          onClick={onRequestImprovement}
          className="w-full px-5 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-gray-400 transition-colors text-left"
        >
          Run another evaluation
        </button>
      </div>
    </div>
  );
}
