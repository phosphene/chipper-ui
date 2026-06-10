'use client';
/**
 * Pronouncement — T-270
 *
 * Stage VIII. Full-page reading surface. Sequence locked:
 * (1) Epistemic label
 * (2) Relative context
 * (3) Score number + band (count-up animation)
 * (4) Nine dimension bars (staggered animation)
 * (5) Key dimension justifications with passages
 * (6) "What this score is" / "What this score is not"
 * (7) Decision tools
 *
 * SoC: zero business logic. Reads wciResult from ceremony store.
 * All decisions (proceed/improve/export) call parent callbacks.
 */
import { useCeremonyStore } from '@/store/ceremony';
import { ScoreHero } from './ScoreHero';
import { DimensionGrid } from './DimensionGrid';
import { JustificationCard } from './JustificationCard';

interface Props {
  onProceedToRecording: () => void;
  onRequestImprovement: () => void;
  onExport: () => void;
}

// Fallback demo result when no real score is available yet
const DEMO_RESULT = {
  compositeScore: 62,
  band: 'promising' as const,
  dimensionScores: [
    { dimension: 'N',  rawScore: 4.0, weight: 1.0, weightedScore: 4.0,   justification: 'Structurally expected for a null result. The contribution is methodological rather than conceptual.', keyPassage: null },
    { dimension: 'E',  rawScore: 8.0, weight: 1.5, weightedScore: 12.0,  justification: 'Three independent community studies with controlled comparisons. The methodology section is the paper\'s strongest contribution.', keyPassage: 'Across all three sites, feedback loop indicators showed no statistically significant deviation from baseline ecological variation (p > 0.3 in all comparisons).' },
    { dimension: 'P',  rawScore: 5.0, weight: 1.2, weightedScore: 6.0,   justification: 'General prior applies; no domain variant available for this field yet.', keyPassage: null },
    { dimension: 'C',  rawScore: 7.0, weight: 1.0, weightedScore: 7.0,   justification: 'Framework holds throughout. No internal contradictions.', keyPassage: null },
    { dimension: 'S',  rawScore: 7.0, weight: 1.0, weightedScore: 7.0,   justification: 'Economical apparatus. Only the complexity the problem requires.', keyPassage: null },
    { dimension: 'Sc', rawScore: 5.0, weight: 0.8, weightedScore: 4.0,   justification: 'Limited to three study sites. Scope honestly stated.', keyPassage: null },
    { dimension: 'L',  rawScore: 7.0, weight: 1.0, weightedScore: 7.0,   justification: 'Well-situated in prior work. Engages with critics.', keyPassage: null },
    { dimension: 'M',  rawScore: 8.5, weight: 1.5, weightedScore: 12.75, justification: 'Excellent calibration. The null finding is stated as a null finding, not as proof of absence.', keyPassage: 'We do not conclude that niche construction feedback loops are absent — only that they are not detectable at the temporal resolution our methodology affords.' },
    { dimension: 'D',  rawScore: 6.0, weight: 0.8, weightedScore: 4.8,   justification: 'Some boundary conditions stated. Could be more explicit about when the framework does not apply.', keyPassage: null },
  ],
  epistemicLabel: 'corpus-level — no in-session reading on record',
  relativeContext: 'Null-result papers in behavioral ecology typically score 55–68.',
  rubricVersion: '1.0',
  provenance: 'warm' as const,
};

export function Pronouncement({ onProceedToRecording, onRequestImprovement, onExport }: Props) {
  const wciResult = useCeremonyStore((s) => s.wciResult);

  // Use real result if available, demo otherwise
  const result = (wciResult && wciResult.dimensionScores.length > 0) ? {
    compositeScore: wciResult.compositeScore,
    band: wciResult.band,
    dimensionScores: wciResult.dimensionScores,
    epistemicLabel: wciResult.epistemicLabel,
    relativeContext: wciResult.relativeContext,
    rubricVersion: wciResult.rubricVersion,
    provenance: wciResult.provenance,
  } : DEMO_RESULT;

  // Only show justifications for dimensions with notable scores
  const notableJustifications = result.dimensionScores.filter(
    ds => ds.justification && (ds.rawScore >= 7.5 || ds.rawScore <= 4.5)
  );

  return (
    <div className="w-full max-w-2xl mx-auto px-1">

      {/* Score hero — sequence locked */}
      <ScoreHero
        compositeScore={result.compositeScore}
        band={result.band}
        epistemicLabel={result.epistemicLabel}
        relativeContext={result.relativeContext}
        rubricVersion={result.rubricVersion}
        provenance={result.provenance}
      />

      {/* Nine dimensions */}
      <div className="mb-5">
        <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555] mb-3">
          Nine Dimensions
        </p>
        <DimensionGrid dimensionScores={result.dimensionScores} />
      </div>

      {/* Key dimension readings */}
      {notableJustifications.length > 0 && (
        <div className="mb-5">
          <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555] mb-3">
            Reading
          </p>
          {notableJustifications.map(ds => (
            <JustificationCard
              key={ds.dimension}
              dimension={ds.dimension}
              score={ds.rawScore}
              justification={ds.justification}
              keyPassage={ds.keyPassage}
            />
          ))}
        </div>
      )}

      {/* What this score is / is not */}
      <div className="mb-6 space-y-2">
        <div className="p-4 bg-[#191919] border border-white/08 rounded-md">
          <p className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#555] mb-2">What this score is</p>
          <p className="text-[0.78rem] text-[#888] leading-relaxed">
            A reading of your work from the WCI {result.rubricVersion} general variant, rendered with a specific epistemic basis. A judgment from a position — not a verdict from nowhere.
          </p>
        </div>
        <div className="p-4 bg-[#191919] border border-white/08 rounded-md">
          <p className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#555] mb-2">What this score is not</p>
          <p className="text-[0.78rem] text-[#888] leading-relaxed">
            Not a measure of your worth as a researcher. Not a prediction of publication outcome. Not permanent — a subsequent reading may produce a different score, and both scores will be part of the record.
          </p>
        </div>
      </div>

      {/* Decision tools */}
      <div className="pt-4 border-t border-white/07 space-y-2">
        <button
          onClick={onProceedToRecording}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#4f8ef5]/08 border border-[#4f8ef5]/30 rounded-md cursor-pointer hover:bg-[#4f8ef5]/12 transition-all group"
        >
          <div>
            <div className="text-[0.82rem] font-medium text-[#4f8ef5] text-left">Proceed to Recording</div>
            <div className="text-[0.7rem] text-[#4f8ef5]/60 text-left">Decide whether to save privately, submit to boards, or publish.</div>
          </div>
          <span className="text-[#4f8ef5]/60 group-hover:text-[#4f8ef5] transition-colors ml-3">→</span>
        </button>

        <button
          onClick={onRequestImprovement}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#191919] border border-white/08 rounded-md cursor-pointer hover:border-white/18 transition-all group"
        >
          <div>
            <div className="text-[0.82rem] font-medium text-[#888] text-left">Request Improvement Guidance</div>
            <div className="text-[0.7rem] text-[#555] text-left">See which dimensions to strengthen before re-evaluation.</div>
          </div>
          <span className="text-[#444] group-hover:text-[#888] transition-colors ml-3">↻</span>
        </button>

        <button
          onClick={onExport}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#191919] border border-white/08 rounded-md cursor-pointer hover:border-white/18 transition-all group"
        >
          <div>
            <div className="text-[0.82rem] font-medium text-[#888] text-left">Download Justification Report</div>
            <div className="text-[0.7rem] text-[#555] text-left">Full dimension-by-dimension reading as a PDF.</div>
          </div>
          <span className="text-[#444] group-hover:text-[#888] transition-colors ml-3">↓</span>
        </button>
      </div>

    </div>
  );
}
