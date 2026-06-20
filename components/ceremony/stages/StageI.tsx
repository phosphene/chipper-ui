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
  const [selectedHopes, setSelectedHopes] = useState<string[]>([]);
  const [hopeText, setHopeText] = useState('');

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


      {/* What do you want Woodchipper to do for you? */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          What do you want Woodchipper to do for you?{' '}
          <span className="normal-case font-normal text-gray-400">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {['Analysis', 'Review', 'Summary', 'Edit', 'Development', 'Comparison',
            'Fact-checking', 'Clarity check', 'Argument strengthening', 'Gap identification',
            'Literature context', 'Methodology review', 'Impact assessment', 'Simplification',
            'Expansion', 'Translation guidance', 'Citation check', 'Structure review',
            'Audience alignment', 'Abstract writing'].map(hope => (
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
          placeholder="Or describe what you're looking for…"
          value={hopeText}
          onChange={e => setHopeText(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400"
        />
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
