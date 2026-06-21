'use client';
/**
 * ProgressiveForm — rising form where completed sections animate upward.
 *
 * The user never scrolls. The content moves to them. Completed sections
 * compress into a single-line summary above a divider; the active section
 * lives below it at full visual weight. The Evaluate button is always
 * present at the bottom of the active area.
 *
 * Post-evaluation: Pronouncement and export strip render inline.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useCeremonyStore } from '@/store/ceremony';
import { useDetection } from '@/hooks/useDetection';
import { Pronouncement } from '@/components/ceremony/Pronouncement';
import { buildMarkdown, buildJSON } from '@/lib/export';
import type { WorkType, MakerStanding } from '@/store/ceremony.types';

// ── Section definitions ──────────────────────────────────────

type SectionId = 'work' | 'creator-role' | 'hopes' | 'domain' | 'worktype';

interface SubCode { code: string; label: string; }
interface CodeGroup { code: string; label: string; subtopics: SubCode[]; }
interface TaxonomyEntry { domain: string; system: string | null; authority: string | null; codes: CodeGroup[]; }

interface SectionState {
  id: SectionId;
  label: string;
  status: 'complete' | 'active' | 'pending' | 'skipped';
  summary: string;
}

const SECTION_ORDER: SectionId[] = ['work', 'creator-role', 'hopes', 'domain', 'worktype'];

const SECTION_LABELS: Record<SectionId, string> = {
  'work': 'Work',
  'creator-role': 'I am the',
  'hopes': 'What do you want Woodchipper to do?',
  'domain': 'Domain',
  'worktype': 'What type of work is this?',
};

// ── Data constants ───────────────────────────────────────────

const CREATOR_ROLES = [
  { value: 'sole', label: 'Sole creator' },
  { value: 'co-creator', label: 'Co-creator' },
  { value: 'llm', label: 'LLM' },
  { value: 'llm-assisted', label: 'LLM-assisted creator' },
];

const HOPE_OPTIONS = [
  'Analysis', 'Review', 'Summary', 'Edit', 'Development', 'Comparison',
  'Fact-checking', 'Clarity check', 'Argument strengthening', 'Gap identification',
  'Literature context', 'Methodology review', 'Impact assessment', 'Simplification',
  'Expansion', 'Translation guidance', 'Citation check', 'Structure review',
  'Audience alignment', 'Abstract writing',
];

const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: 'original-argument', label: 'Original Argument' },
  { value: 'synthesis-review', label: 'Synthesis' },
  { value: 'evidentiary-finding', label: 'Evidentiary Finding' },
  { value: 'replication', label: 'Replication of Results' },
  { value: 'null-result', label: 'Null Result' },
  { value: 'methodological-contribution', label: 'Methodological' },
  { value: 'theoretical-framework', label: 'Theoretical Framework' },
];

// Domain options loaded from /domain-taxonomy.json at runtime

// ── Component ────────────────────────────────────────────────

export function ProgressiveForm() {
  const store = useCeremonyStore();
  const { detect, isLoading: isDetecting } = useDetection();

  // Rich taxonomy with classification codes
  const [taxonomy, setTaxonomy] = useState<TaxonomyEntry[]>([]);
  useEffect(() => {
    fetch('/domain-taxonomy.json').then(r => r.json()).then(setTaxonomy).catch(() => {});
  }, []);

  // Section tracking
  const [activeIndex, setActiveIndex] = useState(0); // Start at work (entry text)
  const [sections, setSections] = useState<SectionState[]>(() =>
    SECTION_ORDER.map((id, i) => ({
      id,
      label: SECTION_LABELS[id],
      status: i === 0 ? 'active' : 'pending',
      summary: '',
    }))
  );

  // Section-local state
  const [workText, setWorkText] = useState('');
  const [workFile, setWorkFile] = useState<string | null>(null);
  const [creatorRole, setCreatorRole] = useState<string | null>(null);
  const [selectedHopes, setSelectedHopes] = useState<string[]>([]);
  const [hopeText, setHopeText] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [domainText, setDomainText] = useState('');
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  const [domainFilter, setDomainFilter] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | null>(null);

  // Post-evaluation state
  const [evaluated, setEvaluated] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Animation ref for the active area
  const activeAreaRef = useRef<HTMLDivElement>(null);

  // ── Section navigation ─────────────────────────────────────

  const completeSection = useCallback((sectionId: SectionId, summary: string) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === sectionId);
      if (idx === -1) return prev;

      const next = prev.map((s, i) => {
        if (i === idx) return { ...s, status: 'complete' as const, summary };
        if (i === idx + 1 && s.status === 'pending') return { ...s, status: 'active' as const };
        return s;
      });
      return next;
    });
    setActiveIndex(prev => Math.min(prev + 1, SECTION_ORDER.length));
  }, []);

  const skipSection = useCallback((sectionId: SectionId) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === sectionId);
      if (idx === -1) return prev;

      return prev.map((s, i) => {
        if (i === idx) return { ...s, status: 'skipped' as const, summary: '(skipped)' };
        if (i === idx + 1 && s.status === 'pending') return { ...s, status: 'active' as const };
        return s;
      });
    });
    setActiveIndex(prev => Math.min(prev + 1, SECTION_ORDER.length));
  }, []);

  const reopenSection = useCallback((sectionId: SectionId) => {
    if (evaluated) return; // Don't reopen after evaluation
    const idx = SECTION_ORDER.indexOf(sectionId);
    if (idx === -1 || idx === 0) return; // Can't reopen work

    setSections(prev => prev.map((s, i) => {
      if (i === idx) return { ...s, status: 'active' as const };
      if (i > idx && (s.status === 'active')) return { ...s, status: 'pending' as const };
      return s;
    }));
    setActiveIndex(idx);
  }, [evaluated]);

  // ── Section done handlers ──────────────────────────────────

  const handleCreatorDone = useCallback(() => {
    if (creatorRole) {
      const label = CREATOR_ROLES.find(r => r.value === creatorRole)?.label ?? creatorRole;
      // Map to store standing
      const standingMap: Record<string, MakerStanding> = {
        'sole': 'independent-researcher',
        'co-creator': 'independent-researcher',
        'llm': 'independent-researcher',
        'llm-assisted': 'independent-researcher',
      };
      store.updateMakerDeclaration({
        standing: { value: standingMap[creatorRole] ?? 'independent-researcher', source: 'user' },
      });
      completeSection('creator-role', label);
    }
  }, [creatorRole, store, completeSection]);

  const handleHopesDone = useCallback(() => {
    const parts = [...selectedHopes];
    if (hopeText.trim()) parts.push(hopeText.trim());
    completeSection('hopes', parts.length > 0 ? parts.join(', ') : '(none selected)');
  }, [selectedHopes, hopeText, completeSection]);

  const handleDomainDone = useCallback(() => {
    const parts = [...selectedDomains];
    if (domainText.trim()) parts.push(domainText.trim());
    const combined = parts.join(', ');
    if (combined) {
      store.updateMakerDeclaration({ tradition: { value: combined, source: 'user' } });
    }
    completeSection('domain', combined || '(none selected)');
  }, [selectedDomains, domainText, store, completeSection]);

  const handleWorkTypeDone = useCallback(() => {
    if (selectedWorkType) {
      const label = WORK_TYPES.find(w => w.value === selectedWorkType)?.label ?? selectedWorkType;
      store.updateWorkClassification({ workType: { value: selectedWorkType, source: 'user' } });
      completeSection('worktype', label);
    }
  }, [selectedWorkType, store, completeSection]);

  // ── Evaluate ───────────────────────────────────────────────

  const handleEvaluate = useCallback(async () => {
    const text = workText.trim();
    if (!text || text.length < 15) return;
    // Write to store so downstream components can read it
    store.updateMakerDeclaration({ freeText: text });

    setEvaluating(true);
    try {
      await detect(text);

      // Chain scoring after successful detection so export handlers have wciResult
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://wci-api.fly.dev';
      const state = useCeremonyStore.getState();
      try {
        const scoreRes = await fetch(`${apiBase}/api/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            work_type: state.workClassification?.workType?.value ?? 'original-argument',
            standing: state.makerDeclaration?.standing?.value ?? 'independent-researcher',
            domain: state.judgeIdentity?.domain?.value ?? 'general',
          }),
        });
        if (scoreRes.ok) {
          const data = await scoreRes.json();
          store.setWCIResult({
            compositeScore: data.composite_score,
            band: data.band,
            dimensionScores: (data.dimension_scores ?? []).map((d: any) => ({
              dimension: d.dimension,
              rawScore: d.raw_score,
              weight: d.weight,
              weightedScore: d.weighted_score,
              justification: d.justification,
              keyPassage: d.key_passage ?? null,
            })),
            epistemicLabel: data.epistemic_label ?? '',
            relativeContext: data.relative_context ?? '',
            rubricVersion: data.rubric_version ?? '1.0',
            evaluationDate: new Date().toISOString(),
            provenance: data.provenance ?? 'cold',
          });
        }
      } catch {
        // Scoring failure is non-fatal — export strip still appears,
        // buttons just won't produce output until scoring succeeds
      }

      setEvaluated(true);
      setShowExport(true);
    } catch {
      // Error handled by useDetection
    } finally {
      setEvaluating(false);
    }
  }, [workText, detect, store]);

  // ── Export helpers ──────────────────────────────────────────

  const handleExportPDF = useCallback(() => {
    const result = store.wciResult;
    if (!result) return;
    const md = buildMarkdown(result, workText);
    const escaped = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Woodchipper Evaluation</title>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; color: #111; line-height: 1.6; font-size: 14px; }
  h1 { font-size: 1.5rem; border-bottom: 2px solid #111; padding-bottom: 8px; }
  h2 { font-size: 1rem; margin-top: 2rem; text-transform: uppercase; letter-spacing: 0.08em; color: #444; }
  h3 { font-size: 0.95rem; margin-top: 1.2rem; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 13px; }
  th, td { border: 1px solid #ccc; padding: 5px 10px; text-align: left; }
  th { background: #f5f5f5; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body><pre style="font-family:inherit;background:none;padding:0;white-space:pre-wrap">${escaped}</pre>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) win.focus();
  }, [buildMarkdown]);

  const handleExportMD = useCallback(() => {
    const result = store.wciResult;
    if (!result) return;
    const md = buildMarkdown(result, workText);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `woodchipper-evaluation-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [buildMarkdown]);

  const handleExportJSON = useCallback(() => {
    const result = store.wciResult;
    if (!result) return;
    const json = buildJSON(result, workText);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `woodchipper-evaluation-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [buildJSON]);

  const handleCopy = useCallback(() => {
    const result = store.wciResult;
    if (!result) return;
    const md = buildMarkdown(result, workText);
    navigator.clipboard.writeText(md).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = md;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }, [buildMarkdown]);

  // ── Filter domains ─────────────────────────────────────────

  const filteredDomains = taxonomy
    .map(t => t.domain)
    .filter(d => d.toLowerCase().includes(domainFilter.toLowerCase()));

  // ── Active section check ───────────────────────────────────

  const activeSection = sections.find(s => s.status === 'active');
  const allDone = sections.every(s => s.status === 'complete' || s.status === 'skipped');
  const hasWorkText = workText.trim().length >= 15;

  // ── Render ─────────────────────────────────────────────────

  return (
    <div data-testid="progressive-form" className="h-full flex flex-col px-5 py-6 overflow-hidden">

      {/* ── Completed stack (above the line) ── */}
      <div className="flex-shrink-0 space-y-1 mb-3">
        {sections.filter(s => s.status === 'complete' || s.status === 'skipped').map(section => (
          <button
            key={section.id}
            data-testid={`section-${section.id}-complete`}
            onClick={() => reopenSection(section.id)}
            disabled={section.id === 'work' || evaluated}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-350 ease-out hover:bg-gray-50 disabled:hover:bg-transparent group"
            style={{
              transition: 'transform 0.35s ease, opacity 0.35s ease',
            }}
          >
            <span className="text-xs text-gray-400 font-medium uppercase tracking-widest whitespace-nowrap">
              {section.label}
            </span>
            <span className="text-xs text-gray-400 truncate flex-1">
              {section.summary}
            </span>
            {section.id !== 'work' && !evaluated && (
              <span className="text-[0.6rem] text-gray-300 group-hover:text-gray-500 transition-colors">
                edit
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Divider line ── */}
      {sections.some(s => s.status === 'complete' || s.status === 'skipped') && (
        <hr className="border-gray-200 mb-4 flex-shrink-0" />
      )}

      {/* ── Active section (below the line) ── */}
      <div
        ref={activeAreaRef}
        className="flex-1 overflow-y-auto"
        style={{ transition: 'transform 0.35s ease, opacity 0.35s ease' }}
      >
        {!evaluated && activeSection && (
          <div
            key={activeSection.id}
            data-testid={`section-${activeSection.id}`}
            className="animate-rise"
          >
            {/* Section header */}
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">
              {activeSection.label}{' '}
              <span className="normal-case font-normal text-gray-400">(optional)</span>
            </p>

            {/* Section content */}
            {activeSection.id === 'work' && (
              <div className="space-y-3" data-testid="section-work-input">
                <h1 className="text-2xl font-light text-black leading-tight">What are you working on?</h1>
                <textarea
                  data-testid="entry-text-field"
                  rows={5}
                  value={workText}
                  onChange={e => setWorkText(e.target.value)}
                  placeholder="Describe your work — a research paper, a finding, an argument, a null result…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 resize-none"
                  autoFocus
                />
              </div>
            )}
            {activeSection.id === 'creator-role' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {CREATOR_ROLES.map(({ value, label }) => (
                    <button
                      key={value}
                      data-testid={`creator-role-${value}`}
                      onClick={() => setCreatorRole(value)}
                      aria-pressed={creatorRole === value}
                      className={`px-4 py-2 rounded-full border text-sm transition-all
                        ${creatorRole === value
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSection.id === 'hopes' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {HOPE_OPTIONS.map(hope => (
                    <button
                      key={hope}
                      data-testid={`hope-${hope.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setSelectedHopes(prev =>
                        prev.includes(hope) ? prev.filter(h => h !== hope) : [...prev, hope]
                      )}
                      className={`px-3 py-1.5 rounded-full border text-xs transition-all
                        ${selectedHopes.includes(hope)
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                    >
                      {hope}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  data-testid="hope-freetext"
                  value={hopeText}
                  onChange={e => setHopeText(e.target.value)}
                  placeholder="Or describe what you're looking for…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400"
                />
              </div>
            )}

            {activeSection.id === 'domain' && (
              <div className="space-y-3">
                {/* Selected domain pills */}
                {selectedDomains.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedDomains.map(d => (
                      <span key={d} className="flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-xs rounded-full">
                        {d}
                        <button
                          onClick={() => setSelectedDomains(prev => prev.filter(x => x !== d))}
                          className="ml-1 opacity-60 hover:opacity-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Sub-discipline codes for each selected domain */}
                {selectedDomains.map(domain => {
                  const entry = taxonomy.find(t => t.domain === domain);
                  if (!entry || entry.codes.length === 0) return null;
                  return (
                    <div key={domain} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">{domain}</span>
                        {entry.system && (
                          <span className="text-[0.6rem] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {entry.system}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.codes.map(cg => (
                          <div key={cg.code} className="relative group">
                            <button
                              data-testid={`subcode-${cg.code}`}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-gray-200 text-xs text-gray-600 hover:border-gray-400 transition-all bg-white"
                              title={cg.subtopics.map(s => `${s.code}: ${s.label}`).join(' · ')}
                            >
                              <span className="font-mono text-[0.6rem] text-gray-400">{cg.code}</span>
                              <span>{cg.label}</span>
                            </button>
                            {/* Subtopic flyout on hover */}
                            {cg.subtopics.length > 0 && (
                              <div className="hidden group-hover:block absolute z-10 top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 min-w-[180px]">
                                {cg.subtopics.map(s => (
                                  <div key={s.code} className="flex items-baseline gap-2 py-0.5 px-1">
                                    <span className="font-mono text-[0.55rem] text-gray-400 shrink-0">{s.code}</span>
                                    <span className="text-xs text-gray-600">{s.label}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <input
                  type="text"
                  data-testid="entry-tradition"
                  value={domainText}
                  onChange={e => setDomainText(e.target.value)}
                  placeholder="Type a domain freely…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400"
                />

                <button
                  onClick={() => setDomainDropdownOpen(v => !v)}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {domainDropdownOpen ? '▲ Hide list' : '▼ Choose from list'}
                </button>

                {domainDropdownOpen && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
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
                      {filteredDomains.map(domain => (
                        <button
                          key={domain}
                          data-testid={`domain-option-${domain.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => {
                            setSelectedDomains(prev =>
                              prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-full border text-xs transition-all
                            ${selectedDomains.includes(domain)
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                        >
                          {domain}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection.id === 'worktype' && (
              <div className="grid grid-cols-2 gap-2">
                {WORK_TYPES.map(({ value, label }) => (
                  <button
                    key={`${value}-${label}`}
                    data-testid={`work-type-${value}`}
                    onClick={() => setSelectedWorkType(value)}
                    aria-pressed={selectedWorkType === value}
                    className={`text-left p-3 rounded-xl border text-sm transition-all
                      ${selectedWorkType === value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Done / Skip buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                data-testid={`btn-skip-${activeSection.id}`}
                onClick={() => skipSection(activeSection.id)}
                className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip →
              </button>
              <button
                data-testid={`btn-done-${activeSection.id}`}
                onClick={() => {
                  switch (activeSection.id) {
                    case 'work': {
                      store.updateMakerDeclaration({ freeText: workText });
                      completeSection('work', workText.slice(0, 80) + (workText.length > 80 ? '…' : ''));
                      break;
                    }
                    case 'creator-role': handleCreatorDone(); break;
                    case 'hopes': handleHopesDone(); break;
                    case 'domain': handleDomainDone(); break;
                    case 'worktype': handleWorkTypeDone(); break;
                  }
                }}
                className="px-4 py-2 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ── All sections done, pre-eval: show gentle prompt ── */}
        {!evaluated && !activeSection && allDone && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              All set. Hit Evaluate when you&apos;re ready.
            </p>
          </div>
        )}

        {/* ── Evaluate button — always visible when not evaluated ── */}
        {!evaluated && (
          <div className="mt-6">
            <button
              data-testid="evaluate-progressive"
              onClick={handleEvaluate}
              disabled={!hasWorkText || evaluating || isDetecting}
              className={`w-full py-4 rounded-xl text-sm font-medium transition-all
                ${hasWorkText && !evaluating && !isDetecting
                  ? 'bg-gray-900 text-white hover:bg-gray-700 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {evaluating || isDetecting ? 'Evaluating…' : 'Evaluate →'}
            </button>
          </div>
        )}

        {/* ── Post-evaluation: Reading ── */}
        {evaluated && (
          <div data-testid="reading-panel" className="mt-2">
            <Pronouncement
              onRequestImprovement={() => {
                setEvaluated(false);
                setShowExport(false);
              }}
              onExport={() => setShowExport(true)}
            />
          </div>
        )}

        {/* ── Export strip ── */}
        {evaluated && showExport && (
          <div data-testid="export-strip" className="mt-4 flex gap-2">
            <button
              onClick={handleExportPDF}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-gray-400 transition-colors"
            >
              PDF
            </button>
            <button
              onClick={handleExportMD}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-gray-400 transition-colors"
            >
              Markdown
            </button>
            <button
              onClick={handleExportJSON}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-gray-400 transition-colors"
            >
              JSON
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-gray-400 transition-colors"
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function buildWorkSummary(text: string): string {
  if (!text) return '(no text)';
  const clean = text.replace(/\n/g, ' ').trim();
  return clean.length > 80 ? `"${clean.slice(0, 80)}…"` : `"${clean}"`;
}
