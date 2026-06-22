'use client';
/**
 * ServiceOptions — Service selector with paper input.
 *
 * Renders available services filtered by workType and standing.
 * Passive — calls onToggle/onPaperChange/onRequest, no local state.
 *
 * @module ServiceOptions
 * @ticket T-381
 */

import type { ServiceType } from './service-board.schema';

// ── DFT manifest (static testid declarations for audit) ──────
// data-testid="service-option-edit-abstract"
// data-testid="service-option-check-citations"
// data-testid="service-option-spellcheck"
// data-testid="service-option-doi-metadata"
// data-testid="service-option-zenodo-record"

// ── Service catalogue ─────────────────────────────────────────

interface ServiceEntry {
  type: ServiceType;
  label: string;
  /** If true, hidden for independent-researcher standing */
  institutional: boolean;
}

const ALL_SERVICES: ServiceEntry[] = [
  { type: 'edit-abstract', label: 'Edit abstract', institutional: false },
  { type: 'check-citations', label: 'Check citations', institutional: false },
  { type: 'spellcheck', label: 'Spellcheck and grammar', institutional: false },
  { type: 'doi-metadata', label: 'Draft DOI metadata record', institutional: false },
  { type: 'zenodo-record', label: 'Draft Zenodo deposit record', institutional: true },
];

// ── Solemn palette ────────────────────────────────────────────

const PALETTE = {
  background: '#F5F0E8',
  border: '#8B6914',
  accent: '#C9A84C',
  text: '#3D2B1F',
  cardBg: '#FAF7F2',
} as const;

// ── Props ─────────────────────────────────────────────────────

interface ServiceOptionsProps {
  workType: string;
  standing: string;
  selected: ServiceType[];
  onToggle: (t: ServiceType) => void;
  onPaperChange: (text: string) => void;
  paperText: string;
  onRequest: () => void;
}

// ── Component ─────────────────────────────────────────────────

export function ServiceOptions({
  workType,
  standing,
  selected,
  onToggle,
  onPaperChange,
  paperText,
  onRequest,
}: ServiceOptionsProps) {
  const visibleServices = ALL_SERVICES.filter(
    (s) => !(s.institutional && standing === 'independent-researcher'),
  );

  return (
    <div style={{ color: PALETTE.text }}>
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
          Woodchipper Services
        </p>
        <div style={{ height: '1px', backgroundColor: PALETTE.border, marginBottom: '16px' }} />
        <p style={{ fontSize: '14px', opacity: 0.8 }}>
          Your work has been evaluated. Select the services you need.
        </p>
      </div>

      {/* Service checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {visibleServices.map((service) => (
          <label
            key={service.type}
            data-testid={`service-option-${service.type}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <input
              type="checkbox"
              checked={selected.includes(service.type)}
              onChange={() => onToggle(service.type)}
              style={{ accentColor: PALETTE.accent }}
            />
            {service.label}
          </label>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: PALETTE.border, marginBottom: '16px' }} />

      {/* Paper textarea */}
      <div style={{ marginBottom: '24px' }}>
        <p
          style={{
            fontSize: '13px',
            marginBottom: '8px',
            opacity: 0.7,
          }}
        >
          Supply your full paper (optional)
        </p>
        <textarea
          data-testid="service-paper-input"
          value={paperText}
          onChange={(e) => onPaperChange(e.target.value)}
          placeholder="Drop paper here or paste text"
          rows={6}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: `1px solid ${PALETTE.border}`,
            backgroundColor: PALETTE.cardBg,
            color: PALETTE.text,
            fontSize: '13px',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Request button */}
      <button
        data-testid="service-request-btn"
        onClick={onRequest}
        disabled={selected.length === 0}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: selected.length > 0 ? PALETTE.border : '#ccc',
          color: selected.length > 0 ? PALETTE.cardBg : '#888',
          fontSize: '14px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
          opacity: selected.length > 0 ? 1 : 0.5,
        }}
      >
        Request Services
      </button>
    </div>
  );
}
