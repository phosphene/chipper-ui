/**
 * ExpectationsScreen — T-335
 *
 * Layer 2 terminal screen: tells the maker what the full journey looks like
 * before they enter the iterative loop (Layer 3). Light mode — this is still
 * the intake layer, not the dark ceremony.
 *
 * Four numbered expectation cards, a primary CTA, and a reassurance line.
 * Pure presentation — no business logic. Receives a single callback.
 */

'use client';

interface Props {
  onBegin: () => void;
}

const EXPECTATIONS = [
  'You will evaluate, review, and develop your work in iterations. Each iteration is recorded. You can run this loop as many times as you need.',
  'Woodchipper will prompt you to look for things that need refinement\u2009—\u2009based on what the evaluation found, on what comparable works show, and on what the instrument can and can\u2019t see.',
  'You are the final judge of when the work is ready. When you decide it is ready, you pass through a confirmation step before anything is published or registered.',
  'Every step is recorded against your work\u2019s permanent address. Nothing is overwritten. The trajectory is the record.',
] as const;

export function ExpectationsScreen({ onBegin }: Props) {
  return (
    <div
      data-testid="expectations-screen"
      className="w-full max-w-2xl mx-auto py-8"
    >
      {/* Section header */}
      <p className="font-mono text-[0.65rem] tracking-[0.25em] uppercase text-[#1a5fd4]/60 mb-8">
        Before you begin
      </p>

      {/* Expectation cards */}
      <div className="flex flex-col gap-5">
        {EXPECTATIONS.map((text, i) => (
          <div
            key={i}
            data-testid={`expectation-${i + 1}`}
            className="relative rounded-xl border border-[#e0e0e0] bg-white px-6 py-5 pl-16"
          >
            {/* Number indicator */}
            <span
              className="absolute left-5 top-5 font-mono text-[1.75rem] font-semibold leading-none text-[#1a5fd4]/20 select-none"
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Statement */}
            <p className="text-[#1a1a1a] text-[0.95rem] leading-relaxed">
              {text}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <button
          data-testid="expectations-begin"
          onClick={onBegin}
          className="px-8 py-3 rounded-xl bg-[#1a5fd4] text-white text-sm font-mono tracking-wide
            hover:bg-[#1550b8] active:bg-[#124aaa] transition-colors"
        >
          I understand — begin
        </button>

        <p className="mt-3 text-[0.78rem] text-[#999]">
          You can return to this at any time.
        </p>
      </div>
    </div>
  );
}
