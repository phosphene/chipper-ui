/**
 * Stage V — The Resting (T-268)
 * The maker closes their case. The ritual before the uncertain outcome.
 */
'use client';
import { useCeremonyStore } from '@/store/ceremony';

export function StageV({ onRested }: { onRested: () => void }) {
  const store = useCeremonyStore();

  const summary = [
    store.makerDeclaration?.standing.value && `Identity: ${store.makerDeclaration.standing.value.replace(/-/g, ' ')}${store.makerDeclaration.tradition.value ? ` · ${store.makerDeclaration.tradition.value}` : ''}`,
    store.workClassification?.workType.value && `Work: ${store.workClassification.workType.value.replace(/-/g, ' ')}`,
    'Instrument: WCI v1.0, general variant',
    'Frame: Consented',
  ].filter(Boolean) as string[];

  return (
    <div>
      <div className="epigraph">
        The defense rests. The confessions are complete. What follows belongs to the judge.
        <span className="attr">— The universal closing</span>
      </div>

      {/* Case summary */}
      <div className="mb-4 p-4 rounded-md bg-[#191919] border border-white/08 space-y-2">
        {summary.map((line, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-[#4f8ef5]/15 border border-[#4f8ef5]/50 flex items-center justify-center text-[0.55rem] text-[#4f8ef5] flex-shrink-0 mt-0.5">✓</span>
            <span className="text-[0.85rem] text-[#888]">{line}</span>
          </div>
        ))}
      </div>

      {/* Optional last word */}
      <div className="mb-4">
        <label className="field-label">Your last word <span className="font-normal text-[#444]">(optional)</span></label>
        <p className="field-hint">Is there anything the evaluation should know that isn't in the paper?</p>
        <textarea
          className="ceremony-input"
          style={{ minHeight: '72px', borderStyle: 'dashed' }}
          value={store.frameAgreement?.lastWord ?? ''}
          onChange={(e) => store.updateLastWord(e.target.value)}
          placeholder="Optional…"
        />
      </div>

      {/* The resting act */}
      <div className="text-center py-6">
        <p className="text-[0.85rem] text-[#555] italic max-w-sm mx-auto leading-relaxed mb-6">
          I have presented my work. I have accepted the terms of evaluation. I rest my case.
        </p>
        <button
          onClick={() => { store.rest(); onRested(); }}
          className="px-8 py-3 bg-[#4f8ef5] text-white rounded-md font-mono text-[0.85rem] tracking-wide hover:opacity-85 transition-opacity"
        >
          I Rest My Case
        </button>
        <p className="mt-3 text-[0.7rem] text-[#333] italic">
          After this point, no modifications are accepted until judgment is rendered.
        </p>
      </div>
    </div>
  );
}
