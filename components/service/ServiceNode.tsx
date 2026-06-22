'use client';
/**
 * ServiceNode — Single service node card.
 *
 * Renders a service's current lifecycle state with the solemn palette.
 * Passive — receives state, renders it. No local state management.
 *
 * @module ServiceNode
 * @ticket T-381
 */

import type { ServiceType, ServiceNodeState } from './service-board.schema';

// ── DFT manifest (static testid declarations for audit) ──────
// data-testid="service-node-edit-abstract" data-testid="service-node-edit-abstract-status"
// data-testid="service-node-check-citations" data-testid="service-node-check-citations-status"
// data-testid="service-node-spellcheck" data-testid="service-node-spellcheck-status"
// data-testid="service-node-doi-metadata" data-testid="service-node-doi-metadata-status"
// data-testid="service-node-zenodo-record" data-testid="service-node-zenodo-record-status"

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
  errorBorder: '#DC2626',
} as const;

// ── Props ─────────────────────────────────────────────────────

interface ServiceNodeProps {
  serviceType: ServiceType;
  nodeState: ServiceNodeState;
}

// ── Component ─────────────────────────────────────────────────

export function ServiceNode({ serviceType, nodeState }: ServiceNodeProps) {
  const label = SERVICE_LABELS[serviceType];

  const borderStyle = (): React.CSSProperties => {
    switch (nodeState.status) {
      case 'pending':
        return { border: `1px solid ${PALETTE.background}` };
      case 'active':
        return { border: `2px solid ${PALETTE.accent}` };
      case 'complete':
        return { border: `1px solid ${PALETTE.border}` };
      case 'stub':
        return { border: `1px dashed ${PALETTE.border}` };
      case 'failed':
        return { border: `1px solid ${PALETTE.errorBorder}` };
    }
  };

  const statusText = (): string => {
    switch (nodeState.status) {
      case 'pending':
        return 'Queued';
      case 'active':
        return nodeState.statusText;
      case 'complete': {
        const output = nodeState.result.output;
        const summary = output.length > 80 ? output.slice(0, 80) + '…' : output;
        return `✓ Complete — ${summary}`;
      }
      case 'stub':
        return `→ Would submit to ${label}`;
      case 'failed':
        return nodeState.error;
    }
  };

  return (
    <div
      data-testid={`service-node-${serviceType}`}
      data-state={nodeState.status}
      style={{
        ...borderStyle(),
        backgroundColor: PALETTE.cardBg,
        borderRadius: '8px',
        padding: '16px',
        color: PALETTE.text,
      }}
      className={nodeState.status === 'active' ? 'animate-pulse' : undefined}
    >
      <p
        style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '8px',
          color: PALETTE.text,
        }}
      >
        {label}
      </p>
      <p
        data-testid={`service-node-${serviceType}-status`}
        style={{
          fontSize: '13px',
          color: nodeState.status === 'failed' ? PALETTE.errorBorder : PALETTE.text,
          fontStyle: nodeState.status === 'stub' ? 'italic' : 'normal',
          opacity: nodeState.status === 'pending' ? 0.6 : 1,
        }}
      >
        {statusText()}
      </p>
    </div>
  );
}
