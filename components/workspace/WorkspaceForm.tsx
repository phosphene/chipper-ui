'use client';
/**
 * WorkspaceForm — the combined Stage I + II form in Zone B (left panel).
 * One form, one Proceed button at the bottom.
 * No separate evaluate page — everything here.
 *
 * Sections:
 * 1. I am the (creator role)
 * 2. What do you want Woodchipper to do for you? (hopes)
 * 3. Domain / Research Area / Discipline (with sub-topics)
 * 4. What type of work is this?
 * Proceed → runs evaluation and returns reading
 */

import { useState, useEffect } from 'react';
import { useCeremonyStore } from '@/store/ceremony';
import type { WorkType } from '@/store/ceremony.types';

interface DomainEntry {
  domain: string;
  subtopics: string[];
}

const CREATOR_ROLES = [
  { value: 'sole',         label: 'Sole creator' },
  { value: 'co-creator',   label: 'Co-creator' },
  { value: 'llm',          label: 'LLM' },
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
  { value: 'original-argument',           label: 'Original Argument' },
  { value: 'synthesis-review',            label: 'Synthesis' },
  { value: 'synthesis-review',            label: 'Review' },
  { value: 'evidentiary-finding',         label: 'Summary' },
  { value: 'evidentiary-finding',         label: 'Evidentiary Finding' },
  { value: 'replication',                 label: 'Replication of Results' },
  { value: 'null-result',                 label: 'Null Result' },
  { value: 'methodological-contribution', label: 'Methodological' },
];

interface Props {
  onProceed: () => void;
  isLoading?: boolean;
}

export function WorkspaceForm({ onProceed, isLoading }: Props) {
  const store = useCeremonyStore();

  const [creatorRole, setCreatorRole]         = useState<string | null>(null);
  const [selectedHopes, setSelectedHopes]     = useState<string[]>([]);
  const [hopeText, setHopeText]               = useState('');
  const [taxonomy, setTaxonomy]               = useState<DomainEntry[]>([]);
  const [domainFilter, setDomainFilter]       = useState('');
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<Record<string, string[]>>({});
  const [domainText, setDomainText]           = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | null>(null);

  useEffect(() => {
    fetch('/domain-taxonomy.json').then(r => r.json()).then(setTaxonomy).catch(() => {});
  }, []);

  const updateTradition = (domains: string[], subtopics: Record<string, string[]>, text: string) => {
    const parts = domains.map(d => {
      const subs = subtopics[d] ?? ['General'];
      return subs[0] === 'General' ? d : `${d} (${subs.join(', ')})`;
    });
    if (text) parts.push(text);
    store.updateMakerDeclaration({ tradition: { value: parts.join(' · '), source: 'user' } });
  };

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev => {
      const next = prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain];
      updateTradition(next, selectedSubtopics, domainText);
      return next;
    });
    if (!selectedSubtopics[domain]) {
      setSelectedSubtopics(prev => ({ ...prev, [domain]: ['General'] }));
    }
  };

  const toggleSubtopic = (domain: string, subtopic: string) => {
    setSelectedSubtopics(prev => {
      const current = prev[domain] ?? ['General'];
      const next = current.includes(subtopic)
        ? current.filter(s => s !== subtopic)
        : [...current.filter(s => s !== 'General'), subtopic];
      const updated = { ...prev, [domain]: next.length ? next : ['General'] };
      updateTradition(selectedDomains, updated, domainText);
      return updated;
    });
  };

  const handleWorkType = (wt: WorkType) => {
    setSelectedWorkType(wt);
    store.updateWorkClassification({ workType: { value: wt, source: 'user' } });
  };

  const filteredDomains = taxonomy.filter(d =>
    d.domain.toLowerCase().includes(domainFilter.toLowerCase())
  );

  return (
    <div data-testid="workspace-form" className="h-full overflow-y-auto px-5 py-6 flex flex-col gap-6">

      {/* I am the */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          I am the: <span className="normal-case font-normal text-gray-400">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {CREATOR_ROLES.map(({ value, label }) => (
            <button key={value} data-testid={`creator-role-${value}`}
              onClick={() => setCreatorRole(value)} aria-pressed={creatorRole === value}
              className={`px-4 py-2 rounded-full border text-sm transition-all
                ${creatorRole === value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* What do you want Woodchipper to do */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          What do you want Woodchipper to do for you?{' '}
          <span className="normal-case font-normal text-gray-400">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {HOPE_OPTIONS.map(hope => (
            <button key={hope} data-testid={`hope-${hope.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedHopes(prev =>
                prev.includes(hope) ? prev.filter(h => h !== hope) : [...prev, hope])}
              className={`px-3 py-1.5 rounded-full border text-xs transition-all
                ${selectedHopes.includes(hope) ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              {hope}
            </button>
          ))}
        </div>
        <input type="text" data-testid="hope-freetext" value={hopeText}
          onChange={e => setHopeText(e.target.value)}
          placeholder="Or describe what you're looking for…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400" />
      </div>

      {/* Domain */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          Domain / Research Area / Discipline{' '}
          <span className="normal-case font-normal text-gray-400">(optional)</span>
        </p>

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

        {selectedDomains.map(domain => {
          const entry = taxonomy.find(t => t.domain === domain);
          if (!entry) return null;
          const selected = selectedSubtopics[domain] ?? ['General'];
          return (
            <div key={domain} className="mb-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
              <p className="text-xs font-medium text-gray-600 mb-2">{domain}</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.subtopics.map(sub => (
                  <button key={sub}
                    onClick={() => toggleSubtopic(domain, sub)}
                    className={`px-3 py-1 rounded-full border text-xs transition-all
                      ${selected.includes(sub) ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <input type="text" data-testid="entry-tradition" value={domainText}
          onChange={e => { setDomainText(e.target.value); updateTradition(selectedDomains, selectedSubtopics, e.target.value); }}
          placeholder="Or type a domain freely…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 mb-2" />

        <button onClick={() => setDomainDropdownOpen(v => !v)}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
          {domainDropdownOpen ? '▲ Hide list' : '▼ Choose from list'}
        </button>

        {domainDropdownOpen && (
          <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input type="text" placeholder="Filter…" value={domainFilter}
                onChange={e => setDomainFilter(e.target.value)}
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
            </div>
            <div className="flex flex-wrap gap-2 p-3 max-h-48 overflow-y-auto">
              {filteredDomains.map(({ domain }) => (
                <button key={domain}
                  data-testid={`domain-option-${domain.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => toggleDomain(domain)}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-all
                    ${selectedDomains.includes(domain) ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {domain}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Work type */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          What type of work is this?{' '}
          <span className="normal-case font-normal text-gray-400">(optional)</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {WORK_TYPES.map(({ value, label }) => (
            <button key={label} data-testid={`work-type-${value}`}
              onClick={() => handleWorkType(value)} aria-pressed={selectedWorkType === value}
              className={`text-left p-3 rounded-xl border text-sm transition-all
                ${selectedWorkType === value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Proceed */}
      <div className="pt-2 pb-4">
        <hr className="mb-4 border-gray-200" />
        <button
          data-testid="workspace-proceed"
          onClick={onProceed}
          disabled={isLoading}
          className={`w-full py-4 rounded-xl text-sm font-medium transition-all
            ${isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
        >
          {isLoading ? 'Working…' : 'Proceed →'}
        </button>
      </div>
    </div>
  );
}
