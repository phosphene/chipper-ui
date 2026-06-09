/**
 * SimpleEntry — T-266
 *
 * The searchbar entry point. Google/Telegram register.
 * Text input + file attach + submit.
 *
 * SoC: zero business logic in JSX.
 * - Detection API call in useDetection hook
 * - Academic marker hint: hasAcademicMarkers from hook (no inline check)
 * - Mode switch: calls onSwitchToDetailed (parent decides)
 * - 15-char minimum: enforced in hook, not here
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { useDetection } from '@/hooks/useDetection';
import { DetectionConfirm } from './DetectionConfirm';

interface Props {
  onConfirmed: () => void;       // detection confirmed → start ceremony
  onSwitchToDetailed: () => void; // user wants the accordion
}

const MIN_CHARS = 15;

export function SimpleEntry({ onConfirmed, onSwitchToDetailed }: Props) {
  const [text, setText] = useState('');
  const [showHint, setShowHint] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { detect, result, isLoading, error, hasAcademicMarkers } = useDetection();

  // Show "Detailed" hint when academic markers detected — not forced
  const handleSubmit = useCallback(async () => {
    if (text.trim().length < MIN_CHARS) return;
    await detect(text);
    // Hint logic lives here (not in JSX) — show hint if markers present
    if (hasAcademicMarkers) setShowHint(true);
  }, [text, detect, hasAcademicMarkers]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Read file as base64 for API
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      await detect(text || file.name, base64);
    };
    reader.readAsDataURL(file);
  }, [text, detect]);

  const isReady = text.trim().length >= MIN_CHARS;

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* Mode toggle — briefly highlighted when academic markers detected */}
      <div className="flex justify-end mb-3">
        <button
          onClick={onSwitchToDetailed}
          className={`
            px-4 py-1.5 rounded-full border text-xs font-mono tracking-wide transition-all
            ${showHint
              ? 'border-[#4f8ef5] text-[#4f8ef5] bg-[#4f8ef5]/08 animate-pulse-once'
              : 'border-white/10 text-[#555] hover:border-white/20 hover:text-[#888]'
            }
          `}
        >
          Detailed
        </button>
      </div>

      {/* Input row */}
      <div className={`
        flex items-stretch rounded-xl border bg-[#191919] overflow-hidden
        transition-colors duration-200
        ${isReady ? 'border-white/15' : 'border-white/07'}
        focus-within:border-white/20
      `}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your work or drop a file…"
          className="flex-1 px-5 py-4 bg-transparent text-[#e2e2e2] text-base placeholder-[#555] italic outline-none min-h-14"
        />

        {/* Attach */}
        <button
          onClick={() => fileRef.current?.click()}
          className="px-4 border-l border-white/07 text-[#555] hover:text-[#888] text-lg transition-colors"
          aria-label="Attach file"
        >
          📎
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md,.docx"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isReady || isLoading}
          className="px-6 bg-[#4f8ef5] text-white font-mono text-sm tracking-wide disabled:opacity-40 hover:opacity-85 transition-opacity"
        >
          {isLoading ? '…' : '→'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs text-[#e05252] font-mono">{error}</p>
      )}

      {/* Detection confirm card */}
      {result && !isLoading && (
        <DetectionConfirm
          result={result}
          onConfirm={onConfirmed}
          onAdjust={onSwitchToDetailed}
        />
      )}
    </div>
  );
}
