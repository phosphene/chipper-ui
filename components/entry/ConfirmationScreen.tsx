'use client';
/**
 * ConfirmationScreen — Layer 4: GOV.UK "Check your answers" pattern.
 *
 * The system reflects its complete understanding back to the maker.
 * All entered data shown as key-value pairs with Change links.
 * Change links navigate back to the relevant stage via callbacks.
 *
 * @see {@link https://design-system.service.gov.uk/patterns/check-answers/} GOV.UK Design System.
 *   "Check answers pattern." The canonical implementation this component follows.
 *
 * @remarks
 * Change links navigate to specific stages rather than a generic "edit mode"
 * because precision reduces cognitive load at the moment of highest stakes.
 * The maker should land exactly where the data lives — not hunt for it.
 * Confirmation is already high-load; routing shortcuts are not a kindness,
 * they are a necessity.
 *
 * T-395
 */

import { useCallback } from 'react';
import type { MakerRole, CreatorType, WorkTypeValue } from '@/components/entry/Stage2';
import type { IntentValue } from '@/components/entry/IntentSelection';
import type { RouteValue } from '@/components/entry/RouteSelection';

// ── Display maps ─────────────────────────────────────────────

const ROLE_LABELS: Record<MakerRole, string> = {
  student: 'Student',
  scholar: 'Scholar',
  practitioner: 'Practitioner',
};

const CREATOR_LABELS: Record<CreatorType, string> = {
  sole: 'Sole creator',
  'co-creator': 'Co-creator',
  llm: 'LLM',
  'llm-assisted': 'LLM-assisted creator',
};

const WORK_TYPE_LABELS: Record<WorkTypeValue, string> = {
  'original-argument': 'Original Argument',
  'null-result': 'Null Result',
  replication: 'Replication',
  'synthesis-review': 'Synthesis or Review',
  methodological: 'Methodological Contribution',
  evidentiary: 'Evidentiary Finding',
  none: 'None specified',
};

const INTENT_LABELS: Record<IntentValue, string> = {
  assess: 'Assess',
  develop: 'Develop',
  publish: 'Publish',
  register: 'Register & Index',
};

const ROUTE_LABELS: Record<RouteValue, string> = {
  'quick-review': 'Quick summary review',
  wci: 'Credibility evaluation',
  'full-eval': 'Full evaluation + recommendations',
  impact: 'Impact assessment',
  'title-framing': 'Title and framing',
  improvement: 'Improvement rounds',
  registry: 'Woodchipper registry',
  journal: 'Journal submission export',
  observatory: 'Submit to Observatory.wiki',
  export: 'Print / export',
  uri: 'Woodchipper URI',
  orcid: 'ORCID work record',
  doi: 'DOI via Zenodo',
  arxiv: 'arXiv deposit',
  sherpa: 'SHERPA/RoMEO check',
};

// ── Props ────────────────────────────────────────────────────

export interface ConfirmationData {
  description: string;
  uploadFilename: string | null;
  role: MakerRole;
  creatorType: CreatorType;
  workType: WorkTypeValue;
  domains: string[];
  intents: IntentValue[];
  routes: RouteValue[];
}

export interface ConfirmationScreenProps {
  data: ConfirmationData;
  /** Navigate back to a specific stage to change an answer */
  onChangeField: (field: keyof ConfirmationData) => void;
  /** Confirm and proceed to Layer 5 */
  onConfirm: () => void;
}

// ── Row component ────────────────────────────────────────────

interface ConfirmRowProps {
  label: string;
  value: string;
  testId: string;
  changeTestId?: string;
  onChangeClick?: () => void;
}

function ConfirmRow({ label, value, testId, changeTestId, onChangeClick }: ConfirmRowProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        <dt className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-0.5">
          {label}
        </dt>
        <dd data-testid={testId} className="text-sm text-gray-900 break-words">
          {value}
        </dd>
      </div>
      {onChangeClick && changeTestId && (
        <button
          data-testid={changeTestId}
          onClick={onChangeClick}
          className="ml-4 flex-shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Change
        </button>
      )}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────

export function ConfirmationScreen({ data, onChangeField, onConfirm }: ConfirmationScreenProps) {
  const handleChange = useCallback(
    (field: keyof ConfirmationData) => () => onChangeField(field),
    [onChangeField]
  );

  const descriptionDisplay =
    (data.description ?? '').length > 100
      ? data.description.slice(0, 100) + '...'
      : (data.description ?? '');

  const uploadDisplay = data.uploadFilename ?? 'None';

  const domainDisplay = (data.domains ?? []).length > 0
    ? data.domains.join(', ')
    : 'None selected';

  const intentDisplay = (data.intents ?? []).map(i => INTENT_LABELS[i] ?? i).join(', ') || 'None selected';

  const routeDisplay = (data.routes ?? []).map(r => ROUTE_LABELS[r] ?? r).join(', ') || 'None selected';

  return (
    <div data-testid="layer-4-confirmation" className="space-y-6">
      {/* ── Header ── */}
      <div className="space-y-1">
        <h2 className="text-xl font-light text-black leading-tight">
          Before we begin
        </h2>
        <p className="text-sm text-gray-500">
          Check that we&rsquo;ve understood your work correctly. Change anything that&rsquo;s wrong.
        </p>
      </div>

      {/* ── Summary rows ── */}
      <dl className="divide-y divide-gray-100">
        <ConfirmRow
          label="Work description"
          value={descriptionDisplay}
          testId="confirm-description"
          changeTestId="confirm-description-change"
          onChangeClick={handleChange('description')}
        />

        <ConfirmRow
          label="Upload"
          value={uploadDisplay}
          testId="confirm-upload"
        />

        <ConfirmRow
          label="Role"
          value={ROLE_LABELS[data.role] ?? data.role ?? 'Not specified'}
          testId="confirm-role"
          changeTestId="confirm-role-change"
          onChangeClick={handleChange('role')}
        />

        <ConfirmRow
          label="Creator"
          value={CREATOR_LABELS[data.creatorType] ?? data.creatorType ?? 'Not specified'}
          testId="confirm-creator"
          changeTestId="confirm-creator-change"
          onChangeClick={handleChange('creatorType')}
        />

        <ConfirmRow
          label="Work type"
          value={WORK_TYPE_LABELS[data.workType] ?? data.workType ?? 'Not specified'}
          testId="confirm-work-type"
          changeTestId="confirm-work-type-change"
          onChangeClick={handleChange('workType')}
        />

        <ConfirmRow
          label="Domain"
          value={domainDisplay}
          testId="confirm-domain"
          changeTestId="confirm-domain-change"
          onChangeClick={handleChange('domains')}
        />

        <ConfirmRow
          label="Intents"
          value={intentDisplay}
          testId="confirm-intents"
        />

        <ConfirmRow
          label="Routes"
          value={routeDisplay}
          testId="confirm-routes"
        />
      </dl>

      {/* ── Confirm button ── */}
      <button
        data-testid="layer-4-confirm-btn"
        onClick={onConfirm}
        className="w-full py-4 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 cursor-pointer transition-all"
      >
        This is correct — begin
      </button>
    </div>
  );
}
