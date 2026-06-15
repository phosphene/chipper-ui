'use client';
interface Props {
  canAdvance: boolean; onAdvance: () => void; onBack?: () => void;
  advanceLabel?: string; showBack?: boolean;
  testidPrefix?: string; // e.g. "stage-I" → buttons get data-testid="stage-I-advance" / "stage-I-back"
}
export function StageNav({ canAdvance, onAdvance, onBack, advanceLabel = 'Confirm & Continue →', showBack = true, testidPrefix }: Props) {
  return (
    <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/07">
      {showBack && onBack
        ? <button
            onClick={onBack}
            data-testid={testidPrefix ? `${testidPrefix}-back` : undefined}
            className="px-4 py-2 border border-white/10 rounded-md text-[#888] text-[0.78rem] font-mono hover:border-white/20 hover:text-[#888] transition-all">
            ← Back
          </button>
        : <span />}
      <button
        onClick={onAdvance}
        disabled={!canAdvance}
        aria-disabled={!canAdvance}
        data-testid={testidPrefix ? `${testidPrefix}-advance` : undefined}
        className="px-5 py-2 bg-[#4f8ef5] text-white rounded-md text-[0.82rem] font-mono tracking-wide disabled:opacity-35 hover:opacity-85 transition-opacity">
        {advanceLabel}
      </button>
    </div>
  );
}
