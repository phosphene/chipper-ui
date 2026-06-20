'use client';
/**
 * Stage II — Your Work
 * Order: I am a → Domain (with sub-topic expansion) → Work type
 * Domain taxonomy loaded from /domain-taxonomy.json
 */

import { useState, useEffect } from 'react';
import { useCeremonyStore } from '@/store/ceremony';
import { StageNav } from '../StageNav';
import type { WorkType, MakerStanding } from '@/store/ceremony.types';

interface DomainEntry {
  domain: string;
  subtopics: string[];
}

const WORK_TYPES: { value: WorkType; label: string; desc: string }[] = [
  { value: 'original-argument',          label: 'Original Argument',      desc: 'New claim with supporting evidence' },
  { value: 'synthesis-review',           label: 'Synthesis',              desc: 'Argument from accumulated evidence' },
  { value: 'synthesis-review',           label: 'Review',                 desc: 'Survey of a field or topic' },
  { value: 'evidentiary-finding',        label: 'Summary',                desc: 'Overview or synopsis of a body of work' },
  { value: 'evidentiary-finding',        label: 'Evidentiary Finding',    desc: 'Contribution to the evidence base' },
  { value: 'replication',               label: 'Replication of Results', desc: 'Testing whether prior findings hold' },
  { value: 'null-result',               label: 'Null Result',            desc: 'Evidence of absence or non-finding' },
  { value: 'methodological-contribution', label: 'Methodological',       desc: 'New procedure, instrument, or method' },
];

const STANDINGS: { value: MakerStanding; label: string }[] = [
  { value: 'graduate-researcher', label: 'Student' },
  { value: 'professor',           label: 'Scholar' },
  { value: 'practitioner',        label: 'Practitioner' },
];

export function StageII() {
  const store = useCeremonyStore();

  const [standing, setStanding] = useState<MakerStanding | null>(
    store.makerDeclaration?.standing?.value ?? null
  );
  const [taxonomy, setTaxonomy] = useState<DomainEntry[]>([]);
  const [domainFilter, setDomainFilter] = useState('');
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<Record<string, string[]>>({});
  const [domainText, setDomainText] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | null>(
    store.workClassification?.workType?.value ?? null
  );

  useEffect(() => {
    fetch('/domain-taxonomy.json')
      .then(r => r.json())
      .then(setTaxonomy)
      .catch(() => {});
  }, []);

  const handleStanding = (s: MakerStanding) => {
    setStanding(s);
    store.updateMakerDeclaration({ standing: { value: s, source: 'user' } });
  };

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev => {
      const next = prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain];
      updateTradition(next, selectedSubtopics, domainText);
      return next;
    });
    // Init subtopics for this domain if not yet selected
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

  const updateTradition = (domains: string[], subtopics: Record<string, string[]>, text: string) => {
    const parts = domains.map(d => {
      const subs = subtopics[d] ?? ['General'];
      return subs[0] === 'General' ? d : `${d} (${subs.join(', ')})`;
    });
    if (text) parts.push(text);
    store.updateMakerDeclaration({ tradition: { value: parts.join(' · '), source: 'user' } });
  };

  const handleWorkType = (wt: WorkType) => {
    setSelectedWorkType(wt);
    store.updateWorkClassification({ workType: { value: wt, source: 'user' } });
  };

  const canAdvance = !!selectedWorkType || !!selectedDomains.length || !!standing;

  const filteredDomains = taxonomy.filter(d =>
    d.domain.toLowerCase().includes(domainFilter.toLowerCase())
  );

  return (
    <div data-testid="stage-II">

      {/* I am a */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          I am a: <span className="normal-case font-normal text-gray-400">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {STANDINGS.map(({ value, label }) => (
            <button
              key={value}
              data-testid={`standing-${value}`}
              onClick={() => handleStanding(value)}
              aria-pressed={standing === value}
              className={`px-5 py-2 rounded-full border text-sm transition-all
                ${standing === value
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Domain */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          Domain / Research Area / Discipline <span className="normal-case font-normal text-gray-400">(optional)</span>
        </p>

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

        {/* Sub-topic boxes for each selected domain */}
        {selectedDomains.map(domain => {
          const entry = taxonomy.find(t => t.domain === domain);
          if (!entry) return null;
          const selected = selectedSubtopics[domain] ?? ['General'];
          return (
            <div key={domain} className="mb-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
              <p className="text-xs font-medium text-gray-600 mb-2">{domain}</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.subtopics.map(sub => (
                  <button
                    key={sub}
                    data-testid={`subtopic-${domain.toLowerCase().replace(/\s+/g, '-')}-${sub.toLowerCase().replace(/[\s/()]+/g, '-')}`}
                    onClick={() => toggleSubtopic(domain, sub)}
                    className={`px-3 py-1 rounded-full border text-xs transition-all
                      ${selected.includes(sub)
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Free text input */}
        <input
          type="text"
          data-testid="entry-tradition"
          value={domainText}
          onChange={e => {
            setDomainText(e.target.value);
            updateTradition(selectedDomains, selectedSubtopics, e.target.value);
          }}
          placeholder="Or type a domain freely…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 mb-2"
        />

        {/* Dropdown toggle */}
        <button
          onClick={() => setDomainDropdownOpen(v => !v)}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {domainDropdownOpen ? '▲ Hide list' : '▼ Choose from list'}
        </button>

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
            <div className="flex flex-wrap gap-2 p-3 max-h-52 overflow-y-auto">
              {filteredDomains.map(({ domain }) => (
                <button
                  key={domain}
                  data-testid={`domain-option-${domain.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => toggleDomain(domain)}
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

      {/* Work type */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          What type of work is this? <span className="normal-case font-normal text-gray-400">(optional)</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {WORK_TYPES.map(({ value, label, desc }) => (
            <button
              key={label}
              data-testid={`work-type-${value}`}
              onClick={() => handleWorkType(value)}
              aria-pressed={selectedWorkType === value}
              className={`text-left p-3 rounded-xl border text-sm transition-all
                ${selectedWorkType === value
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}
            >
              <div className="font-medium">{label}</div>
              <div className={`text-xs mt-0.5 ${selectedWorkType === value ? 'text-gray-300' : 'text-gray-400'}`}>{desc}</div>
            </button>
          ))}
        </div>
        <button
          data-testid="work-type-none"
          onClick={() => setSelectedWorkType(null)}
          className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          None of these describe my work
        </button>
      </div>

      <StageNav
        canAdvance={canAdvance}
        onAdvance={() => store.advanceStage()}
        onBack={() => store.backStage()}
        testidPrefix="stage-II"
      />
    </div>
  );
}
