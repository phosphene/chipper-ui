/**
 * PartsBar — work type icon strip (T-266).
 *
 * Horizontal icon bar of work type shortcuts for the board panel.
 * Currently dormant — not rendered in any app route.
 *
 * @remarks
 * Originally designed to pre-select a work type and open a quick-entry
 * shortcut. Architecture has since moved to the five-layer entry flow
 * (Layers 1–5). This component is preserved for potential future use
 * as a power-user shortcut. If reactivated, it must route through the
 * Layer 3 route selection — not directly to any ceremony.
 * Bypassing the entry layers would violate the two-entity architecture.
 */
'use client';
import type { WorkType } from '@/store/ceremony.types';

interface Part {
  value: WorkType;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const PARTS: Part[] = [
  {
    value: 'original-argument',
    label: 'Argument',
    color: '#f5a623',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <circle cx="13" cy="13" r="9" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="13" cy="13" r="3.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    value: 'null-result',
    label: 'Null Result',
    color: '#f5a623',
    icon: (
      <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
        <rect x="7" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="2" y1="9" x2="7" y2="9" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="19" y1="9" x2="24" y2="9" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="13" y1="6" x2="13" y2="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
      </svg>
    ),
  },
  {
    value: 'replication',
    label: 'Replication',
    color: '#f5a623',
    icon: (
      <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
        <path d="M5 10 L13 3 L21 10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <line x1="13" y1="3" x2="13" y2="18" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="7" y1="18" x2="19" y2="18" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
  },
  {
    value: 'synthesis-review',
    label: 'Synthesis',
    color: '#f5a623',
    icon: (
      <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
        <line x1="3" y1="5" x2="23" y2="5" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="3" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="22" cy="15" r="3" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    value: 'methodological-contribution',
    label: 'Method',
    color: '#f5a623',
    icon: (
      <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
        <rect x="8" y="2" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="11" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1"/>
        <line x1="11" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="1"/>
        <line x1="11" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
  },
  {
    value: 'evidentiary-finding',
    label: 'Evidence',
    color: '#4caf80',
    icon: (
      <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
        <polygon points="13,2 24,19 2,19" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <line x1="13" y1="8" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="13" cy="16.5" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    value: 'theoretical-framework',
    label: 'Framework',
    color: '#888',
    icon: (
      <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
        <line x1="13" y1="2" x2="13" y2="20" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="3" y1="11" x2="23" y2="11" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="13" cy="2" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="3"  cy="11" r="2" stroke="currentColor" strokeWidth="1"/>
        <circle cx="23" cy="11" r="2" stroke="currentColor" strokeWidth="1"/>
        <circle cx="13" cy="20" r="2" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
  },
];

interface Props {
  onSelect: (workType: WorkType) => void;
}

export function PartsBar({ onSelect }: Props) {
  return (
    <div className="flex items-center bg-[#191919] border-b border-white/07 overflow-x-auto flex-shrink-0">
      <span className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#888] px-3 whitespace-nowrap">
        Parts
      </span>
      {PARTS.map((part) => (
        <button
          key={part.value}
          onClick={() => onSelect(part.value)}
          title={part.label}
          style={{ color: part.color }}
          className="
            flex flex-col items-center justify-center gap-1
            w-14 h-14 flex-shrink-0
            border border-transparent rounded-lg mx-0.5
            hover:border-white/15 hover:bg-[#222]
            transition-all duration-150
          "
        >
          {part.icon}
          <span className="font-mono text-[0.45rem] tracking-wide text-[#888] leading-none">
            {part.label}
          </span>
        </button>
      ))}
    </div>
  );
}
