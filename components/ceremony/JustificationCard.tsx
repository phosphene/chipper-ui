'use client';
/**
 * JustificationCard — T-270
 *
 * Per-dimension reading with optional key passage.
 * SoC: pure rendering.
 */
interface Props {
  dimension: string;
  score: number;
  justification: string;
  keyPassage?: string | null;
}

export function JustificationCard({ dimension, score, justification, keyPassage }: Props) {
  return (
    <div className="mb-3 p-4 bg-[#191919] border border-white/08 rounded-md">
      <h4 className="text-[0.82rem] font-semibold text-[#e2e2e2] mb-2">
        {dimension} <span className="font-normal text-[#555]">({score.toFixed(1)})</span>
      </h4>
      <p className="text-[0.78rem] text-[#888] leading-relaxed mb-2">{justification}</p>
      {keyPassage && (
        <blockquote className="text-[0.75rem] italic text-[#555] border-l-2 border-white/12 pl-3 leading-relaxed">
          "{keyPassage}"
        </blockquote>
      )}
    </div>
  );
}
