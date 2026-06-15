/**
 * Stage II — Work Classification (T-268)
 * SoC: zero logic. Selection updates store. Cascade: work type → Stage III explanation.
 */
'use client';
import { useCeremonyStore } from '@/store/ceremony';
import { StageNav } from '../StageNav';
import type { WorkType } from '@/store/ceremony.types';

const WORK_TYPES: { value: WorkType; label: string; desc: string }[] = [
  { value: 'null-result',    label: 'Null Result',    desc: 'Evidence for absence. Higher evidential standard on E and M.' },
  { value: 'original-argument', label: 'Original Argument', desc: 'New claim with supporting evidence. All nine dimensions apply.' },
  { value: 'replication',   label: 'Replication',    desc: 'Fidelity assessment. Novelty structurally depressed.' },
  { value: 'synthesis-review', label: 'Synthesis / Review', desc: 'Argument from accumulated evidence.' },
  { value: 'methodological-contribution', label: 'Methodological', desc: 'New procedure or instrument.' },
  { value: 'evidentiary-finding', label: 'Evidentiary Finding', desc: 'No full argument; contribution to evidence base.' },
];

export function StageII() {
  const store = useCeremonyStore();
  const selected = store.workClassification?.workType.value;
  const canAdvance = !!selected && selected !== 'unknown';

  return (
    <div data-testid="stage-II">
      <div className="epigraph">
        The praetor classifies the claim into a formula before it reaches the judge.
        <span className="attr">— Roman formula system</span>
      </div>

      <div className="field-group">
        <label className="field-label">Describe your work</label>
        <textarea
          data-testid="stage-II-description"
          rows={2}
          className="ceremony-input"
          value={store.workClassification?.description ?? ''}
          onChange={(e) => store.updateWorkClassification({ description: e.target.value })}
          placeholder="This paper presents the first controlled test of…"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {WORK_TYPES.map(({ value, label, desc }) => (
          <button
            key={value}
            data-testid={`work-type-${value}`}
            aria-pressed={selected === value}
            onClick={() => store.updateWorkClassification({ workType: { value, source: 'user' } })}
            className={`text-left p-4 rounded-md border-[1.5px] transition-all
              ${selected === value
                ? 'border-[#4f8ef5] bg-[#4f8ef5]/06'
                : 'border-white/08 hover:border-white/20 bg-[#191919]'}`}
          >
            <p className={`text-[0.82rem] font-semibold mb-1 ${selected === value ? 'text-[#4f8ef5]' : 'text-[#e2e2e2]'}`}>{label}</p>
            <p className="text-[0.72rem] text-[#888] leading-tight">{desc}</p>
          </button>
        ))}
      </div>

      <button
        data-testid="work-type-none"
        className="w-full py-3 border border-dashed border-white/10 rounded-md text-[0.88rem] text-[#888] hover:border-white/20 hover:text-[#888] transition-all mb-3">
        None of these describe my work
      </button>

      {selected && selected !== 'unknown' && (
        <div className="p-3 rounded-md bg-[#4f8ef5]/04 border border-[#4f8ef5]/20 mb-2">
          <p className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#4f8ef5] mb-1">What this classification means</p>
          <p className="text-[0.88rem] text-[#888]">
            As a <strong className="text-[#e2e2e2]">{selected.replace(/-/g, ' ')}</strong>, this activates the inferential practice whose norms apply.
          </p>
        </div>
      )}

      <StageNav canAdvance={canAdvance} onAdvance={() => store.advanceStage()} onBack={() => store.backStage()} testidPrefix="stage-II" />
    </div>
  );
}
