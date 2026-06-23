'use client';
/** Beat V — The Resting. The maker closes their case: "I have said what I have to say." */
import { useCeremonyStore } from '@/store/ceremony';

export function StageV({ onRested }: { onRested: () => void }) {
  const store = useCeremonyStore();

  const summaryItems = [
    store.makerDeclaration?.standing.value &&
      `${store.makerDeclaration.standing.value.replace(/-/g, ' ')}${store.makerDeclaration.tradition.value ? ` · ${store.makerDeclaration.tradition.value}` : ''}`,
    store.workClassification?.workType.value &&
      store.workClassification.workType.value.replace(/-/g, ' '),
  ].filter(Boolean) as string[];

  return (
    <div data-testid="stage-V">

      {/* Summary */}
      {summaryItems.length > 0 && (
        <div className="mb-5 p-4 rounded-xl border border-gray-200 space-y-2">
          {summaryItems.map((line, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="w-4 h-4 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-500 text-[0.5rem] flex-shrink-0">✓</span>
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Optional last word */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
          Anything else? <span className="normal-case font-normal">(optional)</span>
        </label>
        <textarea
          data-testid="stage-V-last-word"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 resize-y"
          style={{ minHeight: '72px' }}
          value={store.frameAgreement?.lastWord ?? ''}
          onChange={(e) => store.updateLastWord(e.target.value)}
          placeholder="Is there anything the evaluation should know that isn't in the submitted material?"
        />
      </div>

      <div className="text-center py-4">
        <button
          data-testid="stage-V-rest"
          onClick={() => { store.rest(); onRested(); }}
          className="px-10 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Begin Evaluation →
        </button>
      </div>
    </div>
  );
}
