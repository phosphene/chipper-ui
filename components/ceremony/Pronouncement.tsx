'use client';
/**
 * Pronouncement — Woodchipper's reading of the work.
 *
 * NO WCI. NO SCORES. NO BANDS. NO DIMENSIONS.
 *
 * Woodchipper tells the user what it found: where they are,
 * what their work is, what reads well, where development could
 * help, gaps between claims and content, what the work bears on,
 * future directions, and unintended discoveries.
 *
 * WCI scoring is a completely separate path that only runs if
 * the user explicitly selects the credibility evaluation route.
 */

import { useCeremonyStore } from '@/store/ceremony';

interface Props {
  onProceedToRecording?: () => void;
  onRequestImprovement: () => void;
  onExport: () => void;
}

export function Pronouncement({ onProceedToRecording, onRequestImprovement, onExport }: Props) {
  const reading = useCeremonyStore((s) => s.woodchipperReading);
  const workType = useCeremonyStore((s) => s.workClassification?.workType?.value);
  const domain = useCeremonyStore((s) => s.judgeIdentity?.domain?.value);

  return (
    <div data-testid="pronouncement" className="max-w-2xl mx-auto py-6">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-2">
          Woodchipper&rsquo;s reading
        </p>
        {reading?.categorization && (
          <p className="text-sm text-black/50">
            {reading.categorization}{domain ? ` · ${domain}` : ''}
            {reading.workStage ? ` · ${reading.workStage} stage` : ''}
          </p>
        )}
      </div>

      {/* Basis */}
      {reading?.basis && (
        <div className="mb-5 p-4 rounded-xl border border-black/10 bg-black/[0.02]">
          <p className="text-xs font-medium text-black/40 uppercase tracking-widest mb-1">Basis of this reading</p>
          <p className="text-sm text-black/60 italic">{reading.basis}</p>
        </div>
      )}

      {/* What reads well */}
      {reading && reading.strengths.length > 0 && (
        <div className="mb-5 p-4 rounded-xl border border-black/10">
          <p className="text-xs font-medium text-black/40 uppercase tracking-widest mb-3">What reads well</p>
          <ul className="space-y-2">
            {reading.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-black/70">
                <span className="text-black/20 flex-shrink-0">&bull;</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Where development could help */}
      {reading && reading.developmentAreas.length > 0 && (
        <div className="mb-5 p-4 rounded-xl border border-black/10">
          <p className="text-xs font-medium text-black/40 uppercase tracking-widest mb-3">Where development could help</p>
          <ul className="space-y-2">
            {reading.developmentAreas.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm text-black/70">
                <span className="text-black/20 flex-shrink-0">&bull;</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Claims-content gap */}
      {reading?.claimsGap && (
        <div className="mb-5 p-4 rounded-xl border border-amber-200/50 bg-amber-50/30">
          <p className="text-xs font-medium text-black/40 uppercase tracking-widest mb-2">Claims–content gap</p>
          <p className="text-sm text-black/60">{reading.claimsGap}</p>
        </div>
      )}

      {/* Title alignment */}
      {reading?.titleAlignment && (
        <div className="mb-5 p-4 rounded-xl border border-black/10">
          <p className="text-xs font-medium text-black/40 uppercase tracking-widest mb-2">Title–scope alignment</p>
          <p className="text-sm text-black/60">{reading.titleAlignment}</p>
        </div>
      )}

      {/* What the work bears on */}
      {reading && reading.bearings.length > 0 && (
        <div className="mb-5 p-4 rounded-xl border border-black/10">
          <p className="text-xs font-medium text-black/40 uppercase tracking-widest mb-3">What this work bears on</p>
          <ul className="space-y-2">
            {reading.bearings.map((b, i) => (
              <li key={i} className="flex gap-2 text-sm text-black/70">
                <span className="text-black/20 flex-shrink-0">&bull;</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Future directions */}
      {reading && reading.futureDirections.length > 0 && (
        <div className="mb-5 p-4 rounded-xl border border-black/10">
          <p className="text-xs font-medium text-black/40 uppercase tracking-widest mb-3">Future directions</p>
          <ul className="space-y-2">
            {reading.futureDirections.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm text-black/70">
                <span className="text-black/20 flex-shrink-0">&bull;</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Unintended discoveries */}
      {reading && reading.unintendedDiscoveries.length > 0 && (
        <div className="mb-5 p-4 rounded-xl border border-black/10">
          <p className="text-xs font-medium text-black/40 uppercase tracking-widest mb-3">Outside your original pursuit</p>
          <ul className="space-y-2">
            {reading.unintendedDiscoveries.map((u, i) => (
              <li key={i} className="flex gap-2 text-sm text-black/70">
                <span className="text-black/20 flex-shrink-0">&bull;</span>
                {u}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Relative context */}
      {reading?.relativeContext && (
        <div className="mb-5 p-4 rounded-xl bg-black/[0.02] border border-black/10">
          <p className="text-sm text-black/50">{reading.relativeContext}</p>
        </div>
      )}

      {/* Fallback if no reading yet */}
      {!reading && (
        <div className="mb-5 p-4 rounded-xl border border-black/10 bg-black/[0.02]">
          <p className="text-sm text-black/50 italic">
            Woodchipper is preparing your reading.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-5 border-t border-black/5 space-y-2">
        <button
          data-testid="pronouncement-proceed"
          onClick={onRequestImprovement}
          className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-black/90 text-white hover:bg-black/70 transition-colors"
        >
          <span className="text-sm font-medium">Work on this — improve and iterate</span>
          <span className="text-white/60">→</span>
        </button>
        <button
          onClick={onExport}
          className="w-full px-5 py-3 rounded-xl border border-black/10 text-sm text-black/50 hover:border-black/25 transition-colors text-left"
        >
          Export or continue to other services
        </button>
      </div>
    </div>
  );
}
