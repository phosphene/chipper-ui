'use client';
/**
 * ResultsPanel — Post-completion results surface.
 *
 * Shows completed service results, per-result view/copy,
 * and download actions for the corrected paper and receipt.
 *
 * @module ResultsPanel
 * @ticket T-381
 */

import { useCallback, useState } from 'react';
import type { ServiceResult, ServiceType } from './service-board.schema';
import { Receipt } from './Receipt';

// ── DFT manifest (static testid declarations for audit) ──────
// data-testid="results-service-edit-abstract" data-testid="results-service-edit-abstract-view" data-testid="results-service-edit-abstract-copy"
// data-testid="results-service-check-citations" data-testid="results-service-check-citations-view" data-testid="results-service-check-citations-copy"
// data-testid="results-service-spellcheck" data-testid="results-service-spellcheck-view" data-testid="results-service-spellcheck-copy"
// data-testid="results-service-doi-metadata" data-testid="results-service-doi-metadata-view" data-testid="results-service-doi-metadata-copy"
// data-testid="results-service-zenodo-record" data-testid="results-service-zenodo-record-view" data-testid="results-service-zenodo-record-copy"

// ── Display name map ──────────────────────────────────────────

const SERVICE_LABELS: Record<ServiceType, string> = {
  'edit-abstract': 'Abstract Edit',
  'check-citations': 'Citation Check',
  spellcheck: 'Spellcheck',
  'doi-metadata': 'DOI Metadata',
  'zenodo-record': 'Zenodo Record',
};

// ── Solemn palette ────────────────────────────────────────────

const PALETTE = {
  background: '#F5F0E8',
  border: '#8B6914',
  accent: '#C9A84C',
  text: '#3D2B1F',
  cardBg: '#FAF7F2',
} as const;

// ── Helpers ───────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    /* silent fallback — user can manually copy */
  });
}

// ── Props ─────────────────────────────────────────────────────

interface ResultsPanelProps {
  results: ServiceResult[];
  workText: string;
  evaluationBand: string;
}

// ── Component ─────────────────────────────────────────────────

export function ResultsPanel({ results, workText, evaluationBand }: ResultsPanelProps) {
  const dateStr = new Date().toISOString().slice(0, 10);

  // Build the corrected paper from results that produce corrected-paper output
  const correctedPaperResults = results.filter((r) => r.outputType === 'corrected-paper');
  const correctedText =
    correctedPaperResults.length > 0
      ? correctedPaperResults.map((r) => r.output).join('\n\n')
      : workText;

  // Build receipt text
  const receiptText = [
    `Woodchipper Service Receipt — ${dateStr}`,
    `Evaluation Band: ${evaluationBand}`,
    '',
    ...results.map(
      (r) =>
        `── ${SERVICE_LABELS[r.serviceType]} ──\n${r.output}${r.changesCount != null ? `\nChanges: ${r.changesCount}` : ''}`,
    ),
  ].join('\n');

  const handleDownloadPaper = useCallback(() => {
    downloadBlob(correctedText, `corrected-paper-${dateStr}.txt`, 'text/plain');
  }, [correctedText, dateStr]);

  const handleDownloadReceipt = useCallback(() => {
    downloadBlob(receiptText, `service-receipt-${dateStr}.txt`, 'text/plain');
  }, [receiptText, dateStr]);

  return (
    <div data-testid="results-panel" style={{ color: PALETTE.text }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          Services Complete
        </p>
        <div style={{ height: '1px', backgroundColor: PALETTE.border, marginBottom: '16px' }} />
      </div>

      {/* Download buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          data-testid="results-download-paper"
          onClick={handleDownloadPaper}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${PALETTE.border}`,
            backgroundColor: PALETTE.cardBg,
            color: PALETTE.text,
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Download corrected paper
        </button>
        <button
          data-testid="results-download-receipt"
          onClick={handleDownloadReceipt}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${PALETTE.border}`,
            backgroundColor: PALETTE.cardBg,
            color: PALETTE.text,
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Download receipt
        </button>
      </div>

      {/* Individual service results */}
      <div style={{ marginBottom: '24px' }}>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '12px',
            opacity: 0.7,
          }}
        >
          Individual service outputs
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {results.map((result) => (
            <ServiceResultRow key={result.serviceType} result={result} />
          ))}
        </div>
      </div>

      {/* Inline receipt */}
      <Receipt results={results} workText={workText} evaluationBand={evaluationBand} date={dateStr} />
    </div>
  );
}

// ── Per-result row ────────────────────────────────────────────

function ServiceResultRow({ result }: { result: ServiceResult }) {
  const [expanded, setExpanded] = useState(false);
  const label = SERVICE_LABELS[result.serviceType];

  return (
    <div
      data-testid={`results-service-${result.serviceType}`}
      style={{
        padding: '12px',
        borderRadius: '6px',
        border: `1px solid ${PALETTE.border}`,
        backgroundColor: PALETTE.cardBg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: PALETTE.text }}>{label}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            data-testid={`results-service-${result.serviceType}-view`}
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: `1px solid ${PALETTE.border}`,
              backgroundColor: 'transparent',
              color: PALETTE.text,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {expanded ? 'Hide' : 'View'}
          </button>
          <button
            data-testid={`results-service-${result.serviceType}-copy`}
            onClick={() => copyToClipboard(result.output)}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: `1px solid ${PALETTE.border}`,
              backgroundColor: 'transparent',
              color: PALETTE.text,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Copy
          </button>
        </div>
      </div>
      {expanded && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: PALETTE.background,
            borderRadius: '4px',
            fontSize: '13px',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
          }}
        >
          {result.output}
        </div>
      )}
    </div>
  );
}
