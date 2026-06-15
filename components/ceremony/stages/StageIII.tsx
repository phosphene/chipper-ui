/**
 * Stage III — Judge Identification (T-268)
 * SoC: zero logic. Shows evaluation profile, confidence bars, limitations.
 */
'use client';
import { useCeremonyStore } from '@/store/ceremony';
import { StageNav } from '../StageNav';

export function StageIII() {
  const store = useCeremonyStore();
  const judge = store.judgeIdentity;

  return (
    <div>
      <div className="epigraph">
        Before debate can proceed, interlocutors must agree on which means of knowledge are valid.
        <span className="attr">— Indian pramāṇa tradition</span>
      </div>

      <div className="mb-3">
        <InfoCard label="Domain" value={judge?.domain.value ?? '—'} />
        <InfoCard label="Instrument" value="Nine dimensions · 0–100" />
        <InfoCard
          label="Domain Variant"
          value={judge?.variantAvailable ? (judge.variantName ?? 'Available') : 'General variant — no domain-specific calibration available'}
          note={judge?.variantAvailable ? undefined : 'The general evaluation criteria will apply. This may affect the Predictive Power (P) dimension.'}
        />
      </div>

      <p className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#888] mb-2">Our Confidence</p>
      <ConfidenceBar label="Content understanding" fill={82} level="high" display="High" />
      <ConfidenceBar label="Comparable papers scored" fill={45} level="med" display={`${judge ? '7' : '0'} / 50`} />
      <ConfidenceBar label="Domain variant coverage" fill={15} level="low" display="General" />

      <div className="mt-3 space-y-2">
        <LimNotice kind="tool">
          No {judge?.domain.value ?? 'domain'}-specific variant yet. The general evaluation variant applies. This has a fix — the variant can be derived.
        </LimNotice>
        <LimNotice kind="universe">
          Some work types score structurally lower on certain dimensions by design — not an instrument failure.
        </LimNotice>
      </div>

      <StageNav canAdvance={true} advanceLabel="Acknowledged →" onAdvance={() => store.advanceStage()} onBack={() => store.backStage()} />
    </div>
  );
}

function InfoCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="mb-2 p-3 rounded-md bg-[#191919] border border-white/08">
      <p className="font-mono text-[0.58rem] tracking-[0.15em] uppercase text-[#888] mb-1">{label}</p>
      <p className="text-[13px] text-[#e2e2e2]">{value}</p>
      {note && <p className="text-[0.72rem] text-[#444] italic mt-1">{note}</p>}
    </div>
  );
}

function ConfidenceBar({ label, fill, level, display }: { label: string; fill: number; level: 'high'|'med'|'low'; display: string }) {
  const colors = { high: 'bg-[#4caf80]', med: 'bg-[#f5a623]', low: 'bg-[#4f8ef5]' };
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-[#191919] border border-white/08 rounded-md mb-1.5">
      <span className="text-[0.72rem] font-mono text-[#888] min-w-[150px]">{label}</span>
      <div className="flex-1 h-[3px] bg-white/07 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colors[level]}`} style={{ width: `${fill}%` }} />
      </div>
      <span className="font-mono text-[0.7rem] text-[#888] min-w-[40px] text-right">{display}</span>
    </div>
  );
}

function LimNotice({ kind, children }: { kind: 'tool'|'universe'; children: React.ReactNode }) {
  const styles = {
    tool:    'bg-[#4f8ef5]/05 border-l-[#4f8ef5]/40',
    universe:'bg-[#e05252]/05 border-l-[#e05252]/40',
  };
  const labels = { tool: 'Tool Limitation', universe: 'Universe Limitation' };
  return (
    <div className={`p-3 rounded-r-md border-l-2 text-[0.78rem] text-[#888] ${styles[kind]}`}>
      <p className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#888] mb-1">{labels[kind]}</p>
      {children}
    </div>
  );
}
