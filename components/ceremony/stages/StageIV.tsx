/**
 * Stage IV — Frame Agreement (T-268)
 * SoC: consent gate via isConsentComplete selector. Right of refusal always present.
 */
'use client';
import { useCeremonyStore } from '@/store/ceremony';
import { isConsentComplete } from '@/store/ceremony.selectors';

export function StageIV({ onDecline }: { onDecline: () => void }) {
  const store = useCeremonyStore();
  const state = useCeremonyStore.getState();
  const consentReady = isConsentComplete(state);

  const decl = store.makerDeclaration;
  const wc = store.workClassification;

  return (
    <div>
      <div className="epigraph">
        Once <em>litis contestatio</em> occurs, the claim is fixed. The agreement to the frame is binding.
        <span className="attr">— Roman formula system</span>
      </div>

      {/* Recitation */}
      <div className="mb-4 p-4 rounded-md bg-[#191919] border border-white/08 text-[0.88rem] text-[#888] leading-[1.8]">
        {decl && wc ? (
          <p>
            You are a <strong className="text-[#e2e2e2]">{decl.standing.value.replace(/-/g, ' ')}</strong> bringing a{' '}
            <strong className="text-[#e2e2e2]">{wc.workType.value.replace(/-/g, ' ')}</strong>
            {decl.tradition.value ? <> in <strong className="text-[#e2e2e2]">{decl.tradition.value}</strong></> : ''}.
            The WCI v1.0 general variant applies. Evidence Density and Claim-Evidence Match carry primary weight.
          </p>
        ) : (
          <p className="text-[#555] italic">Complete the intake stages to generate your summary.</p>
        )}
      </div>

      {/* What the frame recognizes */}
      <div className="mb-2 p-3 rounded-md border-l-2 border-l-[#4caf80]/50 bg-[#4caf80]/03">
        <p className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#4caf80]/60 mb-1">The frame will recognize</p>
        <p className="text-[0.85rem] text-[#888]">
          Rigor of methodology · Evidence quality · Honest calibration of claims · Literature engagement · Boundary conditions
        </p>
      </div>

      <div className="mb-4 p-3 rounded-md border-l-2 border-l-[#e05252]/50 bg-[#e05252]/03">
        <p className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#e05252]/60 mb-1">The frame may not fully recognize</p>
        <p className="text-[0.85rem] text-[#888]">
          Field-specific prediction forms · The particular value of this contribution to its programme · Your standing within your specific community
        </p>
      </div>

      {/* Consent */}
      <div className="p-4 rounded-md bg-[#191919] border border-white/08 mb-4 space-y-3">
        <ConsentCheck
          id="jc1"
          checked={store.frameAgreement?.consent1 ?? false}
          onChange={(v) => store.updateConsent('consent1', v)}
          label="I've seen what this evaluation will and won't recognize about my work, and I want to proceed on these terms."
        />

      </div>

      <div className="flex justify-between items-center pt-3 border-t border-white/07">
        <button
          onClick={onDecline}
          className="px-4 py-2 border border-[#e05252]/35 rounded-md text-[#e05252] text-[0.78rem] font-mono hover:border-[#e05252] transition-colors"
        >
          I Decline — Exit Evaluation
        </button>
        <button
          onClick={() => store.advanceStage()}
          disabled={!consentReady}
          className="px-6 py-2.5 bg-[#4f8ef5] text-white rounded-md text-[0.85rem] font-mono tracking-wide disabled:opacity-35 hover:opacity-85 transition-opacity"
        >
          Enter Judgment ⚖
        </button>
      </div>
    </div>
  );
}

function ConsentCheck({ id, checked, onChange, label }: {
  id: string; checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox" id={id} checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-[17px] h-[17px] accent-[#4f8ef5] flex-shrink-0"
      />
      <span className="text-[0.85rem] text-[#888] leading-snug">{label}</span>
    </label>
  );
}
