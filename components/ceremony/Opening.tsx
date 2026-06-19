/**
 * Opening — Presided Review welcome screen.
 *
 * The very first screen the user sees when entering the WCI ceremony,
 * before Beat I (Maker Declaration). Solemn, full-screen, dark.
 * Copy prescribed by INTERFACE-ALIGNMENT.md §17.
 *
 * SoC: zero business logic. onBegin triggers store.acknowledgeOpening()
 * from parent.
 */
'use client';

interface Props {
  onBegin: () => void;
}

export function Opening({ onBegin }: Props) {
  return (
    <div
      data-testid="opening"
      className="
        flex flex-col items-center justify-center min-h-screen text-center
        bg-[#070707] px-6
      "
    >
      <p className="
        font-mono text-[0.55rem] tracking-[0.35em] uppercase
        text-white/20 mb-14
      ">
        Presided Review
      </p>

      <div className="max-w-lg space-y-6 mb-14">
        <p className="text-white/70 text-[1.1rem] leading-relaxed">
          You have chosen to enter a presided review of your work.
        </p>

        <p className="text-white/70 text-[1.1rem] leading-relaxed">
          That choice is yours. No one required you to be here. The fact that
          you came — that you brought your work to be examined — is an act
          this process takes seriously.
        </p>

        <p className="text-white/70 text-[1.1rem] leading-relaxed">
          The evaluation you are about to receive is the product of careful
          study. The instrument was built with care. The criteria were derived
          from the scholarly record. What follows will be conducted with the
          same seriousness you brought to the work itself.
        </p>
      </div>

      <button
        data-testid="opening-begin"
        onClick={onBegin}
        className="
          px-7 py-2.5 rounded-md border border-[#4f8ef5]/35
          text-[#4f8ef5]/75 font-mono text-[0.82rem] tracking-wide
          hover:border-[#4f8ef5] hover:text-[#4f8ef5]
          hover:bg-[#4f8ef5]/06 transition-all
        "
      >
        I am ready to begin →
      </button>
    </div>
  );
}
