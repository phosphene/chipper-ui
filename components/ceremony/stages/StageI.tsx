'use client';
/**
 * Stage I — About You
 * Just one question: I am the (creator role).
 * "I am a" and Domain live in Stage II.
 */

import { useState } from 'react';
import { useCeremonyStore } from '@/store/ceremony';
import { StageNav } from '../StageNav';

const CREATOR_ROLES = [
  { value: 'sole',         label: 'Sole creator' },
  { value: 'co-creator',   label: 'Co-creator' },
  { value: 'llm',          label: 'LLM' },
  { value: 'llm-assisted', label: 'LLM-assisted creator' },
];

export function StageI() {
  const store = useCeremonyStore();
  const [creatorRole, setCreatorRole] = useState<string | null>(null);

  // Always can advance — creator role is optional context, not a gate
  const canAdvance = true;

  return (
    <div data-testid="stage-I">
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          I am the: <span className="normal-case font-normal text-gray-400">(optional)</span>
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
