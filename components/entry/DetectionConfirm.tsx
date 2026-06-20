'use client';
/**
 * DetectionConfirm — shows detection result + "As you proceed" context.
 */

import type { DetectionResult } from '@/store/ceremony.types';

interface Props {
  result: DetectionResult;
  onConfirm: () => void;
  onAdjust: () => void;
}

export function DetectionConfirm({ result, onConfirm, onAdjust }: Props) {
  return (
    <div data-testid="detection-confirm" className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
      <p className="mb-3 text-xs font-mono tracking-widest uppercase text-gray-500">
        We think this is:
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <Chip kind="type"       label={result.workType.replace(/-/g, ' ')} />
        <Chip kind="domain"     label={result.domain} />
        <Chip kind="confidence" label={`${result.confidence} confidence`} />
        {result.academicMarkersDetected.length > 0 && (
          <Chip kind="marker" label={`${result.academicMarkersDetected.length} academic markers`} />
        )}
      </div>

      {/* As you proceed */}
      <div className="mb-4 pt-3 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-500 mb-2">As you proceed...</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2 text-xs text-gray-600">
            <span className="text-gray-300 flex-shrink-0">&bull;</span>
            Woodchipper facilitates development, evaluation, review, and editing of your work. You can loop the process.
          </li>
          <li className="flex gap-2 text-xs text-gray-600">
            <span className="text-gray-300 flex-shrink-0">&bull;</span>
            Each phase of your work will be saved, and you can revisit earlier versions.
          </li>
          <li className="flex gap-2 text-xs text-gray-600">
            <span className="text-gray-300 flex-shrink-0">&bull;</span>
            You control when you want to export your work.
          </li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Confirm &rarr;
        </button>
        <button
          onClick={onAdjust}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:border-gray-400 transition-all"
        >
          Adjust
        </button>
      </div>
    </div>
  );
}

function Chip({ kind, label }: { kind: 'type' | 'domain' | 'confidence' | 'marker'; label: string }) {
  const styles: Record<typeof kind, string> = {
    type:       'border-blue-200 text-blue-600 bg-blue-50',
    domain:     'border-green-200 text-green-600 bg-green-50',
    confidence: 'border-amber-200 text-amber-600 bg-amber-50',
    marker:     'border-gray-200 text-gray-500',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-mono capitalize ${styles[kind]}`}>
      {label}
    </span>
  );
}
