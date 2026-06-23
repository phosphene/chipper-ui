'use client';
/**
 * DetectionChips — detection-first confirmation flow (T-392).
 *
 * After Stage 1 Proceed is clicked, /api/detect is called. Results arrive
 * as chips the maker confirms or edits before Stage 2 appears.
 *
 * Each chip has three states: pending → confirmed (click) → edited (inline correction).
 * Confidence badge (High/Medium/Low) on each chip.
 * Label format: "We think this is: [value]"
 *
 * When all chips are confirmed/edited → onComplete fires with final values.
 *
 * Academic marker highlight: if academic markers are detected, briefly
 * flashes the domain chip (0.5s animation, never forced).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { DetectionResult, WorkType, MakerStanding } from '@/store/ceremony.types';

// ── Types ────────────────────────────────────────────────────

type ChipState = 'pending' | 'confirmed' | 'edited';

interface ChipData {
  field: 'work-type' | 'domain' | 'standing';
  label: string;
  value: string;
  originalValue: string;
  state: ChipState;
  confidence: 'high' | 'medium' | 'low';
  editing: boolean;
}

export interface DetectionChipsResult {
  workType: string;
  domain: string;
  standing: string;
}

export interface DetectionChipsProps {
  /** Detection result from /api/detect */
  result: DetectionResult;
  /** Whether the detection call is still loading */
  isLoading: boolean;
  /** Error from detection call, if any */
  error: string | null;
  /** Called when all chips are confirmed/edited */
  onComplete: (result: DetectionChipsResult) => void;
  /** Whether academic markers were detected (triggers domain highlight) */
  hasAcademicMarkers?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────

function formatValue(field: string, value: string): string {
  // Convert kebab-case to title case for display
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function confidenceLabel(conf: 'high' | 'medium' | 'low'): string {
  return conf.charAt(0).toUpperCase() + conf.slice(1);
}

// ── Component ────────────────────────────────────────────────

export function DetectionChips({
  result,
  isLoading,
  error,
  onComplete,
  hasAcademicMarkers = false,
}: DetectionChipsProps) {
  const [chips, setChips] = useState<ChipData[]>([]);
  const [domainHighlight, setDomainHighlight] = useState(false);
  const completeRef = useRef(false);

  // Initialize chips from detection result
  useEffect(() => {
    if (!result) return;

    const initial: ChipData[] = [
      {
        field: 'work-type',
        label: 'Work type',
        value: result.workType ?? 'unknown',
        originalValue: result.workType ?? 'unknown',
        state: 'pending',
        confidence: result.confidence,
        editing: false,
      },
      {
        field: 'domain',
        label: 'Domain',
        value: result.domain ?? 'unknown',
        originalValue: result.domain ?? 'unknown',
        state: 'pending',
        confidence: result.confidence,
        editing: false,
      },
      {
        field: 'standing',
        label: 'Standing',
        value: result.standing ?? 'unknown',
        originalValue: result.standing ?? 'unknown',
        state: 'pending',
        confidence: result.confidence,
        editing: false,
      },
    ];

    setChips(initial);
    completeRef.current = false;
  }, [result]);

  // Academic marker highlight — 0.5s flash on domain chip
  useEffect(() => {
    if (hasAcademicMarkers && chips.length > 0) {
      setDomainHighlight(true);
      const timer = setTimeout(() => setDomainHighlight(false), 500);
      return () => clearTimeout(timer);
    }
  }, [hasAcademicMarkers, chips.length]);

  // Check if all chips confirmed/edited → fire onComplete
  useEffect(() => {
    if (chips.length === 0 || completeRef.current) return;
    const allResolved = chips.every(c => c.state === 'confirmed' || c.state === 'edited');
    if (allResolved) {
      completeRef.current = true;
      const workTypeChip = chips.find(c => c.field === 'work-type');
      const domainChip = chips.find(c => c.field === 'domain');
      const standingChip = chips.find(c => c.field === 'standing');
      onComplete({
        workType: workTypeChip?.value ?? '',
        domain: domainChip?.value ?? '',
        standing: standingChip?.value ?? '',
      });
    }
  }, [chips, onComplete]);

  // ── Chip actions ─────────────────────────────────────────

  const confirmChip = useCallback((field: string) => {
    setChips(prev =>
      prev.map(c =>
        c.field === field && c.state === 'pending'
          ? { ...c, state: 'confirmed' as const }
          : c
      )
    );
  }, []);

  const startEditing = useCallback((field: string) => {
    setChips(prev =>
      prev.map(c =>
        c.field === field ? { ...c, editing: true } : c
      )
    );
  }, []);

  const commitEdit = useCallback((field: string, newValue: string) => {
    setChips(prev =>
      prev.map(c => {
        if (c.field !== field) return c;
        const trimmed = newValue.trim();
        if (!trimmed) return { ...c, editing: false };
        const isEdited = trimmed !== c.originalValue;
        return {
          ...c,
          value: trimmed,
          state: isEdited ? 'edited' as const : 'confirmed' as const,
          editing: false,
        };
      })
    );
  }, []);

  const cancelEdit = useCallback((field: string) => {
    setChips(prev =>
      prev.map(c =>
        c.field === field ? { ...c, editing: false } : c
      )
    );
  }, []);

  // ── Loading state ────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        data-testid="detection-chips-container"
        className="flex flex-col items-center justify-center py-12 space-y-3"
      >
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-light">Reading your work…</p>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────

  if (error) {
    return (
      <div
        data-testid="detection-chips-container"
        className="py-8 text-center"
      >
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  // ── No result yet ────────────────────────────────────────

  if (chips.length === 0) return null;

  // ── Render chips ─────────────────────────────────────────

  return (
    <div
      data-testid="detection-chips-container"
      className="py-6 space-y-4"
    >
      <p className="text-xs font-mono tracking-widest uppercase text-gray-500 mb-3">
        We detected:
      </p>

      <div className="flex flex-wrap gap-3">
        {chips.map(chip => (
          <SingleChip
            key={chip.field}
            chip={chip}
            highlight={chip.field === 'domain' && domainHighlight}
            onConfirm={() => confirmChip(chip.field)}
            onStartEdit={() => startEditing(chip.field)}
            onCommitEdit={(val) => commitEdit(chip.field, val)}
            onCancelEdit={() => cancelEdit(chip.field)}
          />
        ))}
      </div>

      {/* Hint text */}
      {chips.some(c => c.state === 'pending') && (
        <p className="text-xs text-gray-400 mt-2">
          Click to confirm, or click the edit icon to correct.
        </p>
      )}
    </div>
  );
}

// ── SingleChip sub-component ─────────────────────────────────

interface SingleChipProps {
  chip: ChipData;
  highlight: boolean;
  onConfirm: () => void;
  onStartEdit: () => void;
  onCommitEdit: (value: string) => void;
  onCancelEdit: () => void;
}

function SingleChip({
  chip,
  highlight,
  onConfirm,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
}: SingleChipProps) {
  const [editValue, setEditValue] = useState(chip.value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (chip.editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [chip.editing]);

  // Sync editValue when chip value changes externally
  useEffect(() => {
    if (!chip.editing) {
      setEditValue(chip.value);
    }
  }, [chip.value, chip.editing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onCommitEdit(editValue);
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  // ── Style by state ──────────────────────────────────────

  const stateStyles: Record<ChipState, string> = {
    pending: 'border-gray-300 bg-white text-gray-700',
    confirmed: 'border-gray-900 bg-gray-900 text-white',
    edited: 'border-amber-500 bg-amber-500 text-white',
  };

  const confidenceBadgeStyles: Record<ChipState, string> = {
    pending: 'bg-gray-200 text-gray-600',
    confirmed: 'bg-gray-700 text-gray-300',
    edited: 'bg-amber-600 text-amber-100',
  };

  const highlightClass = highlight
    ? 'ring-2 ring-blue-400 ring-offset-1 animate-pulse'
    : '';

  // ── Editing mode ────────────────────────────────────────

  if (chip.editing) {
    return (
      <div
        data-testid={`detection-chip-${chip.field}`}
        data-state={chip.state}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border-2 border-blue-400 bg-white ${highlightClass}`}
      >
        <span className="text-xs text-gray-500 whitespace-nowrap">{chip.label}:</span>
        <input
          ref={inputRef}
          data-testid={`detection-chip-${chip.field}-input`}
          type="text"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onCommitEdit(editValue)}
          className="text-sm text-gray-900 bg-transparent outline-none min-w-[80px] max-w-[200px]"
        />
        <span className={`text-[0.6rem] px-1.5 py-0.5 rounded-full ${confidenceBadgeStyles.pending}`}>
          {confidenceLabel(chip.confidence)}
        </span>
      </div>
    );
  }

  // ── Display mode ────────────────────────────────────────

  return (
    <div
      data-testid={`detection-chip-${chip.field}`}
      data-state={chip.state}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-200 cursor-pointer select-none ${stateStyles[chip.state]} ${highlightClass}`}
      onClick={chip.state === 'pending' ? onConfirm : undefined}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' && chip.state === 'pending') onConfirm();
      }}
    >
      {/* Label + value */}
      <span className={chip.state === 'pending' ? 'text-gray-500' : ''}>
        {chip.state === 'pending' ? 'We think this is: ' : ''}
        {formatValue(chip.field, chip.value)}
      </span>

      {/* Confidence badge */}
      <span
        className={`text-[0.6rem] px-1.5 py-0.5 rounded-full font-medium ${confidenceBadgeStyles[chip.state]}`}
      >
        {confidenceLabel(chip.confidence)}
      </span>

      {/* Edit trigger */}
      <button
        data-testid={`detection-chip-${chip.field}-edit`}
        onClick={e => {
          e.stopPropagation();
          onStartEdit();
        }}
        className={`ml-1 text-xs transition-opacity ${
          chip.state === 'pending'
            ? 'text-gray-400 hover:text-gray-600'
            : chip.state === 'confirmed'
            ? 'text-gray-400 hover:text-white'
            : 'text-amber-200 hover:text-white'
        }`}
        aria-label={`Edit ${chip.label}`}
      >
        ✎
      </button>
    </div>
  );
}
