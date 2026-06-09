/**
 * AccordionStage — T-267
 *
 * Single accordion item wrapping a ceremony stage.
 * Manages open/closed animation; delegates all state to ceremony store.
 *
 * SoC: zero business logic.
 * - open/done/locked determined by parent via selectors
 * - Back/advance buttons call store actions, not local state
 */

'use client';

import { StageHeader } from './StageHeader';

interface Props {
  stepNum: string;
  stageLabel: string;
  title: string;
  chips: string[];
  isActive: boolean;
  isDone: boolean;
  isLocked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function AccordionStage({
  stepNum, stageLabel, title, chips,
  isActive, isDone, isLocked, onToggle, children,
}: Props) {
  return (
    <div className={`
      rounded-lg overflow-hidden mb-2 border transition-colors duration-200
      ${isActive  ? 'border-[#4f8ef5]/45' : ''}
      ${isDone    ? 'border-[#4caf80]/25 opacity-70' : ''}
      ${isLocked  ? 'border-white/05 opacity-35 pointer-events-none' : ''}
      ${!isActive && !isDone && !isLocked ? 'border-white/08' : ''}
    `}>
      <StageHeader
        stepNum={stepNum}
        stageLabel={stageLabel}
        title={title}
        chips={chips}
        isActive={isActive}
        isDone={isDone}
        isLocked={isLocked}
        onClick={onToggle}
      />

      {/* Body — only rendered when active */}
      {isActive && (
        <div className="border-t border-white/07">
          <div className="px-[18px] py-[16px]">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
