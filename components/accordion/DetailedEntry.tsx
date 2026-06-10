/**
 * DetailedEntry — T-267 (updated with complexity depth)
 *
 * Five nested accordion sections with progressive disclosure.
 * Basic → Standard → Advanced depth within each section.
 *
 * SoC: all business logic via selectors. Components render store state.
 * Depth labels: Basic (always visible), Standard (expanded), Advanced (nested deeper).
 */

'use client';
import { useState } from 'react';
import { useCeremonyStore } from '@/store/ceremony';
import {
  canAdvanceFromCurrent,
  isConsentComplete,
  getStageSummaryChips,
} from '@/store/ceremony.selectors';
import { AccordionStage } from './AccordionStage';
import { DepthLabel } from '@/components/ui/DepthLabel';
import type { WorkType } from '@/store/ceremony.types';

interface Props {
  onCeremonyStart: () => void;
}

const WORK_TYPES: { value: WorkType; label: string; desc: string }[] = [
  { value: 'null-result',    label: 'Null Result',    desc: 'Evidence for absence. Higher E and M weight.' },
  { value: 'original-argument', label: 'Original Argument', desc: 'New claim with supporting evidence.' },
  { value: 'replication',   label: 'Replication',    desc: 'Fidelity assessment. N structurally depressed.' },
  { value: 'synthesis-review', label: 'Synthesis / Review', desc: 'Argument from accumulated evidence.' },
  { value: 'methodological-contribution', label: 'Methodological', desc: 'New procedure or instrument.' },
  { value: 'evidentiary-finding', label: 'Evidentiary', desc: 'Contribution to evidence base.' },
];

const EPISTEMIC_TAGS = [
  'Pre-registered', 'Peer-reviewed draft', 'Unpublished',
  'Under review', 'Interdisciplinary', 'Contested domain',
];

export function DetailedEntry({ onCeremonyStart }: Props) {
  const store = useCeremonyStore();
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [hopes, setHopes] = useState<Set<string>>(new Set());
  const [epTags, setEpTags] = useState<Set<string>>(new Set());

  const toggleTag = (tag: string, setter: (fn: (prev: Set<string>) => Set<string>) => void) => {
    setter(prev => {
      const n = new Set(prev);
      n.has(tag) ? n.delete(tag) : n.add(tag);
      return n;
    });
  };

  // Selectors
  const canAdvance       = canAdvanceFromCurrent(useCeremonyStore.getState());
  const consentDone      = isConsentComplete(useCeremonyStore.getState());
  const stage1Chips      = getStageSummaryChips(useCeremonyStore.getState(), 'I');
  const stage2Chips      = getStageSummaryChips(useCeremonyStore.getState(), 'II');
  const stage3Chips      = getStageSummaryChips(useCeremonyStore.getState(), 'III');
  const stage4Chips      = getStageSummaryChips(useCeremonyStore.getState(), 'IV');

  const isLocked  = (stage: string) => !store.completedStages.has(stage as any) && store.currentStage !== stage;
  const isActive  = (stage: string) => store.currentStage === stage;
  const isDone    = (stage: string) => store.completedStages.has(stage as any);

  const expandAll = () => {
    setExpandedTags(new Set(['what', 'context', 'maker', 'intent', 'labels']));
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <button
        onClick={expandAll}
        className="text-[0.68rem] text-[#4f8ef5] font-mono tracking-wide underline underline-offset-2 mb-3 hover:text-[#e2e2e2] transition-colors"
      >
        Expand all sections
      </button>

      {/* ── ACC 1: WHAT YOU HAVE (Basic) ── */}
      <AccordionStage
        stepNum="·" stageLabel="Basic" title={<>What you have</>}
        chips={store.makerDeclaration?.freeText ? [store.makerDeclaration.freeText.slice(0, 40) + (store.makerDeclaration.freeText.length > 40 ? '…' : '')] : []}
        isActive={isActive('I')} isDone={isDone('I')} isLocked={false}
        onToggle={() => {}}
      >
        <p className="text-[0.78rem] text-[#555] italic mb-3 leading-relaxed">
          Describe your work in your own words. The system reads this and makes its first guesses — you correct anything wrong.
        </p>
        <textarea
          value={store.makerDeclaration?.freeText ?? ''}
          onChange={(e) => store.updateMakerDeclaration({ freeText: e.target.value })}
          rows={4}
          placeholder="Describe what you're working on..."
          className="w-full bg-[#222] border border-white/08 rounded-md px-4 py-3 text-[0.9rem] text-[#e2e2e2] placeholder-[#555] italic outline-none focus:border-white/20 resize-y"
        />

        {/* Standard depth: file attach */}
        <div className="mt-4 pt-3 border-t border-white/07">
          <p className="text-[0.75rem] font-medium text-[#888] mb-2">
            Attach the data you have <DepthLabel level="standard" />
          </p>
          <div className="border border-dashed border-white/12 rounded-md py-4 text-center text-[0.78rem] text-[#555] cursor-pointer hover:border-white/20 hover:text-[#888] transition-all">
            Drop a file, or click to choose
            <span className="block text-[0.65rem] mt-1 opacity-50">PDF · audio · image · CSV · any format</span>
          </div>
        </div>

        <div className="flex justify-end mt-4 pt-3 border-t border-white/07">
          <button onClick={() => store.advanceStage()} disabled={!canAdvance}
            className="px-5 py-2 bg-[#4f8ef5] text-white rounded-md text-[0.82rem] font-mono tracking-wide disabled:opacity-35 hover:opacity-85 transition-opacity">
            Confirm & Continue →
          </button>
        </div>
      </AccordionStage>

      {/* ── ACC 2: CONTEXT (Standard) ── */}
      <AccordionStage
        stepNum="·" stageLabel="Standard" title={<>Context <DepthLabel level="standard" /></>}
        chips={epTags.size > 0 ? [Array.from(epTags).join(', ').slice(0, 40)] : []}
        isActive={false} isDone={false} isLocked={false}
        onToggle={() => {}}
      >
        <p className="text-[0.78rem] text-[#555] italic mb-3 leading-relaxed">
          Information that will help guide the evaluation — prior work, voice, references, constraints.
        </p>
        <div className="border border-dashed border-white/12 rounded-md py-3 text-center text-[0.75rem] text-[#555] cursor-pointer hover:border-white/20 mb-3 transition-all">
          Upload context material
          <span className="block text-[0.65rem] mt-0.5 opacity-50">Notes · references · prior work · voice memos</span>
        </div>
        <textarea rows={2} placeholder="Explain what you've attached, or add context..."
          className="w-full bg-[#222] border border-white/08 rounded-md px-4 py-2 text-[0.85rem] text-[#e2e2e2] placeholder-[#555] italic outline-none focus:border-white/20 resize-y mb-3" />

        {/* Advanced depth: epistemic constraints */}
        <div className="mt-2 pt-3 border-t border-white/07">
          <p className="font-mono text-[0.58rem] tracking-[0.15em] uppercase text-[#555] mb-2">
            Epistemic constraints <DepthLabel level="advanced" />
          </p>
          <div className="flex flex-wrap gap-2">
            {EPISTEMIC_TAGS.map(tag => (
              <button key={tag}
                onClick={() => toggleTag(tag, setEpTags)}
                className={`px-3 py-1 border rounded-full text-[0.7rem] font-mono transition-all
                  ${epTags.has(tag)
                    ? 'border-[#4f8ef5] text-[#4f8ef5] bg-[#4f8ef5]/07'
                    : 'border-white/10 text-[#555] hover:border-white/20 hover:text-[#888]'}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      </AccordionStage>

      {/* ── ACC 3: MAKER IDENTITY (Standard) ── */}
      <AccordionStage
        stepNum="·" stageLabel="Standard" title={<>Maker identity <DepthLabel level="standard" /></>}
        chips={stage1Chips}
        isActive={false} isDone={false} isLocked={false}
        onToggle={() => {}}
      >
        <p className="text-[0.78rem] text-[#555] italic mb-3 leading-relaxed">
          Who you are in relation to this work calibrates expectations — not the criteria, but what fair evaluation looks like.
        </p>
        <div className="mb-3">
          <label className="block font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#555] mb-1.5">Standing</label>
          <select
            value={store.makerDeclaration?.standing.value ?? ''}
            onChange={(e) => store.updateMakerDeclaration({ standing: { value: e.target.value as any, source: 'user' } })}
            className="w-full bg-[#222] border border-white/08 rounded-md px-3 py-2 text-[0.88rem] text-[#e2e2e2] outline-none focus:border-white/20"
          >
            <option value="">— Select —</option>
            <option value="graduate-researcher">Graduate researcher</option>
            <option value="postdoctoral-researcher">Postdoctoral researcher</option>
            <option value="professor">Professor / Senior researcher</option>
            <option value="independent-researcher">Independent researcher</option>
            <option value="practitioner">Practitioner</option>
          </select>
        </div>
        <div className="mb-2">
          <label className="block font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#555] mb-1.5">Tradition / field</label>
          <input type="text"
            value={store.makerDeclaration?.tradition.value ?? ''}
            onChange={(e) => store.updateMakerDeclaration({ tradition: { value: e.target.value, source: 'user' } })}
            placeholder="e.g. Behavioral ecology, Historical linguistics..."
            className="w-full bg-[#222] border border-white/08 rounded-md px-3 py-2 text-[0.88rem] text-[#e2e2e2] placeholder-[#555] outline-none focus:border-white/20"
          />
        </div>

        {/* Advanced depth: intellectual lineage */}
        <div className="mt-3 pt-3 border-t border-white/07">
          <p className="font-mono text-[0.58rem] tracking-[0.15em] uppercase text-[#555] mb-2">
            Intellectual lineage <DepthLabel level="advanced" />
          </p>
          <textarea rows={2} placeholder="Who or what tradition shaped the approach? (optional — for deeper calibration)"
            className="w-full bg-[#222] border border-white/08 rounded-md px-3 py-2 text-[0.82rem] text-[#888] placeholder-[#555] italic outline-none focus:border-white/20 resize-y" />
        </div>
      </AccordionStage>

      {/* ── ACC 4: INTENT (Standard) ── */}
      <AccordionStage
        stepNum="·" stageLabel="Standard" title={<>Intent <DepthLabel level="standard" /></>}
        chips={hopes.size > 0 ? [Array.from(hopes).join(', ').slice(0, 40)] : []}
        isActive={false} isDone={false} isLocked={false}
        onToggle={() => {}}
      >
        <p className="text-[0.78rem] text-[#555] italic mb-3">What do you want to happen to this work?</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {['Understand where it stands','Improve before submission','Get a credibility score','Publish to Observatory','Register a DOI','Submit to a journal','Push to ORCID','Just exploring'].map(h => (
            <button key={h}
              onClick={() => toggleTag(h, setHopes)}
              className={`px-3 py-1.5 border rounded-full text-[0.72rem] transition-all
                ${hopes.has(h)
                  ? 'border-[#79c7f5] text-[#79c7f5] bg-[#79c7f5]/07'
                  : 'border-white/10 text-[#555] hover:border-white/20 hover:text-[#888]'}`}>
              {h}
            </button>
          ))}
        </div>

        {/* Advanced: timeline + stakes */}
        <div className="pt-3 border-t border-white/07">
          <p className="font-mono text-[0.58rem] tracking-[0.15em] uppercase text-[#555] mb-2">
            Timeline & stakes <DepthLabel level="advanced" />
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[0.55rem] tracking-[0.1em] uppercase text-[#555] mb-1">Deadline</label>
              <select className="w-full bg-[#222] border border-white/08 rounded-md px-2 py-1.5 text-[0.8rem] text-[#888] outline-none focus:border-white/20">
                <option value="">No deadline</option>
                <option>Within a week</option>
                <option>Within a month</option>
                <option>This year</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[0.55rem] tracking-[0.1em] uppercase text-[#555] mb-1">Work stage</label>
              <select className="w-full bg-[#222] border border-white/08 rounded-md px-2 py-1.5 text-[0.8rem] text-[#888] outline-none focus:border-white/20">
                <option value="">— Stage —</option>
                <option>Early draft</option>
                <option>Near complete</option>
                <option>Finished, seeking feedback</option>
                <option>Published elsewhere</option>
              </select>
            </div>
          </div>
        </div>
      </AccordionStage>

      {/* ── ACC 5: WORK CLASSIFICATION (leads to ceremony) ── */}
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
              <button key={value}
                onClick={() => store.updateWorkClassification({ workType: { value, source: 'user' } })}
                className={`text-left p-3 rounded-md border-[1.5px] transition-all
                  ${selected ? 'border-[#4f8ef5] bg-[#4f8ef5]/06' : 'border-white/08 hover:border-white/20 bg-[#191919]'}`}>
                <p className={`text-[0.8rem] font-semibold mb-0.5 ${selected ? 'text-[#4f8ef5]' : 'text-[#e2e2e2]'}`}>{label}</p>
                <p className="text-[0.68rem] text-[#555] leading-tight">{desc}</p>
              </button>
            );
          })}
        </div>
        <button className="w-full py-2.5 border border-dashed border-white/10 rounded-md text-[0.82rem] text-[#555] hover:border-white/20 hover:text-[#888] transition-all mb-3">
          None of these describe my work
        </button>

        {/* Frame agreement + resting inline */}
        <div className="mt-2 pt-3 border-t border-white/07">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input type="checkbox"
              checked={store.frameAgreement?.consent1 ?? false}
              onChange={(e) => store.updateConsent('consent1', e.target.checked)}
              className="mt-0.5 w-[16px] h-[16px] accent-[#4f8ef5] flex-shrink-0"
            />
            <span className="text-[0.82rem] text-[#888] leading-snug">
              I've seen what this evaluation will and won't recognize about my work, and I want to proceed on these terms.
            </span>
          </label>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-white/07">
          <button onClick={() => store.backStage()}
            className="px-3 py-2 border border-white/10 rounded-md text-[#555] text-[0.75rem] font-mono hover:border-white/20 hover:text-[#888] transition-all">
            ← Back
          </button>
          <button
            onClick={() => { store.rest(); onCeremonyStart(); }}
            disabled={!consentDone || store.workClassification?.workType.value === 'unknown' || !store.workClassification}
            className="px-6 py-2.5 bg-[#4f8ef5] text-white rounded-md text-[0.82rem] font-mono tracking-wide disabled:opacity-35 hover:opacity-85 transition-opacity">
            Enter Judgment ⚖
          </button>
        </div>
      </AccordionStage>

    </div>
  );
}
