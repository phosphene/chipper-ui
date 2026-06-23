'use client';
/**
 * Stage2 — Maker declaration + Work classification.
 *
 * Appears after Stage 1 Proceed is clicked. Two parts:
 *
 * PART A — "About you"
 *   "I am a:" — Student / Scholar / Practitioner (single select pills)
 *   "I am the:" — Sole creator / Co-creator / LLM / LLM-assisted creator (single select pills)
 *
 * PART B — "About your work"
 *   Domain display — pre-filled from Stage 1 domain selection, editable
 *   Work type — 6 options (single select pills/cards) + "None of these" escape
 *
 * Proceed button at bottom — active when at least one role AND one work type selected.
 *
 * T-391
 */

import { useState, useCallback } from 'react';
import type { SelectedDomain } from '@/components/entry/DomainPicker';

// ── Maker role options ───────────────────────────────────────

export type MakerRole = 'student' | 'scholar' | 'practitioner';

const MAKER_ROLE_OPTIONS: { value: MakerRole; label: string; testId: string }[] = [
  { value: 'student', label: 'Student', testId: 'maker-role-student' },
  { value: 'scholar', label: 'Scholar', testId: 'maker-role-scholar' },
  { value: 'practitioner', label: 'Practitioner', testId: 'maker-role-practitioner' },
];

// ── Creator type options ─────────────────────────────────────

export type CreatorType = 'sole' | 'co-creator' | 'llm' | 'llm-assisted';

const CREATOR_TYPE_OPTIONS: { value: CreatorType; label: string; testId: string }[] = [
  { value: 'sole', label: 'Sole creator', testId: 'maker-creator-sole' },
  { value: 'co-creator', label: 'Co-creator', testId: 'maker-creator-co-creator' },
  { value: 'llm', label: 'LLM', testId: 'maker-creator-llm' },
  { value: 'llm-assisted', label: 'LLM-assisted creator', testId: 'maker-creator-llm-assisted' },
];

// ── Work type options ────────────────────────────────────────

export type WorkTypeValue =
  | 'original-argument'
  | 'null-result'
  | 'replication'
  | 'synthesis-review'
  | 'methodological'
  | 'evidentiary'
  | 'none';

const WORK_TYPE_OPTIONS: { value: WorkTypeValue; label: string; testId: string }[] = [
  { value: 'original-argument', label: 'Original Argument', testId: 'work-type-original-argument' },
  { value: 'null-result', label: 'Null Result', testId: 'work-type-null-result' },
  { value: 'replication', label: 'Replication', testId: 'work-type-replication' },
  { value: 'synthesis-review', label: 'Synthesis or Review', testId: 'work-type-synthesis-review' },
  { value: 'methodological', label: 'Methodological Contribution', testId: 'work-type-methodological' },
  { value: 'evidentiary', label: 'Evidentiary Finding', testId: 'work-type-evidentiary' },
];

const WORK_TYPE_NONE = { value: 'none' as WorkTypeValue, label: 'None of these describe my work', testId: 'work-type-none' };

// ── Props ────────────────────────────────────────────────────

export interface Stage2Props {
  /** Domains selected in Stage 1, pre-filled into display */
  selectedDomains: SelectedDomain[];
  /** Callback when Stage 2 Proceed is clicked */
  onProceed: (data: Stage2Data) => void;
}

export interface Stage2Data {
  makerRole: MakerRole;
  creatorType: CreatorType;
  workType: WorkTypeValue;
  domains: SelectedDomain[];
}

// ── Component ────────────────────────────────────────────────

export function Stage2({ selectedDomains, onProceed }: Stage2Props) {
  const [makerRole, setMakerRole] = useState<MakerRole | null>(null);
  const [creatorType, setCreatorType] = useState<CreatorType | null>(null);
  const [workType, setWorkType] = useState<WorkTypeValue | null>(null);

  const canProceed = makerRole !== null && workType !== null;

  const handleProceed = useCallback(() => {
    if (!canProceed || !makerRole || !workType) return;
    onProceed({
      makerRole,
      creatorType: creatorType ?? 'sole',
      workType,
      domains: selectedDomains,
    });
  }, [canProceed, makerRole, creatorType, workType, selectedDomains, onProceed]);

  return (
    <div data-testid="stage2" className="space-y-8">
      {/* ── PART A: About you ── */}
      <section className="space-y-5">
        <h2 className="text-xl font-light text-black leading-tight">About you</h2>

        {/* I am a: role pills */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600">I am a:</p>
          <div className="flex flex-wrap gap-2">
            {MAKER_ROLE_OPTIONS.map(({ value, label, testId }) => (
              <button
                key={value}
                data-testid={testId}
                onClick={() => setMakerRole(value)}
                className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all
                  ${makerRole === value
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* I am the: creator type pills */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600">I am the:</p>
          <div className="flex flex-wrap gap-2">
            {CREATOR_TYPE_OPTIONS.map(({ value, label, testId }) => (
              <button
                key={value}
                data-testid={testId}
                onClick={() => setCreatorType(value)}
                className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all
                  ${creatorType === value
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── PART B: About your work ── */}
      <section className="space-y-5">
        <h2 className="text-xl font-light text-black leading-tight">About your work</h2>

        {/* Domain display — pre-filled from Stage 1 */}
        {selectedDomains.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Domain</p>
            <div data-testid="stage2-domain-display" className="flex flex-wrap gap-2">
              {selectedDomains.map(d => (
                <span
                  key={d.entry.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {d.entry.label}
                  {d.subtopic !== 'General' && (
                    <span className="text-gray-400 text-xs">· {d.subtopic}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Work type pills */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600">What type of work is this?</p>
          <div className="flex flex-wrap gap-2">
            {WORK_TYPE_OPTIONS.map(({ value, label, testId }) => (
              <button
                key={value}
                data-testid={testId}
                onClick={() => setWorkType(value)}
                className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all
                  ${workType === value
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Escape option */}
          <button
            data-testid={WORK_TYPE_NONE.testId}
            onClick={() => setWorkType('none')}
            className={`mt-1 px-4 py-2 rounded-lg border text-xs transition-all
              ${workType === 'none'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
          >
            {WORK_TYPE_NONE.label}
          </button>
        </div>
      </section>

      {/* ── Proceed button ── */}
      <button
        data-testid="stage2-proceed"
        onClick={handleProceed}
        disabled={!canProceed}
        className={`w-full py-4 rounded-xl text-sm font-medium transition-all
          ${canProceed
            ? 'bg-gray-900 text-white hover:bg-gray-700 cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
      >
        Proceed →
      </button>
    </div>
  );
}
