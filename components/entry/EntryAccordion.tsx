/**
 * EntryAccordion — progressive single-form entry replacing Simple/Detailed toggle.
 *
 * Two states: collapsed and expanded.
 * - Collapsed: textarea + file attach + → submit + always-visible file drop zone + expander
 * - Expanded: above + work type buttons + standing buttons + field/tradition input + bottom CTA
 *
 * The file drop zone is ALWAYS visible in both states — key UX finding.
 * One CTA per state: top → when collapsed, bottom Evaluate → when expanded.
 *
 * Store connection:
 * - textarea → store.updateMakerDeclaration({ freeText })
 * - work type → store.updateWorkClassification({ workType })
 * - standing → store.updateMakerDeclaration({ standing })
 * - field/tradition → store.updateMakerDeclaration({ tradition })
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { useDetection } from '@/hooks/useDetection';
import { useCeremonyStore } from '@/store/ceremony';
import { DetectionConfirm } from './DetectionConfirm';
import type { WorkType, MakerStanding } from '@/store/ceremony.types';

interface Props {
  onConfirmed: () => void;
}

const MIN_CHARS = 15;

const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: 'null-result', label: 'Null Result' },
  { value: 'original-argument', label: 'Original Argument' },
  { value: 'replication', label: 'Replication' },
  { value: 'synthesis-review', label: 'Synthesis/Review' },
  { value: 'methodological-contribution', label: 'Methodological' },
  { value: 'evidentiary-finding', label: 'Evidentiary' },
];

const STANDINGS: { value: MakerStanding; label: string }[] = [
  { value: 'graduate-researcher', label: 'Graduate' },
  { value: 'postdoctoral-researcher', label: 'Postdoc' },
  { value: 'professor', label: 'Professor' },
  { value: 'independent-researcher', label: 'Independent' },
  { value: 'practitioner', label: 'Practitioner' },
];

export function EntryAccordion({ onConfirmed }: Props) {
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | null>(null);
  const [selectedStanding, setSelectedStanding] = useState<MakerStanding | null>(null);
  const [tradition, setTradition] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const dropFileRef = useRef<HTMLInputElement>(null);

  const { detect, result, isLoading, error } = useDetection();
  const store = useCeremonyStore();

  const isReady = text.trim().length >= MIN_CHARS;

  // Sync text to store
  const handleTextChange = useCallback((value: string) => {
    setText(value);
    store.updateMakerDeclaration({ freeText: value });
  }, [store]);

  const handleWorkTypeSelect = useCallback((wt: WorkType) => {
    setSelectedWorkType(wt);
    store.updateWorkClassification({ workType: { value: wt, source: 'user' } });
  }, [store]);

  const handleStandingSelect = useCallback((s: MakerStanding) => {
    setSelectedStanding(s);
    store.updateMakerDeclaration({ standing: { value: s, source: 'user' } });
  }, [store]);

  const handleTraditionChange = useCallback((value: string) => {
    setTradition(value);
    store.updateMakerDeclaration({ tradition: { value, source: 'user' } });
  }, [store]);

  const handleSubmit = useCallback(async () => {
    if (text.trim().length < MIN_CHARS || isLoading) return;
    await detect(text);
  }, [text, detect, isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      await detect(text || file.name, base64);
    };
    reader.readAsDataURL(file);
  }, [text, detect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      await detect(text || file.name, base64);
    };
    reader.readAsDataURL(file);
  }, [text, detect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div data-testid="entry-accordion" className="w-full max-w-2xl mx-auto">

      {/* ── Input row ── */}
      <div className={`
        flex items-stretch rounded-xl border bg-[#191919] overflow-hidden
        transition-colors duration-200
        ${isReady ? 'border-white/15' : 'border-white/07'}
        focus-within:border-white/20
      `}>
        <textarea
          data-testid="entry-text-field"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Describe your work, paste a URL or DOI, or drop a file…"
          className="flex-1 px-5 py-4 bg-transparent text-[#e2e2e2] text-base placeholder-[#555] italic outline-none min-h-14 resize-none"
        />

        {/* Attach */}
        <button
          onClick={() => fileRef.current?.click()}
          className="px-4 border-l border-white/07 text-[#888] hover:text-[#ccc] text-lg transition-colors"
          aria-label="Attach file"
        >
          📎
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md,.docx"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Submit → (only in collapsed state) */}
        {!expanded && (
          <button
            data-testid="submit-button-top"
            onClick={isReady && !isLoading ? handleSubmit : undefined}
            aria-disabled={!isReady || isLoading}
            aria-label="Submit"
            className={`px-6 bg-[#4f8ef5] text-white font-mono text-sm tracking-wide hover:opacity-85 transition-opacity ${
              !isReady || isLoading ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? '…' : '→'}
          </button>
        )}
      </div>

      {/* ── File drop zone — ALWAYS visible ── */}
      <div
        data-testid="file-drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => dropFileRef.current?.click()}
        className="mt-3 border border-dashed border-white/12 rounded-lg py-4 text-center cursor-pointer
          hover:border-white/20 hover:bg-white/02 transition-all"
      >
        <p className="text-[0.82rem] text-[#888]">
          📁 Add details and context for your work — PDF · audio · image · data · any format
        </p>
        <input
          ref={dropFileRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Expander trigger ── */}
      {!expanded && (
        <button
          data-testid="accordion-expander"
          onClick={() => setExpanded(true)}
          className="mt-3 w-full text-left px-4 py-2.5 rounded-lg border border-white/07
            text-[0.82rem] text-[#888] font-mono tracking-wide
            hover:border-white/15 hover:text-[#ccc] transition-all"
        >
          ▼ Add details and context for your work
        </button>
      )}

      {/* ── Expanded content ── */}
      {expanded && (
        <div data-testid="accordion-expanded" className="mt-4 space-y-5">

          {/* Work type button group */}
          <div>
            <p className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#888] mb-2">
              Work type <span className="text-[#888]">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {WORK_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  data-testid={`work-type-${value}`}
                  onClick={() => handleWorkTypeSelect(value)}
                  className={`px-3 py-1.5 rounded-full border text-[0.75rem] font-mono transition-all
                    ${selectedWorkType === value
                      ? 'border-[#4f8ef5] text-[#4f8ef5] bg-[#4f8ef5]/08'
                      : 'border-white/10 text-[#888] hover:border-white/20 hover:text-[#ccc]'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Standing button group */}
          <div>
            <p className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#888] mb-2">
              Standing <span className="text-[#888]">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {STANDINGS.map(({ value, label }) => (
                <button
                  key={value}
                  data-testid={`standing-${value}`}
                  onClick={() => handleStandingSelect(value)}
                  className={`px-3 py-1.5 rounded-full border text-[0.75rem] font-mono transition-all
                    ${selectedStanding === value
                      ? 'border-[#4f8ef5] text-[#4f8ef5] bg-[#4f8ef5]/08'
                      : 'border-white/10 text-[#888] hover:border-white/20 hover:text-[#ccc]'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Field/tradition text input */}
          <div>
            <p className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#888] mb-2">
              Field / tradition <span className="text-[#888]">(optional)</span>
            </p>
            <input
              type="text"
              value={tradition}
              onChange={(e) => handleTraditionChange(e.target.value)}
              placeholder="e.g. Behavioral ecology, Historical linguistics…"
              className="w-full bg-[#222] border border-white/08 rounded-md px-4 py-2.5 text-[0.88rem] text-[#e2e2e2] placeholder-[#555] italic outline-none focus:border-white/20"
            />
          </div>

          {/* Collapser */}
          <button
            onClick={() => setExpanded(false)}
            className="w-full text-left px-4 py-2 rounded-lg border border-white/07
              text-[0.82rem] text-[#888] font-mono tracking-wide
              hover:border-white/15 hover:text-[#ccc] transition-all"
          >
            ▲ Fewer details
          </button>

          {/* Bottom CTA — only shown when expanded */}
          <button
            data-testid="evaluate-button"
            onClick={isReady && !isLoading ? handleSubmit : undefined}
            aria-disabled={!isReady || isLoading}
            className={`w-full py-3 rounded-xl bg-[#4f8ef5] text-white font-mono text-sm tracking-wide
              hover:opacity-85 transition-opacity
              ${!isReady || isLoading ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Evaluating…' : 'Evaluate →'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs text-[#e05252] font-mono">{error}</p>
      )}

      {/* Detection confirm card */}
      {result && !isLoading && (
        <DetectionConfirm
          result={result}
          onConfirm={onConfirmed}
          onAdjust={() => setExpanded(true)}
        />
      )}
    </div>
  );
}
