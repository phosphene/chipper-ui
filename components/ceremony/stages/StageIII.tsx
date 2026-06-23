'use client';
/** Beat III — Judge Identification. Instrument, domain variant, and confidence named. */
import { useCeremonyStore } from '@/store/ceremony';
import { StageNav } from '../StageNav';

export function StageIII() {
  const store = useCeremonyStore();
  const decl = store.makerDeclaration;
  const wc = store.workClassification;

  // Always can advance — no consent checkbox, just Proceed
  const canAdvance = true;

  return (
    <div data-testid="stage-III">

      {/* Context — what Woodchipper read */}
      {(decl?.standing?.value || wc?.workType?.value) && (
        <div className="mb-5 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed">
          {decl?.standing?.value && (
            <span>You are a <strong>{decl.standing.value.replace(/-/g, ' ')}</strong></span>
          )}
          {wc?.workType?.value && (
            <span> bringing a <strong>{wc.workType.value.replace(/-/g, ' ')}</strong></span>
          )}
          {decl?.tradition?.value && (
            <span> in <strong>{decl.tradition.value}</strong></span>
          )}
          <span>.</span>
        </div>
      )}

      {/* What Woodchipper can help with */}
      <div className="mb-5 p-4 rounded-xl border border-gray-200">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          What Woodchipper can help with
        </p>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2"><span className="text-gray-400">·</span> Evaluating the clarity and strength of your argument</li>
          <li className="flex gap-2"><span className="text-gray-400">·</span> Identifying where your evidence and claims align or diverge</li>
          <li className="flex gap-2"><span className="text-gray-400">·</span> Situating your work in relation to comparable work</li>
          <li className="flex gap-2"><span className="text-gray-400">·</span> Pointing to areas for development and refinement</li>
        </ul>
      </div>

      {/* Honest note about limits */}
      <div className="mb-5 p-4 rounded-xl bg-gray-50 text-sm text-gray-600 leading-relaxed">
        Woodchipper assists all kinds of intellectual work — but some better than others.
        The more you engage with it, and the more you share about your work, the more useful the results will be.
      </div>

      <StageNav
        canAdvance={canAdvance}
        advanceLabel="Proceed →"
        onAdvance={() => store.advanceStage()}
        onBack={() => store.backStage()}
        testidPrefix="stage-III"
      />
    </div>
  );
}
