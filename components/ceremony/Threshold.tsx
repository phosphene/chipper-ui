/**
 * Threshold — T-269
 *
 * Stage VI. Dark full-screen panel. The marked crossing into judgment space.
 * 3–5s of stillness. Sigil. "Your work is entering judgment." Single proceed button.
 *
 * SoC: zero business logic. onProceed calls store.crossThreshold() from parent.
 */
'use client';

interface Props {
  onProceed: () => void;
}

export function Threshold({ onProceed }: Props) {
  return (
    <div data-testid="threshold" className="
      flex flex-col items-center justify-center min-h-screen text-center
      bg-[#070707] px-6
    ">
      <p className="
        font-mono text-[0.55rem] tracking-[0.35em] uppercase
        text-white/20 mb-12
      ">
        VI · The Threshold
      </p>

      {/* Sigil */}
      <div className="
        w-14 h-14 rounded-full border-[1.5px] border-[#4f8ef5]/35
        flex items-center justify-center mb-7
      ">
        <div className="w-7 h-7 rounded-full border border-[#4f8ef5]/35" />
      </div>

      <h2 className="
        text-[1.4rem] font-light text-white/70
        mb-2 tracking-wide
      ">
        Your work is entering judgment.
      </h2>

      <p className="
        text-[0.88rem] italic text-white/30
        max-w-sm leading-relaxed mb-10
      ">
        The intake is complete. What follows is an evaluation —
        a reading of your work from a specific position,
        using the criteria and terms you have agreed to.
      </p>

      <button
        data-testid="threshold-proceed"
          onClick={onProceed}
        className="
          px-7 py-2.5 rounded-md border border-[#4f8ef5]/35
          text-[#4f8ef5]/75 font-mono text-[0.82rem] tracking-wide
          hover:border-[#4f8ef5] hover:text-[#4f8ef5]
          hover:bg-[#4f8ef5]/06 transition-all
        "
      >
        Proceed
      </button>
    </div>
  );
}
