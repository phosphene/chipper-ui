'use client';
/**
 * Stage I — Maker Declaration
 * Two simple fields: who you are, your role in this work.
 * No epigraph. No freetext. No ReviewCard complexity.
 */
import { useState } from 'react';
import { useCeremonyStore } from '@/store/ceremony';
import { StageNav } from '../StageNav';
import type { MakerStanding } from '@/store/ceremony.types';

const STANDINGS: { value: MakerStanding; label: string }[] = [
  { value: 'graduate-researcher', label: 'Student' },
  { value: 'professor',           label: 'Scholar' },
  { value: 'practitioner',        label: 'Practitioner' },
];

const CREATOR_ROLES = [
  { value: 'sole',           label: 'Sole creator' },
  { value: 'co-creator',     label: 'Co-creator' },
  { value: 'llm',            label: 'LLM' },
  { value: 'llm-assisted',   label: 'LLM-assisted creator' },
];

export function StageI() {
  const store = useCeremonyStore();
  const [standing, setStanding] = useState<MakerStanding | null>(
    store.makerDeclaration?.standing?.value ?? null
  );
  const [creatorRole, setCreatorRole] = useState<string | null>(null);

  const canAdvance = !!standing;

  const handleStanding = (s: MakerStanding) => {
    setStanding(s);
    store.updateMakerDeclaration({ standing: { value: s, source: 'user' } });
  };

  return (
    <div data-testid="stage-I">

      {/* I am a */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          I am a:
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

      {/* I am the */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          I am the:
        </p>
        <div className="flex flex-wrap gap-2">
          {CREATOR_ROLES.map(({ value, label }) => (
            <button
              key={value}
              data-testid={`creator-role-${value}`}
              onClick={() => setCreatorRole(value)}
              aria-pressed={creatorRole === value}
              className={`px-5 py-2 rounded-full border text-sm transition-all
                ${creatorRole === value
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <StageNav
        canAdvance={canAdvance}
        onAdvance={() => store.advanceStage()}
        showBack={false}
        testidPrefix="stage-I"
      />
    </div>
  );
}
