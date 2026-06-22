'use client';
/**
 * Service Board — View orchestrator.
 *
 * Passive shell that observes the XState service board machine and renders
 * the appropriate sub-component based on current state.
 *
 * @module service-board.view
 * @ticket T-381
 */

import { useCallback } from 'react';
import { useMachine } from '@xstate/react';
import { serviceBoardMachine } from './service-board.machine';
import { requestAllServices } from './service-board.logic';
import { ServiceOptions } from './ServiceOptions';
import { ServiceNode } from './ServiceNode';
import { ResultsPanel } from './ResultsPanel';
import type { ServiceType, ServiceNodeState } from './service-board.schema';

// ── Solemn palette ────────────────────────────────────────────

const PALETTE = {
  background: '#F5F0E8',
  border: '#8B6914',
  text: '#3D2B1F',
} as const;

// ── Props ─────────────────────────────────────────────────────

interface ServiceBoardViewProps {
  wciResult: unknown;
  workText: string;
  workType: string;
  standing: string;
}

// ── Component ─────────────────────────────────────────────────

export function ServiceBoardView({
  wciResult,
  workText,
  workType,
  standing,
}: ServiceBoardViewProps) {
  const [snapshot, send] = useMachine(serviceBoardMachine);

  const stateValue = snapshot.value as string;
  const { selectedServices, paperText, nodeStates, results } = snapshot.context;

  // ── Callbacks ─────────────────────────────────────────────

  const handleToggle = useCallback(
    (serviceType: ServiceType) => {
      if (selectedServices.includes(serviceType)) {
        send({ type: 'DESELECT_SERVICE', serviceType });
      } else {
        send({ type: 'SELECT_SERVICE', serviceType });
      }
    },
    [selectedServices, send],
  );

  const handlePaperChange = useCallback(
    (text: string) => {
      send({ type: 'SET_PAPER', text });
    },
    [send],
  );

  const handleRequest = useCallback(() => {
    send({ type: 'REQUEST_SERVICES' });

    // Fire off all service requests with progress callbacks
    requestAllServices(
      selectedServices,
      {
        workText: paperText || workText,
        evaluation: wciResult,
        context: { standing, workType, domain: '' },
      },
      {
        onNodeUpdate: (serviceType: ServiceType, nodeState: ServiceNodeState) => {
          send({ type: 'SERVICE_UPDATE', serviceType, nodeState });
        },
        onAllComplete: () => {
          send({ type: 'ALL_COMPLETE' });
        },
      },
    );
  }, [selectedServices, paperText, workText, wciResult, standing, workType, send]);

  const handleAcknowledge = useCallback(() => {
    send({ type: 'ACKNOWLEDGE' });
  }, [send]);

  // ── Evaluation band (extract from WCI result if available) ──

  const evaluationBand =
    (wciResult as { band?: string } | null)?.band ?? 'unclassified';

  // ── Render by state ───────────────────────────────────────

  return (
    <div
      data-testid="service-board"
      style={{
        backgroundColor: PALETTE.background,
        minHeight: '100vh',
        padding: '32px',
        color: PALETTE.text,
      }}
    >
      {/* Selection phase */}
      {(stateValue === 'idle' || stateValue === 'services_selected') && (
        <ServiceOptions
          workType={workType}
          standing={standing}
          selected={selectedServices}
          onToggle={handleToggle}
          onPaperChange={handlePaperChange}
          paperText={paperText}
          onRequest={handleRequest}
        />
      )}

      {/* Processing phase — node grid */}
      {(stateValue === 'requesting' || stateValue === 'processing') && (
        <div>
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
              Processing Services
            </p>
            <div style={{ height: '1px', backgroundColor: PALETTE.border }} />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            {selectedServices.map((serviceType) => (
              <ServiceNode
                key={serviceType}
                serviceType={serviceType}
                nodeState={nodeStates[serviceType] ?? { status: 'pending' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Results phase */}
      {stateValue === 'all_complete' && (
        <div>
          <ResultsPanel
            results={results}
            workText={paperText || workText}
            evaluationBand={evaluationBand}
          />
          <div style={{ marginTop: '24px' }}>
            <button
              onClick={handleAcknowledge}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: `1px solid ${PALETTE.border}`,
                backgroundColor: PALETTE.background,
                color: PALETTE.text,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done — View Receipt
            </button>
          </div>
        </div>
      )}

      {/* Final state — compact receipt */}
      {stateValue === 'results_viewed' && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            Services complete.
          </p>
          <p style={{ fontSize: '13px', opacity: 0.7 }}>
            {results.length} service{results.length !== 1 ? 's' : ''} processed. Receipt available above.
          </p>
        </div>
      )}
    </div>
  );
}
