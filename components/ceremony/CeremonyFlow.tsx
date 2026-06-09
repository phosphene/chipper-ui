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
import { Threshold } from './Threshold';
import { Processing } from './Processing';
import type { Stage } from '@/store/ceremony.types';

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

  const handleReveal = () => {
    store.setWCIResult({
      compositeScore: 0,     // placeholder — real score arrives via API in T-276
      band: 'promising',
      dimensionScores: [],
      epistemicLabel: '',
      relativeContext: '',
      rubricVersion: '1.0',
      evaluationDate: new Date().toISOString(),
      provenance: 'warm',
    });
    onScoreReady();
  };

  // Dark screens — full viewport, no accordion wrapper
  if (isActive('VI')) {
    return <Threshold onProceed={() => store.crossThreshold()} />;
  }

  if (isActive('VII')) {
    return (
      <Processing
        onReveal={() => {
          store.setWCIResult({
            compositeScore: 0,
            band: 'promising',
            dimensionScores: [],
            epistemicLabel: 'corpus-level',
            relativeContext: '',
            rubricVersion: '1.0',
            evaluationDate: new Date().toISOString(),
            provenance: 'warm',
          });
          store.revealScore();
          onScoreReady();
        }}
      />
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
