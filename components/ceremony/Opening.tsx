'use client';
/**
 * Opening — Formal Review welcome screen.
 *
 * The very first screen the user sees when entering the WCI ceremony,
 * before Beat I (Maker Declaration). Solemn, full-screen.
 *
 * Palette: beige ground, gold trim, walnut — American justice aesthetic.
 * Federal courthouse, dark wood, parchment, brass.
 *
 * Copy prescribed by INTERFACE-ALIGNMENT.md §17.
 * "Presided" removed — the word is wrong. The register is formal, not legal.
 *
 * SoC: zero business logic. onBegin triggers store.acknowledgeOpening()
 * from parent.
 */

interface Props {
  onBegin: () => void;
}

export function Opening({ onBegin }: Props) {
  return (
    <div
      data-testid="opening"
      style={{ backgroundColor: '#f5f0e8' }}
      className="flex flex-col items-center justify-center min-h-screen text-center px-6"
    >
      {/* Walnut rule — top */}
      <div
        style={{ backgroundColor: '#5c3d1e', height: '4px', width: '60px' }}
        className="mb-12"
      />

      {/* Tag */}
      <p
        style={{ color: '#8b7355', letterSpacing: '0.35em' }}
        className="font-mono text-[0.55rem] uppercase mb-10"
      >
        Formal Review of Scholarly Work
      </p>

      {/* Body copy */}
      <div className="max-w-lg space-y-6 mb-12">
        <p style={{ color: '#2c1f0e' }} className="text-[1.1rem] leading-relaxed">
          You have chosen to submit your work for review.
        </p>

        <p style={{ color: '#3d2b12' }} className="text-[1.05rem] leading-relaxed">
          That choice is yours. No one required you to be here. The fact that
          you came — that you brought your work to be examined — is an act
          this process takes seriously.
        </p>

        <p style={{ color: '#3d2b12' }} className="text-[1.05rem] leading-relaxed">
          The evaluation you are about to receive is the product of careful
          study. The instrument was built with care. The criteria were derived
          from the scholarly record. What follows will be conducted with the
          same seriousness you brought to the work itself.
        </p>
      </div>

      {/* Gold trim rule */}
      <div
        style={{ backgroundColor: '#c9a84c', height: '1px', width: '120px' }}
        className="mb-10"
      />

      {/* Begin button */}
      <button
        data-testid="opening-begin"
        onClick={onBegin}
        style={{
          borderColor: '#c9a84c',
          color: '#8b6914',
          backgroundColor: 'transparent',
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(201,168,76,0.10)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#8b6914';
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#c9a84c';
        }}
        className="px-8 py-3 rounded-sm border font-mono text-[0.82rem] tracking-wide transition-all"
      >
        I am ready to begin →
      </button>

      {/* Walnut rule — bottom */}
      <div
        style={{ backgroundColor: '#5c3d1e', height: '4px', width: '60px' }}
        className="mt-12"
      />
    </div>
  );
}
