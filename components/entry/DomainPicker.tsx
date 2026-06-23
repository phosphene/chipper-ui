'use client';
/**
 * DomainPicker — Autocomplete multi-select domain picker with taxonomy cascade.
 *
 * Features:
 *   - Autocomplete text input that searches label + synonyms
 *   - Multi-select with chip display showing label + abbreviated codes
 *   - Per-domain subtopic dropdown (first option always "General")
 *   - Remove chips with × button
 *
 * T-390
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ── Data model ───────────────────────────────────────────────

export interface DomainEntry {
  id: string;
  label: string;
  parent?: string;
  synonyms: string[];
  domainPath: string;
  codes: string;
  subtopics: string[];
}

export interface SelectedDomain {
  entry: DomainEntry;
  subtopic: string; // defaults to 'General'
}

// ── Seed taxonomy (Phase 1 — 30 disciplines) ────────────────

export const DOMAIN_TAXONOMY: DomainEntry[] = [
  // ── Natural Sciences > Biology ──
  {
    id: 'nat.bio.ecology',
    label: 'Ecology',
    parent: 'nat.bio',
    synonyms: ['ecosystem science', 'community ecology', 'population ecology', 'conservation biology'],
    domainPath: 'Natural Sciences > Biology > Ecology',
    codes: 'FORD 1.6 · DDC 577 · WoS Ecology',
    subtopics: ['General', 'Community Ecology', 'Population Ecology', 'Conservation Biology', 'Landscape Ecology', 'Marine Ecology'],
  },
  {
    id: 'nat.bio.evol',
    label: 'Evolutionary Biology',
    parent: 'nat.bio',
    synonyms: ['evolution', 'evolutionary science', 'phylogenetics', 'speciation'],
    domainPath: 'Natural Sciences > Biology > Evolutionary Biology',
    codes: 'FORD 1.6 · DDC 576.8 · WoS Evolutionary Biology',
    subtopics: ['General', 'Phylogenetics', 'Speciation', 'Molecular Evolution', 'Coevolution', 'Evo-Devo'],
  },
  {
    id: 'nat.bio.genetics',
    label: 'Genetics',
    parent: 'nat.bio',
    synonyms: ['genomics', 'molecular genetics', 'gene expression', 'heredity'],
    domainPath: 'Natural Sciences > Biology > Genetics',
    codes: 'FORD 1.6 · DDC 576.5 · WoS Genetics & Heredity',
    subtopics: ['General', 'Genomics', 'Epigenetics', 'Population Genetics', 'Gene Therapy', 'Molecular Genetics'],
  },
  {
    id: 'nat.bio.neuro',
    label: 'Neuroscience',
    parent: 'nat.bio',
    synonyms: ['brain science', 'neurobiology', 'cognitive neuroscience', 'neural science', 'neurophysiology'],
    domainPath: 'Natural Sciences > Biology > Neuroscience',
    codes: 'FORD 3.2 · DDC 612.8 · WoS Neurosciences',
    subtopics: ['General', 'Cognitive Neuroscience', 'Computational Neuroscience', 'Behavioral Neuroscience', 'Clinical Neuroscience', 'Neuroimaging'],
  },
  {
    id: 'nat.bio.evol.paleoanthro',
    label: 'Paleoanthropology',
    parent: 'nat.bio.evol',
    synonyms: ['human paleontology', 'fossil hominins', 'hominin evolution', 'human origins'],
    domainPath: 'Natural Sciences > Biology > Evolutionary Biology > Paleoanthropology',
    codes: 'FORD 1.6 · DDC 569.9 · WoS Anthropology',
    subtopics: ['General', 'Hominin Evolution', 'Paleoecology', 'Stone Tool Technology', 'Comparative Primatology', 'Fossil Morphology'],
  },
  // ── Natural Sciences > Physics ──
  {
    id: 'nat.physics',
    label: 'Physics',
    parent: 'nat',
    synonyms: ['physical sciences', 'theoretical physics', 'experimental physics'],
    domainPath: 'Natural Sciences > Physics',
    codes: 'FORD 1.3 · DDC 530 · WoS Physics',
    subtopics: ['General', 'Quantum Physics', 'Condensed Matter', 'Astrophysics', 'Particle Physics', 'Optics', 'Plasma Physics'],
  },
  // ── Natural Sciences > Chemistry ──
  {
    id: 'nat.chemistry',
    label: 'Chemistry',
    parent: 'nat',
    synonyms: ['chemical sciences', 'organic chemistry', 'inorganic chemistry', 'biochemistry'],
    domainPath: 'Natural Sciences > Chemistry',
    codes: 'FORD 1.4 · DDC 540 · WoS Chemistry',
    subtopics: ['General', 'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry', 'Biochemistry'],
  },
  // ── Natural Sciences > Earth Sciences ──
  {
    id: 'nat.earth',
    label: 'Earth Sciences',
    parent: 'nat',
    synonyms: ['geosciences', 'geology', 'geophysics', 'earth system science', 'geological sciences'],
    domainPath: 'Natural Sciences > Earth Sciences',
    codes: 'FORD 1.5 · DDC 550 · WoS Geosciences',
    subtopics: ['General', 'Geology', 'Geophysics', 'Climatology', 'Oceanography', 'Volcanology', 'Seismology'],
  },
  // ── Natural Sciences > Mathematics ──
  {
    id: 'nat.math',
    label: 'Mathematics',
    parent: 'nat',
    synonyms: ['math', 'pure mathematics', 'applied mathematics', 'mathematical sciences'],
    domainPath: 'Natural Sciences > Mathematics',
    codes: 'FORD 1.1 · DDC 510 · WoS Mathematics',
    subtopics: ['General', 'Pure Mathematics', 'Applied Mathematics', 'Statistics', 'Probability', 'Mathematical Logic'],
  },
  // ── Social Sciences ──
  {
    id: 'soc.anthro',
    label: 'Anthropology',
    parent: 'soc',
    synonyms: ['cultural anthropology', 'social anthropology', 'biological anthropology', 'ethnography'],
    domainPath: 'Social Sciences > Anthropology',
    codes: 'FORD 5.4 · DDC 301 · WoS Anthropology',
    subtopics: ['General', 'Cultural Anthropology', 'Biological Anthropology', 'Linguistic Anthropology', 'Archaeological Anthropology', 'Medical Anthropology'],
  },
  {
    id: 'soc.econ',
    label: 'Economics',
    parent: 'soc',
    synonyms: ['economic science', 'political economy', 'econometrics', 'microeconomics', 'macroeconomics'],
    domainPath: 'Social Sciences > Economics',
    codes: 'FORD 5.2 · DDC 330 · WoS Economics',
    subtopics: ['General', 'Microeconomics', 'Macroeconomics', 'Econometrics', 'Development Economics', 'Behavioral Economics', 'International Economics'],
  },
  {
    id: 'soc.psych',
    label: 'Psychology',
    parent: 'soc',
    synonyms: ['behavioral science', 'cognitive psychology', 'clinical psychology', 'psychological science'],
    domainPath: 'Social Sciences > Psychology',
    codes: 'FORD 5.1 · DDC 150 · WoS Psychology',
    subtopics: ['General', 'Clinical Psychology', 'Cognitive Psychology', 'Developmental Psychology', 'Social Psychology', 'Neuropsychology', 'Evolutionary Psychology'],
  },
  {
    id: 'soc.socio',
    label: 'Sociology',
    parent: 'soc',
    synonyms: ['social science', 'social theory', 'social stratification', 'social structure'],
    domainPath: 'Social Sciences > Sociology',
    codes: 'FORD 5.4 · DDC 301 · WoS Sociology',
    subtopics: ['General', 'Social Theory', 'Urban Sociology', 'Medical Sociology', 'Sociology of Knowledge', 'Demography'],
  },
  {
    id: 'soc.polisci',
    label: 'Political Science',
    parent: 'soc',
    synonyms: ['politics', 'government', 'political theory', 'comparative politics', 'international relations'],
    domainPath: 'Social Sciences > Political Science',
    codes: 'FORD 5.6 · DDC 320 · WoS Political Science',
    subtopics: ['General', 'Comparative Politics', 'International Relations', 'Political Theory', 'Public Policy', 'Political Economy'],
  },
  {
    id: 'soc.ling',
    label: 'Linguistics',
    parent: 'soc',
    synonyms: ['language science', 'computational linguistics', 'NLP', 'natural language processing', 'phonology', 'syntax'],
    domainPath: 'Social Sciences > Linguistics',
    codes: 'FORD 6.2 · DDC 410 · WoS Linguistics',
    subtopics: ['General', 'Syntax', 'Phonology', 'Semantics', 'Sociolinguistics', 'Computational Linguistics', 'Historical Linguistics'],
  },
  {
    id: 'soc.education',
    label: 'Education',
    parent: 'soc',
    synonyms: ['educational science', 'pedagogy', 'learning science', 'educational research'],
    domainPath: 'Social Sciences > Education',
    codes: 'FORD 5.3 · DDC 370 · WoS Education',
    subtopics: ['General', 'Higher Education', 'STEM Education', 'Educational Psychology', 'Curriculum Studies', 'Educational Technology'],
  },
  // ── Humanities ──
  {
    id: 'hum.history',
    label: 'History',
    parent: 'hum',
    synonyms: ['historical studies', 'historiography', 'world history', 'social history'],
    domainPath: 'Humanities > History',
    codes: 'FORD 6.1 · DDC 900 · WoS History',
    subtopics: ['General', 'Ancient History', 'Medieval History', 'Modern History', 'Social History', 'Economic History', 'History of Science'],
  },
  {
    id: 'hum.phil',
    label: 'Philosophy',
    parent: 'hum',
    synonyms: ['philosophical studies', 'analytic philosophy', 'continental philosophy', 'epistemology', 'ethics', 'metaphysics'],
    domainPath: 'Humanities > Philosophy',
    codes: 'FORD 6.3 · DDC 100 · WoS Philosophy',
    subtopics: ['General', 'Epistemology', 'Ethics', 'Metaphysics', 'Logic', 'Philosophy of Science', 'Philosophy of Mind', 'Political Philosophy'],
  },
  {
    id: 'hum.lit',
    label: 'Literature',
    parent: 'hum',
    synonyms: ['literary studies', 'literary criticism', 'comparative literature', 'literary theory'],
    domainPath: 'Humanities > Literature',
    codes: 'FORD 6.2 · DDC 800 · WoS Literature',
    subtopics: ['General', 'Comparative Literature', 'Literary Theory', 'Poetry Studies', 'Narrative Studies', 'Postcolonial Literature'],
  },
  {
    id: 'hum.arch',
    label: 'Archaeology',
    parent: 'hum',
    synonyms: ['archaeological science', 'prehistory', 'excavation science', 'classical archaeology'],
    domainPath: 'Humanities > Archaeology',
    codes: 'FORD 6.1 · DDC 930.1 · WoS Archaeology',
    subtopics: ['General', 'Prehistoric Archaeology', 'Classical Archaeology', 'Bioarchaeology', 'Maritime Archaeology', 'Landscape Archaeology'],
  },
  {
    id: 'hum.religious',
    label: 'Religious Studies',
    parent: 'hum',
    synonyms: ['theology', 'comparative religion', 'religion', 'divinity'],
    domainPath: 'Humanities > Religious Studies',
    codes: 'FORD 6.3 · DDC 200 · WoS Religion',
    subtopics: ['General', 'Comparative Religion', 'Theology', 'Philosophy of Religion', 'Sociology of Religion'],
  },
  // ── Engineering ──
  {
    id: 'eng.cs',
    label: 'Computer Science',
    parent: 'eng',
    synonyms: ['computing', 'informatics', 'software engineering', 'CS', 'machine learning', 'AI', 'artificial intelligence'],
    domainPath: 'Engineering > Computer Science',
    codes: 'FORD 1.2 · DDC 004 · WoS Computer Science',
    subtopics: ['General', 'Artificial Intelligence', 'Machine Learning', 'Software Engineering', 'Systems', 'Theory of Computation', 'Human-Computer Interaction', 'Computer Vision'],
  },
  {
    id: 'eng.electrical',
    label: 'Electrical Engineering',
    parent: 'eng',
    synonyms: ['EE', 'electronics', 'power systems', 'signal processing', 'electrical systems'],
    domainPath: 'Engineering > Electrical Engineering',
    codes: 'FORD 2.2 · DDC 621.3 · WoS Electrical Engineering',
    subtopics: ['General', 'Power Systems', 'Signal Processing', 'Telecommunications', 'Control Systems', 'Microelectronics'],
  },
  {
    id: 'eng.biomed',
    label: 'Biomedical Engineering',
    parent: 'eng',
    synonyms: ['BME', 'bioengineering', 'medical devices', 'tissue engineering', 'bioinstrumentation'],
    domainPath: 'Engineering > Biomedical Engineering',
    codes: 'FORD 2.9 · DDC 610.28 · WoS Biomedical Engineering',
    subtopics: ['General', 'Tissue Engineering', 'Medical Devices', 'Biomaterials', 'Biomechanics', 'Neural Engineering'],
  },
  {
    id: 'eng.mechanical',
    label: 'Mechanical Engineering',
    parent: 'eng',
    synonyms: ['ME', 'mechanics', 'thermal engineering', 'fluid dynamics', 'robotics'],
    domainPath: 'Engineering > Mechanical Engineering',
    codes: 'FORD 2.3 · DDC 621 · WoS Mechanical Engineering',
    subtopics: ['General', 'Thermodynamics', 'Fluid Mechanics', 'Robotics', 'Manufacturing', 'Materials Science'],
  },
  // ── Health ──
  {
    id: 'health.medicine',
    label: 'Medicine (Clinical)',
    parent: 'health',
    synonyms: ['clinical medicine', 'medical science', 'clinical research', 'internal medicine'],
    domainPath: 'Health > Medicine',
    codes: 'FORD 3.1 · DDC 610 · WoS Medicine, General & Internal',
    subtopics: ['General', 'Internal Medicine', 'Surgery', 'Pediatrics', 'Oncology', 'Cardiology', 'Psychiatry'],
  },
  {
    id: 'health.epidemiology',
    label: 'Epidemiology',
    parent: 'health',
    synonyms: ['disease epidemiology', 'outbreak science', 'infectious disease epidemiology', 'chronic disease epidemiology'],
    domainPath: 'Health > Epidemiology',
    codes: 'FORD 3.3 · DDC 614.4 · WoS Public, Environmental & Occupational Health',
    subtopics: ['General', 'Infectious Disease', 'Chronic Disease', 'Molecular Epidemiology', 'Social Epidemiology', 'Pharmacoepidemiology'],
  },
  {
    id: 'health.pubhealth',
    label: 'Public Health',
    parent: 'health',
    synonyms: ['population health', 'global health', 'health policy', 'preventive medicine'],
    domainPath: 'Health > Public Health',
    codes: 'FORD 3.3 · DDC 362.1 · WoS Public Health',
    subtopics: ['General', 'Global Health', 'Health Policy', 'Environmental Health', 'Preventive Medicine', 'Health Equity'],
  },
  // ── Environmental Science ──
  {
    id: 'nat.env',
    label: 'Environmental Science',
    parent: 'nat',
    synonyms: ['environmental studies', 'sustainability science', 'climate science', 'environmental research'],
    domainPath: 'Natural Sciences > Environmental Science',
    codes: 'FORD 1.5 · DDC 363.7 · WoS Environmental Sciences',
    subtopics: ['General', 'Climate Change', 'Biodiversity', 'Pollution', 'Sustainability', 'Environmental Policy'],
  },
  // ── Law ──
  {
    id: 'soc.law',
    label: 'Law',
    parent: 'soc',
    synonyms: ['legal studies', 'jurisprudence', 'legal science', 'constitutional law', 'international law'],
    domainPath: 'Social Sciences > Law',
    codes: 'FORD 5.5 · DDC 340 · WoS Law',
    subtopics: ['General', 'Constitutional Law', 'International Law', 'Criminal Law', 'Environmental Law', 'Human Rights Law'],
  },
];

// ── Props ────────────────────────────────────────────────────

interface DomainPickerProps {
  selected: SelectedDomain[];
  onChange: (domains: SelectedDomain[]) => void;
}

// ── Component ────────────────────────────────────────────────

export function DomainPicker({ selected, onChange }: DomainPickerProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Search logic ─────────────────────────────────────────

  const selectedIds = useMemo(() => new Set(selected.map(s => s.entry.id)), [selected]);

  const filteredEntries = useMemo(() => {
    if (!query.trim()) return DOMAIN_TAXONOMY.filter(e => !selectedIds.has(e.id));
    const q = query.toLowerCase().trim();
    return DOMAIN_TAXONOMY.filter(entry => {
      if (selectedIds.has(entry.id)) return false;
      if (entry.label.toLowerCase().includes(q)) return true;
      if (entry.synonyms.some(s => s.toLowerCase().includes(q))) return true;
      if (entry.domainPath.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [query, selectedIds]);

  // ── Handlers ─────────────────────────────────────────────

  const handleSelect = useCallback((entry: DomainEntry) => {
    onChange([...selected, { entry, subtopic: 'General' }]);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  }, [selected, onChange]);

  const handleRemove = useCallback((id: string) => {
    onChange(selected.filter(s => s.entry.id !== id));
  }, [selected, onChange]);

  const handleSubtopicChange = useCallback((id: string, subtopic: string) => {
    onChange(selected.map(s =>
      s.entry.id === id ? { ...s, subtopic } : s
    ));
  }, [selected, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  }, [isOpen]);

  const handleInputFocus = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  // ── Render ───────────────────────────────────────────────

  return (
    <div ref={containerRef} data-testid="domain-picker" className="space-y-3">
      {/* Selected domain chips with subtopic rows */}
      {selected.length > 0 && (
        <div className="space-y-2">
          {selected.map(({ entry, subtopic }) => (
            <div key={entry.id} className="space-y-1">
              {/* Chip */}
              <div
                data-testid={`domain-chip-${entry.id}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-full"
              >
                <span className="font-medium">{entry.label}</span>
                <span className="opacity-60 text-[0.65rem]">{entry.codes}</span>
                <button
                  data-testid={`domain-chip-${entry.id}-remove`}
                  onClick={() => handleRemove(entry.id)}
                  className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${entry.label}`}
                >
                  ×
                </button>
              </div>
              {/* Subtopic dropdown */}
              <div className="ml-4">
                <select
                  data-testid={`domain-subtopic-${entry.id}`}
                  value={subtopic}
                  onChange={e => handleSubtopicChange(entry.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 outline-none focus:border-gray-400 bg-white"
                >
                  {entry.subtopics.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          data-testid="domain-search-input"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search domains by name, synonym, or field..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400"
          autoComplete="off"
        />

        {/* Dropdown */}
        {isOpen && filteredEntries.length > 0 && (
          <div
            className="absolute z-10 w-full mt-1 border border-gray-200 rounded-xl bg-white shadow-lg max-h-64 overflow-y-auto"
            role="listbox"
          >
            {filteredEntries.map(entry => (
              <button
                key={entry.id}
                role="option"
                aria-selected={false}
                onClick={() => handleSelect(entry)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="text-sm font-medium text-gray-900">{entry.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{entry.domainPath}</div>
                <div className="text-[0.65rem] text-gray-400 mt-0.5">{entry.codes}</div>
              </button>
            ))}
          </div>
        )}

        {isOpen && query.trim() && filteredEntries.length === 0 && (
          <div className="absolute z-10 w-full mt-1 border border-gray-200 rounded-xl bg-white shadow-lg px-4 py-3">
            <p className="text-sm text-gray-500">No matching domains found</p>
          </div>
        )}
      </div>
    </div>
  );
}
