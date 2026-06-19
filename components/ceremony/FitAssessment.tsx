/**
 * FitAssessment — WCI Fit Assessment results event.
 *
 * Surfaces a considered note when the WCI evaluation frame may not be
 * the right fit for the submitted work. Not a gate — the maker always
 * decides. Amber/warm styling, distinct from error or success states.
 *
 * Fires between Opening and Stage I when a trigger is detected.
 * SoC: rendering only — store actions come from parent or callbacks.
 */
'use client';

import type { FitAssessmentResult } from '@/store/ceremony.types';

interface Props {
  assessment: FitAssessmentResult;
  onSelectOption: (optionId: string) => void;
  onProceedAnyway: () => void;
}

export function FitAssessment({ assessment, onSelectOption, onProceedAnyway }: Props) {
  return (
    <div
      data-testid="fit-assessment"
      className="
        flex flex-col items-center justify-center min-h-screen
        bg-[#070707] px-6
      "
    >
      {/* Tag */}
      <p className="
        font-mono text-[0.55rem] tracking-[0.35em] uppercase
        text-[#b86c00]/60 mb-14
      ">
        Before We Begin
      </p>

      <div className="max-w-lg w-full space-y-8">
        {/* What we read */}
        {assessment.whatWeRead && (
          <div>
            <p className="
              font-mono text-[0.55rem] tracking-[0.2em] uppercase
              text-[#b86c00]/50 mb-2
            ">
              What we read
            </p>
            <p className="text-[#888] text-[1.05rem] leading-relaxed">
              {assessment.whatWeRead}
            </p>
          </div>
        )}

        {/* Why this matters */}
        {assessment.whyThisMatters && (
          <div>
            <p className="
              font-mono text-[0.55rem] tracking-[0.2em] uppercase
              text-[#b86c00]/50 mb-2
            ">
              Why this matters for evaluation
            </p>
            <p className="text-[#888] text-[1.05rem] leading-relaxed">
              {assessment.whyThisMatters}
            </p>
          </div>
        )}

        {/* Options as clickable cards */}
        <div className="space-y-3 pt-4">
          <p className="
            font-mono text-[0.55rem] tracking-[0.2em] uppercase
            text-[#b86c00]/50 mb-3
          ">
            Your options
          </p>

          {assessment.options.map((option) => (
            <button
              key={option.id}
              data-testid={`fit-assessment-option-${option.id}`}
              onClick={() => onSelectOption(option.id)}
              className="
                w-full text-left p-4 rounded-lg
                border border-[#b86c00]/20
                hover:border-[#b86c00]/45 hover:bg-[#b86c00]/04
                transition-all group
              "
            >
              <span className="
                block text-[#e2e2e2] text-[0.95rem] font-medium mb-1
                group-hover:text-[#f0d0a0]
                transition-colors
              ">
                {option.label}
              </span>
              <span className="block text-[#888] text-[0.85rem] leading-relaxed">
                {option.description}
              </span>
            </button>
          ))}
        </div>

        {/* Proceed anyway — always visible, tertiary styling */}
        <div className="pt-4 text-center">
          <button
            data-testid="fit-assessment-proceed"
            onClick={onProceedAnyway}
            className="
              px-6 py-2.5 rounded-md
              border border-white/10
              text-[#888] font-mono text-[0.78rem] tracking-wide
              hover:border-white/20 hover:text-[#ccc]
              transition-all
            "
          >
            Proceed without changes →
          </button>
        </div>
      </div>
    </div>
  );
}
