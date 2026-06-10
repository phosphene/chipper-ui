'use client';
import React from 'react';
/**
 * StageHeader — T-267
 *
 * The clickable header for an accordion stage.
 * Shows: step number, stage label, title, summary chips (when collapsed), chevron.
 *
 * SoC: zero business logic. Receives all state as props.
 * All open/closed/locked/done decisions made by parent via selectors.
 */


interface Props {
  stepNum: string;
  stageLabel: string;
  title: React.ReactNode;
  chips: string[];
  isActive: boolean;
  isDone: boolean;
  isLocked: boolean;
  onClick: () => void;
}

export function StageHeader({
  stepNum, stageLabel, title, chips,
  isActive, isDone, isLocked, onClick,
}: Props) {
  const stepStyle = isActive
    ? 'bg-[#4f8ef5] border-[#4f8ef5] text-white'
    : isDone
    ? 'bg-[#4caf80]/15 border-[#4caf80]/50 text-[#4caf80]'
    : 'border-white/10 text-[#555]';

  const labelStyle = isActive
    ? 'text-[#4f8ef5]'
    : isDone
    ? 'text-[#4caf80]'
    : 'text-[#555]';

  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={`
        flex items-center gap-3 w-full text-left px-[18px] py-[14px]
        transition-colors duration-150
        ${isActive ? 'bg-[#4f8ef5]/04' : isDone ? 'bg-[#4caf80]/04' : 'bg-[#191919]'}
        ${isLocked ? 'cursor-default' : 'hover:bg-[#222]'}
      `}
    >
      {/* Step circle */}
      <span className={`
        flex-shrink-0 w-6 h-6 rounded-full border-[1.5px] flex items-center justify-content-center
        font-mono text-[0.6rem] ${stepStyle}
      `}>
        <span className="mx-auto">{isDone ? '✓' : stepNum}</span>
      </span>

      {/* Meta */}
      <span className="flex-1 min-w-0">
        <span className={`block font-mono text-[0.58rem] tracking-[0.18em] uppercase mb-0.5 ${labelStyle}`}>
          {stageLabel}
        </span>
        <span className={`block text-[13px] font-medium ${isDone ? 'text-[#555] font-normal' : 'text-[#e2e2e2]'}`}>
          {title}
        </span>
      </span>

      {/* Summary chips — only when done/collapsed */}
      {isDone && chips.length > 0 && (
        <span className="flex gap-1.5 flex-wrap justify-end pl-3">
          {chips.map((chip) => (
            <span
              key={chip}
              className="px-2 py-0.5 rounded-full border border-[#4caf80]/30 text-[#4caf80] bg-[#4caf80]/06 text-[0.6rem] font-mono whitespace-nowrap"
            >
              {chip}
            </span>
          ))}
        </span>
      )}

      {/* Chevron */}
      {!isLocked && (
        <span className={`flex-shrink-0 text-[#555] text-[0.55rem] transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`}>
          ▼
        </span>
      )}
    </button>
  );
}
