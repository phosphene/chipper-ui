/**
 * CeremonyFlow — T-268, T-269
 *
 * Orchestrates the full dikaiopompeia — stages I–VII.
 * Uses ceremony store currentStage to decide what to render.
 *
 * SoC: stage routing here, zero business logic.
 * Each stage component is self-contained; this component switches between them.
 */
'use client';

import { useCeremonyStore } from '@/store/ceremony';
import { AccordionStage } from '@/components/accordion/AccordionStage';
import { getStageSummaryChips } from '@/store/ceremony.selectors';
import { StageI }   from './stages/StageI';
import { StageII }  from './stages/StageII';
import { StageIII } from './stages/StageIII';
import { StageIV }  from './stages/StageIV';
import { StageV }   from './stages/StageV';
import { Opening } from './Opening';
import { Threshold } from './Threshold';
import { Processing } from './Processing';
import type { Stage } from '@/store/ceremony.types';
import { Pronouncement } from './Pronouncement';
import { Recording } from './Recording';

interface Props {
  onScoreReady: () => void;  // called after processing → reveal score (Stage VIII)
  onDecline: () => void;     // called when maker declines at Stage IV
}

type StageConfig = {
  id: Stage;
  stepNum: string;
  label: string;
  title: string;
  component: React.ReactNode;
};

export function CeremonyFlow({ onScoreReady, onDecline }: Props) {
  const store = useCeremonyStore();
  const current = store.currentStage;

  const isActive  = (s: Stage) => current === s;
  const isDone    = (s: Stage) => store.completedStages.has(s);
  const isLocked  = (s: Stage) => !isDone(s) && current !== s;
  const chips     = (s: Stage) => getStageSummaryChips(store, s);

  const handleRested = () => {
    // store.rest() already called inside StageV; just transition view
  };

  // Demo fallback result — used only if API call fails
  const DEMO_RESULT: import('@/store/ceremony.types').WCIResult = {
    compositeScore: 0,
    band: 'promising',
    dimensionScores: [],
    epistemicLabel: '',
    relativeContext: '',
    rubricVersion: '1.0',
    evaluationDate: new Date().toISOString(),
    provenance: 'warm',
  };

  const handleReveal = () => {
    // Unused legacy handler — real scoring happens in handleRealReveal
    store.setWCIResult(DEMO_RESULT);
    onScoreReady();
  };

  // Opening — presided review welcome, before any stage
  if (!store.openingAcknowledged) {
    return <Opening onBegin={() => store.acknowledgeOpening()} />;
  }

  // Dark screens — full viewport, no accordion wrapper
  if (isActive('VI')) {
    return <Threshold onProceed={() => store.crossThreshold()} />;
  }

  if (isActive('VII')) {
    return (
      <Processing
        onReveal={async () => {
          const state = useCeremonyStore.getState();
          const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://wci-api.fly.dev';

          try {
            const res = await fetch(`${apiBase}/api/score`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: state.makerDeclaration?.freeText ?? '',
                work_type: state.workClassification?.workType.value ?? 'original-argument',
                standing: state.makerDeclaration?.standing.value ?? 'independent-researcher',
                domain: state.judgeIdentity?.domain.value ?? 'general',
              }),
            });

            if (res.ok) {
              const data = await res.json();
              // Map snake_case API response to camelCase store types
              store.setWCIResult({
                compositeScore: data.composite_score,
                band: data.band,
                dimensionScores: (data.dimension_scores ?? []).map((d: any) => ({
                  dimension: d.dimension,
                  rawScore: d.raw_score,
                  weight: d.weight,
                  weightedScore: d.weighted_score,
                  justification: d.justification,
                  keyPassage: d.key_passage ?? null,
                })),
                epistemicLabel: data.epistemic_label ?? '',
                relativeContext: data.relative_context ?? '',
                rubricVersion: data.rubric_version ?? '1.0',
                evaluationDate: new Date().toISOString(),
                provenance: data.provenance ?? 'cold',
              });
            } else {
              // Fall back to demo if API fails
              store.setWCIResult(DEMO_RESULT);
            }
          } catch {
            store.setWCIResult(DEMO_RESULT);
          }

          store.revealScore();
          onScoreReady();
        }}
      />
    );
  }

  // Stage VIII: Pronouncement — full-page reading surface
  if (isActive('VIII')) {
    return (
      <Pronouncement
        onProceedToRecording={() => store.advanceStage()}
        onRequestImprovement={() => {/* T-276 — improvement rounds */}}
        onExport={() => {/* T-271 — export */}}
      />
    );
  }

  // Stage IX: The Recording — maker chooses what becomes of the judgment
  if (isActive('IX')) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Recording onDone={() => store.advanceStage()} />
      </div>
    );
  }

  // Intake stages I–V in accordion
  const stages: StageConfig[] = [
    { id: 'I',   stepNum: 'I',   label: 'Stage I',        title: 'Maker Declaration',  component: <StageI /> },
    { id: 'II',  stepNum: 'II',  label: 'Stage II',       title: 'Work Classification', component: <StageII /> },
    { id: 'III', stepNum: 'III', label: 'Stage III',      title: 'Judge Identification', component: <StageIII /> },
    { id: 'IV',  stepNum: 'IV',  label: 'Stage IV',       title: 'Frame Agreement',     component: <StageIV onDecline={onDecline} /> },
    { id: 'V',   stepNum: 'V',   label: 'The Resting',    title: 'Close Your Case',     component: <StageV onRested={handleRested} /> },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {stages.map(({ id, stepNum, label, title, component }) => (
        <AccordionStage
          key={id}
          stepNum={stepNum}
          stageLabel={label}
          title={title}
          chips={chips(id)}
          isActive={isActive(id)}
          isDone={isDone(id)}
          isLocked={isLocked(id)}
          onToggle={() => {}}
        >
          {component}
        </AccordionStage>
      ))}
    </div>
  );
}
