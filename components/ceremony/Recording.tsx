'use client';
/**
 * Beat IX — The Recording
 *
 * The maker chooses what becomes of the judgment. Four choices:
 *   1. View only — no record created
 *   2. Personal portfolio — private, maker's account only
 *   3. Public boards — domain corpus, visible to community
 *   4. WCI indexing — permanent index entry, URI minted (first WCI mention to user)
 *
 * Property selection (boards / Observatory / Zenodo / ORCID) shown when
 * public or WCI indexing is selected. Properties are stubs in v1.
 *
 * Export options always available regardless of recording choice.
 *
 * SoC: zero business logic. All state in ceremony store.
 * WCI indexing is the FIRST time "WCI" appears to the user — intentional.
 */

import { useCeremonyStore } from '@/store/ceremony';
import type { RecordingChoice, Property } from '@/store/ceremony.types';

const CHOICES: {
  value: RecordingChoice;
  title: string;
  desc: string;
  accent?: string;
}[] = [
  {
    value: 'view-only',
    title: 'View Only — Do Not Record',
    desc: 'You have seen the score. It will not be saved anywhere. When you leave, the judgment is gone. You may submit for evaluation again at any time.',
  },
  {
    value: 'private',
    title: 'Record to My Account',
    desc: 'The score is permanently saved to your private record. It appears in your score history and trajectory. Visible only to you. Never overwritten — future evaluations are added alongside it.',
  },
  {
    value: 'public',
    title: 'Record and Submit to the Boards',
    desc: 'The score is saved to your record and submitted to the wider boards — the public corpus where scored work appears alongside comparable evaluations. Your work enters the community of judged work.',
  },
];

const PROPERTIES: {
  id: Property;
  name: string;
  desc: string;
  ours: boolean;
  status: 'available' | 'coming' | 'configure';
}[] = [
  {
    id: 'boards',
    name: 'Woodchipper Boards',
    desc: 'Score + dimension profile visible in domain corpus.',
    ours: true,
    status: 'available',
  },
  {
    id: 'observatory',
    name: 'Observatory.wiki',
    desc: 'Work artifact published as an article. Score travels as a metadata badge. Observatory records the work — Woodchipper records the judgment.',
    ours: true,
    status: 'coming',
  },
  {
    id: 'zenodo',
    name: 'Zenodo / DOI',
    desc: 'Work artifact deposited. WCI score in metadata. Citable DOI minted.',
    ours: false,
    status: 'coming',
  },
  {
    id: 'orcid',
    name: 'ORCID',
    desc: 'Work record pushed to your ORCID profile. Score attached as a linked assertion.',
    ours: false,
    status: 'coming',
  },
];

const EXPORT_FORMATS = [
  { id: 'pdf',      label: 'PDF',      desc: 'Full evaluation report' },
  { id: 'markdown', label: 'Markdown', desc: 'Structured text' },
  { id: 'json',     label: 'JSON',     desc: 'Machine-readable record' },
  { id: 'copy',     label: 'Copy',     desc: 'To clipboard' },
];

function handleExport(format: string) {
  // Stub — real export in later ticket
  if (format === 'copy') {
    navigator.clipboard?.writeText('Export not yet implemented.').catch(() => {});
  }
  console.log(`Export: ${format}`);
}

interface Props {
  onDone: () => void;
}

export function Recording({ onDone }: Props) {
  const store = useCeremonyStore();
  const choice = store.recordingChoice;
  const selectedProps = store.selectedProperties;

  const showProperties = choice === 'public';
  const showWCIIndexing = choice === 'public' || choice === 'private';

  return (
    <div data-testid="recording-beat">
      {/* Epigraph */}
      <div className="epigraph">
        The examination results were posted on the wall of the Hall of Supreme Harmony.
        From that moment, they belonged to the public record. But the candidate chose to sit the exam.
        <span className="attr">— Chinese imperial examination</span>
      </div>

      {/* Title */}
      <div className="mb-5">
        <h2 className="text-[1.1rem] font-normal text-[#e2e2e2] mb-1">What Becomes of This Judgment?</h2>
        <p className="text-[0.82rem] text-[#888] leading-relaxed">
          The score has been rendered. Before it enters the record, you choose what happens to it.
        </p>
      </div>

      {/* The three choices */}
      <div className="space-y-2 mb-5">
        {CHOICES.map((c) => (
          <button
            key={c.value}
            data-testid={`recording-choice-${c.value}`}
            onClick={() => store.setRecordingChoice(c.value)}
            className={`w-full text-left p-4 rounded-md border-[1.5px] transition-all
              ${choice === c.value
                ? 'border-[#4f8ef5] bg-[#4f8ef5]/06'
                : 'border-white/08 hover:border-white/18 bg-[#191919]'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-4 h-4 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center transition-all
                ${choice === c.value ? 'border-[#4f8ef5] bg-[#4f8ef5]' : 'border-white/20'}`}>
                {choice === c.value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div>
                <p className={`text-[0.88rem] font-medium mb-1 ${choice === c.value ? 'text-[#4f8ef5]' : 'text-[#e2e2e2]'}`}>
                  {c.title}
                </p>
                <p className="text-[0.75rem] text-[#888] leading-relaxed">{c.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* What the boards means */}
      {choice === 'public' && (
        <div className="mb-5 p-4 bg-[#191919] border border-white/08 rounded-md text-[0.78rem] text-[#888] leading-relaxed">
          <p className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#888] mb-2">What the boards means</p>
          <p className="mb-2">
            Your score appears in the public corpus alongside other evaluated work of comparable type and domain.
            Other researchers can see that a work of this type in this domain scored at this level with this dimension profile.
            Your work becomes a reference point.
          </p>
          <p className="text-[#555]">
            It is not publication. It is not endorsement. It is a record of judgment from a specific instrument at a specific moment.
            The score is attributed to the instrument, not presented as the field's verdict.
          </p>
        </div>
      )}

      {/* Property selection — public only */}
      {showProperties && (
        <div className="mb-5">
          <p className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#888] mb-3">
            Select where this record goes
          </p>
          <div className="space-y-2">
            {PROPERTIES.map((prop) => {
              const selected = selectedProps.has(prop.id);
              const available = prop.status === 'available';
              return (
                <button
                  key={prop.id}
                  data-testid={`property-${prop.id}`}
                  onClick={() => available && store.toggleProperty(prop.id)}
                  disabled={!available}
                  className={`w-full text-left p-3 rounded-md border transition-all
                    ${!available ? 'opacity-40 cursor-not-allowed border-white/06 bg-[#161616]' :
                      selected ? 'border-[#4caf80]/50 bg-[#4caf80]/04' :
                      'border-white/08 hover:border-white/18 bg-[#191919]'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0
                        ${selected && available ? 'border-[#4caf80] bg-[#4caf80]' : 'border-white/20'}`}>
                        {selected && available && <span className="text-white text-[8px]">✓</span>}
                      </div>
                      <div>
                        <span className={`text-[0.82rem] font-medium ${selected && available ? 'text-[#4caf80]' : 'text-[#e2e2e2]'}`}>
                          {prop.name}
                        </span>
                        {!prop.ours && (
                          <span className="ml-2 font-mono text-[0.55rem] tracking-widest text-[#555] uppercase">external</span>
                        )}
                      </div>
                    </div>
                    <span className={`font-mono text-[0.6rem] tracking-wider px-2 py-0.5 rounded-full border
                      ${prop.status === 'available' ? 'border-[#4caf80]/40 text-[#4caf80]' :
                        prop.status === 'configure' ? 'border-[#f5a623]/40 text-[#f5a623]' :
                        'border-white/10 text-[#555]'}`}>
                      {prop.status}
                    </span>
                  </div>
                  <p className="text-[0.72rem] text-[#555] mt-1.5 leading-snug pl-5">{prop.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* WCI indexing — private or public */}
      {showWCIIndexing && (
        <div className="mb-5 p-4 border border-dashed border-[#4f8ef5]/30 rounded-md bg-[#4f8ef5]/03">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-[#4f8ef5] text-[1rem] flex-shrink-0">⚖</div>
            <div>
              <p className="text-[0.85rem] font-medium text-[#4f8ef5] mb-1">Credibility Indexing</p>
              <p className="text-[0.75rem] text-[#888] leading-relaxed mb-3">
                Your score enters the Woodchipper Credibility Index — a permanent, citable record.
                A URI is minted for this evaluation. The score, dimension profile, rubric version,
                and epistemic basis are preserved in the index indefinitely.
              </p>
              <button
                data-testid="wci-indexing-toggle"
                onClick={() => store.toggleProperty('boards')}
                className="px-4 py-2 border border-[#4f8ef5]/40 rounded-md text-[0.78rem] text-[#4f8ef5] font-mono hover:bg-[#4f8ef5]/08 transition-all"
              >
                {selectedProps.has('boards') ? '✓ Opted in' : 'Opt into WCI indexing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export options — always available */}
      <div className="mb-6 p-4 bg-[#161616] border border-white/06 rounded-md">
        <p className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#555] mb-3">Export this evaluation</p>
        <div className="grid grid-cols-4 gap-2">
          {EXPORT_FORMATS.map((fmt) => (
            <button
              key={fmt.id}
              data-testid={`export-${fmt.id}`}
              onClick={() => handleExport(fmt.id)}
              className="p-2.5 border border-white/08 rounded-md hover:border-white/20 hover:bg-[#1e1e1e] transition-all text-center"
            >
              <p className="font-mono text-[0.65rem] text-[#e2e2e2] mb-0.5">{fmt.label}</p>
              <p className="text-[0.6rem] text-[#555]">{fmt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Confirm */}
      <div className="flex items-center justify-between pt-4 border-t border-white/07">
        <p className="text-[0.75rem] text-[#555] italic">
          {choice === 'view-only'
            ? 'The judgment will not be saved.'
            : choice === 'private'
            ? 'The judgment will be saved to your private record.'
            : choice === 'public'
            ? 'The judgment will be saved and submitted to the boards.'
            : 'Choose how to record this judgment.'}
        </p>
        <button
          data-testid="recording-confirm"
          onClick={onDone}
          disabled={!choice}
          className="px-6 py-2.5 bg-[#4f8ef5] text-white rounded-md text-[0.85rem] font-mono tracking-wide disabled:opacity-30 hover:opacity-85 transition-opacity"
        >
          {choice === 'view-only' ? 'Close' : 'Record →'}
        </button>
      </div>
    </div>
  );
}
