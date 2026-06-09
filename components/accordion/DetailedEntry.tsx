/**
 * DetailedEntry — T-267
 *
 * The full accordion entry. Five intake sections pre-filled from ceremony store.
 * User reviews and corrects; they do not create from scratch.
 *
 * SoC: all business logic via selectors. Components render store state.
 * Pre-fill cascade: correcting work type triggers judgeIdentity explanation update.
 */

'use client';

import { useCeremonyStore } from '@/store/ceremony';
import {
  canAdvanceFromCurrent,
  isConsentComplete,
  getStageSummaryChips,
} from '@/store/ceremony.selectors';
import { AccordionStage } from './AccordionStage';
import type { WorkType } from '@/store/ceremony.types';

interface Props {
  onCeremonyStart: () => void; // called when intake is complete and rest is clicked
}

const WORK_TYPES: { value: WorkType; label: string; desc: string }[] = [
  { value: 'null-result',    label: 'Null Result',    desc: 'Evidence for absence. Higher evidential standard on E and M.' },
  { value: 'original-argument', label: 'Original Argument', desc: 'New claim with supporting evidence. Full WCI applies.' },
  { value: 'replication',   label: 'Replication',    desc: 'Fidelity assessment. Novelty structurally depressed.' },
  { value: 'synthesis-review', label: 'Synthesis / Review', desc: 'Argument from accumulated evidence.' },
  { value: 'methodological-contribution', label: 'Methodological', desc: 'New procedure or instrument.' },
  { value: 'evidentiary-finding', label: 'Evidentiary Finding', desc: 'Contribution to evidence base; no full argument.' },
];

export function DetailedEntry({ onCeremonyStart }: Props) {
  const store = useCeremonyStore();
  const state = useCeremonyStore.getState();

  // Selectors — no logic in JSX
  const canAdvance       = canAdvanceFromCurrent(useCeremonyStore.getState());
  const consentDone      = isConsentComplete(useCeremonyStore.getState());
  const stage1Chips      = getStageSummaryChips(useCeremonyStore.getState(), 'I');
  const stage2Chips      = getStageSummaryChips(useCeremonyStore.getState(), 'II');
  const stage3Chips      = getStageSummaryChips(useCeremonyStore.getState(), 'III');
  const stage4Chips      = getStageSummaryChips(useCeremonyStore.getState(), 'IV');

  const isLocked  = (stage: string) => !store.completedStages.has(stage as any) && store.currentStage !== stage;
  const isActive  = (stage: string) => store.currentStage === stage;
  const isDone    = (stage: string) => store.completedStages.has(stage as any);

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* Stage I — Maker Declaration */}
      <AccordionStage
        stepNum="I" stageLabel="Stage I" title="Maker Declaration"
        chips={stage1Chips}
        isActive={isActive('I')} isDone={isDone('I')} isLocked={isLocked('I')}
        onToggle={() => {}}
      >
        <div className="mb-4">
          <label className="block text-xs font-medium text-[#e2e2e2] mb-1.5">In your own words</label>
          <p className="text-xs text-[#555] italic mb-1.5">Describe yourself in relation to this work.</p>
          <textarea
            value={store.makerDeclaration?.freeText ?? ''}
            onChange={(e) => store.updateMakerDeclaration({ freeText: e.target.value })}
            placeholder="I am a graduate student in behavioral ecology…"
            className="w-full bg-[#222] border border-white/08 rounded-md px-4 py-3 text-[0.92rem] text-[#e2e2e2] placeholder-[#555] italic outline-none focus:border-white/20 resize-y min-h-[90px]"
          />
        </div>

        {store.makerDeclaration && (
          <>
            <SourcedCard
              label="Standing"
              value={store.makerDeclaration.standing.value}
              source={store.makerDeclaration.standing.source}
              note="Calibrates expectations, not criteria."
            />
            <SourcedCard
              label="Tradition / Domain"
              value={store.makerDeclaration.tradition.value}
              source={store.makerDeclaration.tradition.source}
            />
          </>
        )}

        <StageNav
          canAdvance={canAdvance}
          onAdvance={() => store.advanceStage()}
          showBack={false}
        />
      </AccordionStage>

      {/* Stage II — Work Classification */}
      <AccordionStage
        stepNum="II" stageLabel="Stage II" title="Work Classification"
        chips={stage2Chips}
        isActive={isActive('II')} isDone={isDone('II')} isLocked={isLocked('II')}
        onToggle={() => {}}
      >
        <div className="grid grid-cols-2 gap-2 mb-3">
          {WORK_TYPES.map(({ value, label, desc }) => {
            const selected = store.workClassification?.workType.value === value;
            return (
              <button
                key={value}
                onClick={() => store.updateWorkClassification({
                  workType: { value, source: 'user' },
                })}
                className={`
                  text-left p-4 rounded-md border-[1.5px] transition-all
                  ${selected
                    ? 'border-[#4f8ef5] bg-[#4f8ef5]/06'
                    : 'border-white/08 hover:border-white/20 bg-[#191919]'
                  }
                `}
              >
                <p className={`text-[0.82rem] font-semibold mb-1 ${selected ? 'text-[#4f8ef5]' : 'text-[#e2e2e2]'}`}>{label}</p>
                <p className="text-[0.72rem] text-[#555] leading-tight">{desc}</p>
              </button>
            );
          })}
        </div>

        {/* None of the above */}
        <button className="w-full text-center py-3 border border-dashed border-white/10 rounded-md text-[0.88rem] text-[#555] hover:border-white/20 hover:text-[#888] transition-all">
          None of these describe my work
        </button>

        <StageNav
          canAdvance={store.workClassification?.workType.value !== 'unknown' && !!store.workClassification}
          onAdvance={() => store.advanceStage()}
          onBack={() => store.backStage()}
        />
      </AccordionStage>

      {/* Stage III — Judge Identification */}
      <AccordionStage
        stepNum="III" stageLabel="Stage III" title="Judge Identification"
        chips={stage3Chips}
        isActive={isActive('III')} isDone={isDone('III')} isLocked={isLocked('III')}
        onToggle={() => {}}
      >
        {store.judgeIdentity && (
          <>
            <InfoCard label="Domain" value={store.judgeIdentity.domain.value} />
            <InfoCard label="Instrument" value={`WCI v1.0 · Nine dimensions · 0–100`} />
            <div className="mb-3 p-3 rounded-md bg-[#4f8ef5]/04 border border-[#4f8ef5]/15 text-[0.78rem] text-[#888]">
              <span className="block font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#555] mb-1">Tool Limitation</span>
              No domain-specific variant for {store.judgeIdentity.domain.value} yet. General WCI criteria apply.
            </div>
            <div className="mb-4 p-3 rounded-md bg-[#e05252]/05 border border-[#e05252]/20 text-[0.78rem] text-[#888]">
              <span className="block font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#555] mb-1">Universe Limitation</span>
              Some work types score structurally lower on certain dimensions — not an instrument failure.
            </div>
          </>
        )}

        <StageNav
          canAdvance={true}
          advanceLabel="Acknowledged →"
          onAdvance={() => store.advanceStage()}
          onBack={() => store.backStage()}
        />
      </AccordionStage>

      {/* Stage IV — Frame Agreement */}
      <AccordionStage
        stepNum="IV" stageLabel="Stage IV" title="Frame Agreement"
        chips={stage4Chips}
        isActive={isActive('IV')} isDone={isDone('IV')} isLocked={isLocked('IV')}
        onToggle={() => {}}
      >
        <div className="mb-4 p-4 rounded-md bg-[#191919] border border-white/08 text-[0.88rem] text-[#888] leading-relaxed">
          {store.makerDeclaration && store.workClassification && (
            <>
              You are a <strong className="text-[#e2e2e2]">{store.makerDeclaration.standing.value.replace(/-/g, ' ')}</strong> bringing a{' '}
              <strong className="text-[#e2e2e2]">{store.workClassification.workType.value.replace(/-/g, ' ')}</strong>.
              {' '}The WCI v1.0 general variant applies.
            </>
          )}
        </div>

        <div className="mb-4 space-y-2">
          <ConsentCheck
            id="c1"
            checked={store.frameAgreement?.consent1 ?? false}
            onChange={(v) => store.updateConsent('consent1', v)}
            label="I understand what this evaluation will and will not recognize about my work."
          />
          <ConsentCheck
            id="c2"
            checked={store.frameAgreement?.consent2 ?? false}
            onChange={(v) => store.updateConsent('consent2', v)}
            label="I consent to have my work evaluated on these terms."
          />
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/07">
          <button
            onClick={() => store.backStage()}
            className="px-4 py-2 border border-[#e05252]/35 rounded-md text-[#e05252] text-[0.78rem] font-mono hover:border-[#e05252] transition-colors"
          >
            I Decline — Exit
          </button>
          <button
            onClick={() => store.advanceStage()}
            disabled={!consentDone}
            className="px-6 py-2 bg-[#4f8ef5] text-white rounded-md text-[0.82rem] font-mono tracking-wide disabled:opacity-35 hover:opacity-85 transition-opacity"
          >
            Enter Judgment ⚖
          </button>
        </div>
      </AccordionStage>

      {/* Stage V — The Resting */}
      <AccordionStage
        stepNum="V" stageLabel="The Resting" title="Close Your Case"
        chips={isDone('V') ? ['Case closed'] : []}
        isActive={isActive('V')} isDone={isDone('V')} isLocked={isLocked('V')}
        onToggle={() => {}}
      >
        <div className="text-center py-6">
          <p className="text-[0.82rem] text-[#555] italic max-w-sm mx-auto leading-relaxed mb-6">
            I have presented my work. I have accepted the terms of evaluation. I rest my case.
          </p>
          <button
            onClick={() => { store.rest(); onCeremonyStart(); }}
            className="px-7 py-3 bg-[#4f8ef5] text-white rounded-md font-mono text-[0.85rem] tracking-wide hover:opacity-85 transition-opacity"
          >
            I Rest My Case
          </button>
          <p className="mt-3 text-[0.72rem] text-[#444] italic">
            After this point, no modifications until judgment is rendered.
          </p>
        </div>
      </AccordionStage>

    </div>
  );
}

// ── Sub-components (rendering only) ────────────────────────────

function SourcedCard({ label, value, source, note }: {
  label: string; value: string; source: 'detected' | 'user'; note?: string;
}) {
  return (
    <div className="mb-2 p-3 rounded-md bg-[#222] border border-[#4f8ef5]/25 relative">
      <p className="font-mono text-[0.58rem] tracking-[0.15em] uppercase text-[#555] mb-1">{label}</p>
      <p className={`text-[13px] ${source === 'detected' ? 'text-[#4f8ef5]' : 'text-[#e2e2e2]'}`}>
        {value.replace(/-/g, ' ')}
      </p>
      {note && <p className="text-[0.72rem] text-[#444] italic mt-1">{note}</p>}
      <span className="absolute top-2 right-2 font-mono text-[0.55rem] tracking-[0.1em] uppercase text-[#4f8ef5] px-1.5 py-0.5 border border-[#4f8ef5]/30 rounded">
        Edit
      </span>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 p-3 rounded-md bg-[#191919] border border-white/08">
      <p className="font-mono text-[0.58rem] tracking-[0.15em] uppercase text-[#555] mb-1">{label}</p>
      <p className="text-[13px] text-[#e2e2e2]">{value}</p>
    </div>
  );
}

function ConsentCheck({ id, checked, onChange, label }: {
  id: string; checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-[17px] h-[17px] accent-[#4f8ef5] flex-shrink-0"
      />
      <span className="text-[0.85rem] text-[#888] leading-snug">{label}</span>
    </label>
  );
}

function StageNav({ canAdvance, onAdvance, onBack, advanceLabel = 'Confirm & Continue →', showBack = true }: {
  canAdvance: boolean;
  onAdvance: () => void;
  onBack?: () => void;
  advanceLabel?: string;
  showBack?: boolean;
}) {
  return (
    <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/07">
      {showBack && onBack ? (
        <button
          onClick={onBack}
          className="px-4 py-2 border border-white/10 rounded-md text-[#555] text-[0.78rem] font-mono hover:border-white/20 hover:text-[#888] transition-all"
        >
          ← Back
        </button>
      ) : <span />}
      <button
        onClick={onAdvance}
        disabled={!canAdvance}
        className="px-5 py-2 bg-[#4f8ef5] text-white rounded-md text-[0.82rem] font-mono tracking-wide disabled:opacity-35 hover:opacity-85 transition-opacity"
      >
        {advanceLabel}
      </button>
    </div>
  );
}
