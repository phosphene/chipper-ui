'use client';
/**
 * DetectionChips — inline assessment confirmation (T-392).
 *
 * After Stage 1 Proceed, /api/detect runs. Results appear inline
 * on the same page as chips the maker confirms or edits.
 *
 * Redesigned (batch-9):
 * - "Please confirm our assessment:" header
 * - Direct labels: "You're a [Standing]", domain, work type
 * - Real Edit buttons (not hidden pencils)
 * - Explicit Confirm button
 * - No page jump — renders inline in ProgressiveForm
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { DetectionResult, WorkType, MakerStanding } from '@/store/ceremony.types';

// ── Types ────────────────────────────────────────────────────

type ChipState = 'pending' | 'confirmed' | 'edited';

interface ChipData {
  field: 'work-type' | 'domain' | 'standing';
  label: string;
  displayPrefix: string;
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
  result: DetectionResult;
  isLoading: boolean;
  error: string | null;
  onComplete: (result: DetectionChipsResult) => void;
  hasAcademicMarkers?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────

function formatValue(value: string): string {
  if (!value || value === 'unknown' || value === 'general') return '';
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function fallbackLabel(field: string, value: string): string {
  const formatted = formatValue(value);
  if (formatted && formatted.toLowerCase() !== 'general' && formatted.toLowerCase() !== 'unknown') {
    return formatted;
  }
  // Field-specific fallbacks when detection returns generic values
  switch (field) {
    case 'domain': return 'Not yet determined';
    case 'standing': return 'Independent Researcher';
    case 'work-type': return 'Original Argument';
    default: return formatted || 'Not specified';
  }
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
        field: 'standing',
        label: 'Standing',
        displayPrefix: "You're a",
        value: result.standing ?? 'unknown',
        originalValue: result.standing ?? 'unknown',
        state: 'pending',
        confidence: result.confidence,
        editing: false,
      },
      {
        field: 'domain',
        label: 'Domain',
        displayPrefix: 'Domain:',
        value: result.domain ?? 'unknown',
        originalValue: result.domain ?? 'unknown',
        state: 'pending',
        confidence: result.confidence,
        editing: false,
      },
      {
        field: 'work-type',
        label: 'Work type',
        displayPrefix: 'Work type:',
        value: result.workType ?? 'unknown',
        originalValue: result.workType ?? 'unknown',
        state: 'pending',
        confidence: result.confidence,
        editing: false,
      },
    ];

    setChips(initial);
    completeRef.current = false;
  }, [result]);

  // Academic marker highlight
  useEffect(() => {
    if (hasAcademicMarkers && chips.length > 0) {
      setDomainHighlight(true);
      const timer = setTimeout(() => setDomainHighlight(false), 500);
      return () => clearTimeout(timer);
    }
  }, [hasAcademicMarkers, chips.length]);

  // ── Chip actions ─────────────────────────────────────────

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
        return {
          ...c,
          value: trimmed,
          state: 'edited' as const,
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

  // ── Confirm all ──────────────────────────────────────────

  const handleConfirmAll = useCallback(() => {
    if (completeRef.current) return;
    completeRef.current = true;

    const finalChips = chips.map(c => ({
      ...c,
      state: (c.state === 'edited' ? 'edited' : 'confirmed') as ChipState,
    }));
    setChips(finalChips);

    const workTypeChip = finalChips.find(c => c.field === 'work-type');
    const domainChip = finalChips.find(c => c.field === 'domain');
    const standingChip = finalChips.find(c => c.field === 'standing');
    onComplete({
      workType: workTypeChip?.value ?? '',
      domain: domainChip?.value ?? '',
      standing: standingChip?.value ?? '',
    });
  }, [chips, onComplete]);

  // ── Loading state ────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        data-testid="detection-chips-container"
        className="flex flex-col items-center justify-center py-12 space-y-3"
      >
        <div className="w-6 h-6 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
        <p className="text-sm text-black/40 font-light">Reading your work…</p>
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
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  // ── No result yet ────────────────────────────────────────

  if (chips.length === 0) return null;

  // ── Render ───────────────────────────────────────────────

  const anyEditing = chips.some(c => c.editing);

  return (
    <div
      data-testid="detection-chips-container"
      className="py-6 space-y-5"
    >
      <h2 className="text-lg font-light text-black leading-tight">
        Please confirm our assessment:
      </h2>

      <div className="space-y-3">
        {chips.map(chip => (
          <AssessmentRow
            key={chip.field}
            chip={chip}
            highlight={chip.field === 'domain' && domainHighlight}
            onStartEdit={() => startEditing(chip.field)}
            onCommitEdit={(val) => commitEdit(chip.field, val)}
            onCancelEdit={() => cancelEdit(chip.field)}
          />
        ))}
      </div>

      {/* Confirm button */}
      {!anyEditing && (
        <button
          data-testid="detection-confirm-btn"
          onClick={handleConfirmAll}
          className="w-full py-3.5 rounded-xl text-sm font-medium bg-black/90 text-white hover:bg-black/70 cursor-pointer transition-all"
        >
          Confirm
        </button>
      )}
    </div>
  );
}

// ── AssessmentRow sub-component ──────────────────────────────

interface AssessmentRowProps {
  chip: ChipData;
  highlight: boolean;
  onStartEdit: () => void;
  onCommitEdit: (value: string) => void;
  onCancelEdit: () => void;
}

function AssessmentRow({
  chip,
  highlight,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
}: AssessmentRowProps) {
  const [editValue, setEditValue] = useState(chip.value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chip.editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [chip.editing]);

  useEffect(() => {
    if (!chip.editing) {
      setEditValue(chip.value);
    }
  }, [chip.value, chip.editing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onCommitEdit(editValue);
    else if (e.key === 'Escape') onCancelEdit();
  };

  const displayValue = fallbackLabel(chip.field, chip.value);
  const highlightClass = highlight ? 'ring-2 ring-blue-400/30 ring-offset-1' : '';

  // ── Editing mode ────────────────────────────────────────

  if (chip.editing) {
    return (
      <div
        data-testid={`detection-chip-${chip.field}`}
        data-state={chip.state}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-black/20 bg-white ${highlightClass}`}
      >
        <span className="text-sm text-black/50 whitespace-nowrap">{chip.displayPrefix}</span>
        <input
          ref={inputRef}
          data-testid={`detection-chip-${chip.field}-input`}
          type="text"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 text-sm text-black bg-transparent outline-none"
        />
        <button
          onClick={() => onCommitEdit(editValue)}
          className="text-xs font-medium text-black/60 hover:text-black px-2 py-1 rounded border border-black/10 hover:border-black/30 transition-all"
        >
          Save
        </button>
        <button
          onClick={onCancelEdit}
          className="text-xs text-black/40 hover:text-black/60 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  // ── Display mode ────────────────────────────────────────

  const editedBorder = chip.state === 'edited' ? 'border-amber-400/40' : 'border-black/8';

  return (
    <div
      data-testid={`detection-chip-${chip.field}`}
      data-state={chip.state}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${editedBorder} bg-white/60 ${highlightClass}`}
    >
      <span className="text-sm text-black/50 whitespace-nowrap">{chip.displayPrefix}</span>
      <span className="flex-1 text-sm font-medium text-black/80">
        {displayValue}
      </span>
      <button
        data-testid={`detection-chip-${chip.field}-edit`}
        onClick={onStartEdit}
        className="text-xs font-medium text-black/40 hover:text-black/70 px-2.5 py-1 rounded border border-black/10 hover:border-black/25 transition-all"
      >
        Edit
      </button>
    </div>
  );
}
