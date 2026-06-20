'use client';
/**
 * EntryAccordion — entry form with correct field order and domain dropdown.
 *
 * Order (Jan's notes 2026-06-20):
 * 1. What are you working on? (title/description, always visible)
 * 2. Upload file (always visible drop zone)
 * 3. Optional description box (expanded only, larger textarea)
 * 4. I am a: Student / Scholar / Practitioner (expanded)
 * 5. Domain / Research Area / Discipline — type-in OR dropdown multi-select (expanded)
 *
 * Work type is detected automatically — not user-selected at entry.
 */

import { useState, useRef, useCallback } from 'react';
import { useDetection } from '@/hooks/useDetection';
import { useCeremonyStore } from '@/store/ceremony';
import { DetectionConfirm } from './DetectionConfirm';
import type { MakerStanding } from '@/store/ceremony.types';

interface Props {
  onConfirmed: () => void;
}

const MIN_CHARS = 15;

const STANDINGS: { value: MakerStanding; label: string }[] = [
  { value: 'graduate-researcher', label: 'Student' },
  { value: 'professor',           label: 'Scholar' },
  { value: 'practitioner',        label: 'Practitioner' },
];

// Common domains for the dropdown — user can also type freely
const DOMAIN_OPTIONS = [
  'Anthropology', 'Archaeology', 'Architecture', 'Art History',
  'Behavioral Biology', 'Biochemistry', 'Business', 'Chemistry',
  'Clinical Medicine', 'Cognitive Science', 'Communication',
  'Computer Science', 'Cultural Studies', 'Development Economics',
  'Earth Sciences', 'Economics', 'Education', 'Engineering',
  'Environmental Science', 'Epidemiology', 'Ethnography', 'Ethology',
  'Evolutionary Biology', 'Film Studies', 'Genetics', 'Geography',
  'History', 'Immunology', 'International Relations', 'Law',
  'Linguistics', 'Literature', 'Marine Biology', 'Mathematics',
  'Microbiology', 'Musicology', 'Neuroscience', 'Nursing',
  'Paleoanthropology', 'Philosophy', 'Physics', 'Political Science',
  'Primatology', 'Psychology', 'Public Health', 'Public Policy',
  'Religious Studies', 'Sociology', 'Statistics', 'Theology',
];

export function EntryAccordion({ onConfirmed }: Props) {
  const [text, setText]                       = useState('');
  const [description, setDescription]         = useState('');
  const [expanded, setExpanded]               = useState(false);
  const [selectedStanding, setSelectedStanding] = useState<MakerStanding | null>(null);
  const [domainText, setDomainText]           = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  const [domainFilter, setDomainFilter]       = useState('');
  const [workStage, setWorkStage]             = useState<string | null>(null);
  const [workKind, setWorkKind]               = useState<string | null>(null);

  const fileRef     = useRef<HTMLInputElement>(null);
  const dropFileRef = useRef<HTMLInputElement>(null);

  const { detect, result, isLoading, error } = useDetection();
  const store = useCeremonyStore();

  const isReady = text.trim().length >= MIN_CHARS;

  const handleTextChange = useCallback((value: string) => {
    setText(value);
    store.updateMakerDeclaration({ freeText: value });
  }, [store]);

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
    // Append description to freeText for detection purposes
    store.updateMakerDeclaration({ freeText: text + (value ? '\n\n' + value : '') });
  }, [store, text]);

  const handleStandingSelect = useCallback((s: MakerStanding) => {
    setSelectedStanding(s);
    store.updateMakerDeclaration({ standing: { value: s, source: 'user' } });
  }, [store]);

  const handleDomainTextChange = useCallback((value: string) => {
    setDomainText(value);
    const combined = [...selectedDomains, value].filter(Boolean).join(', ');
    store.updateMakerDeclaration({ tradition: { value: combined, source: 'user' } });
  }, [store, selectedDomains]);

  const toggleDomain = useCallback((domain: string) => {
    setSelectedDomains(prev => {
      const next = prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain];
      const combined = [...next, domainText].filter(Boolean).join(', ');
      store.updateMakerDeclaration({ tradition: { value: combined, source: 'user' } });
      return next;
    });
  }, [store, domainText]);

  const handleSubmit = useCallback(async () => {
    if (!isReady || isLoading) return;
    await detect(text + (description ? '\n\n' + description : ''));
  }, [text, description, detect, isLoading, isReady]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
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

  const filteredDomains = DOMAIN_OPTIONS.filter(d =>
    d.toLowerCase().includes(domainFilter.toLowerCase())
  );

  return (
    <div data-testid="entry-accordion" className="w-full max-w-2xl mx-auto">

      {/* ── Work stage selector ── */}
      <div className="mb-4">
        <div className="flex gap-2 flex-wrap">
          {(['Ideas stage', 'In progress', 'Finished Work — Seeking Review'] as const).map(stage => (
            <button
              key={stage}
              data-testid={`stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => { setWorkStage(stage); setWorkKind(null); }}
              className={`px-4 py-2 rounded-full border text-sm transition-all
                ${workStage === stage
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-gray-500'}`}
            >
              {stage}
            </button>
          ))}
        </div>

        {/* Ideas stage sub-options */}
        {workStage === 'Ideas stage' && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {['Concept', 'Observation', 'Daydream', 'Memory', 'Investigation', 'Vision', 'Outline', 'Memo'].map(kind => (
              <button
                key={kind}
                data-testid={`work-kind-${kind.toLowerCase()}`}
                onClick={() => setWorkKind(kind)}
                className={`px-3 py-1.5 rounded-full border text-xs transition-all
                  ${workKind === kind
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
              >
                {kind}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 1. Title / description ── */}
      <div className={`
        flex items-stretch rounded-xl border bg-white overflow-hidden
        transition-colors duration-200
        ${isReady ? 'border-gray-400' : 'border-gray-200'}
        focus-within:border-gray-400
      `}>
        <textarea
          data-testid="entry-text-field"
          value={text}
          onChange={e => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Title or description of your work…"
          className="flex-1 px-5 py-4 bg-transparent text-gray-900 text-base placeholder-gray-500 outline-none resize-none"
        />
        {!expanded && (
          <button
            data-testid="submit-button-top"
            onClick={isReady && !isLoading ? handleSubmit : undefined}
            aria-disabled={!isReady || isLoading}
            aria-label="Submit"
            tabIndex={0}
            className={`px-6 bg-gray-900 text-white text-sm font-mono tracking-wide hover:bg-gray-700 transition-colors ${!isReady || isLoading ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            {isLoading ? '…' : '→'}
          </button>
        )}
      </div>

      {/* ── 2. Upload file (always visible) ── */}
      <div
        data-testid="file-drop-zone"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => dropFileRef.current?.click()}
        className="mt-3 border-2 border-dashed border-gray-200 rounded-xl py-5 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
      >
        <p className="text-sm text-gray-600">
          📁 Upload details
        </p>
        <p className="text-xs text-gray-500 mt-1">PDF · audio · image · data · any format</p>
        <input ref={dropFileRef} type="file" className="hidden" onChange={handleFileChange} />
        <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.docx" className="hidden" onChange={handleFileChange} />
      </div>

      {/* ── Expander ── */}
      {!expanded && (
        <button
          data-testid="accordion-expander"
          onClick={() => setExpanded(true)}
          className="mt-3 w-full text-left px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-600 transition-all"
        >
          + Add more details
        </button>
      )}

      {/* ── Expanded fields ── */}
      {expanded && (
        <div data-testid="accordion-expanded" className="mt-4 space-y-6">

          {/* 3. Optional description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
              Description <span className="normal-case font-normal text-gray-600">(optional)</span>
            </label>
            <textarea
              data-testid="entry-details"
              rows={5}
              value={description}
              onChange={e => handleDescriptionChange(e.target.value)}
              placeholder="Describe the work in more detail — argument, method, findings, context…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 resize-y"
            />
          </div>

          {/* 4. I am a: */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
              I am a: <span className="normal-case font-normal text-gray-600">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {STANDINGS.map(({ value, label }) => (
                <button
                  key={value}
                  data-testid={`standing-${value}`}
                  onClick={() => handleStandingSelect(value)}
                  className={`px-4 py-2 rounded-full border text-sm transition-all
                    ${selectedStanding === value
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Domain */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
              Domain / Research Area / Discipline <span className="normal-case font-normal text-gray-600">(optional)</span>
            </label>

            {/* Selected domain chips */}
            {selectedDomains.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedDomains.map(d => (
                  <span key={d} className="flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-xs rounded-full">
                    {d}
                    <button onClick={() => toggleDomain(d)} className="ml-1 opacity-60 hover:opacity-100">×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Type-in field */}
            <input
              type="text"
              data-testid="entry-tradition"
              value={domainText}
              onChange={e => handleDomainTextChange(e.target.value)}
              placeholder="Type a domain, or choose from the list below…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400"
            />

            {/* Dropdown toggle */}
            <button
              onClick={() => setDomainDropdownOpen(v => !v)}
              className="mt-2 text-xs text-gray-600 hover:text-gray-600 transition-colors"
            >
              {domainDropdownOpen ? '▲ Hide list' : '▼ Choose from list'}
            </button>

            {/* Domain dropdown */}
            {domainDropdownOpen && (
              <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Filter…"
                    value={domainFilter}
                    onChange={e => setDomainFilter(e.target.value)}
                    className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-gray-400"
                  />
                </div>
                <div className="flex flex-wrap gap-2 p-3 max-h-48 overflow-y-auto">
                  {filteredDomains.map(d => (
                    <button
                      key={d}
                      data-testid={`domain-option-${d.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => toggleDomain(d)}
                      className={`px-3 py-1.5 rounded-full border text-xs transition-all
                        ${selectedDomains.includes(d)
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Collapse */}
          <button
            onClick={() => setExpanded(false)}
            className="w-full text-left px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-600 transition-all"
          >
            ▲ Fewer details
          </button>

          {/* Evaluate CTA */}
          <button
            data-testid="evaluate-button"
            onClick={isReady && !isLoading ? handleSubmit : undefined}
            aria-disabled={!isReady || isLoading}
            className={`w-full py-3.5 rounded-xl bg-gray-900 text-white text-sm font-medium tracking-wide hover:bg-gray-700 transition-colors ${!isReady || isLoading ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Evaluating…' : 'Evaluate →'}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

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
