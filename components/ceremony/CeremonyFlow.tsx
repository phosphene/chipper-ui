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
import { Pronouncement } from './Pronouncement';

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
          // Seed demo result — real scores arrive from wci-api in T-276
          store.setWCIResult({
            compositeScore: 62,
            band: 'promising',
            dimensionScores: [
              { dimension: 'N',  rawScore: 4.0, weight: 1.0, weightedScore: 4.0,   justification: 'Structurally expected for a null result.', keyPassage: null },
              { dimension: 'E',  rawScore: 8.0, weight: 1.5, weightedScore: 12.0,  justification: 'Three independent community studies with controlled comparisons.', keyPassage: 'Across all three sites, feedback loop indicators showed no statistically significant deviation from baseline ecological variation (p > 0.3).' },
              { dimension: 'P',  rawScore: 5.0, weight: 1.2, weightedScore: 6.0,   justification: 'General prior applies; no domain variant available.', keyPassage: null },
              { dimension: 'C',  rawScore: 7.0, weight: 1.0, weightedScore: 7.0,   justification: 'Framework holds throughout.', keyPassage: null },
              { dimension: 'S',  rawScore: 7.0, weight: 1.0, weightedScore: 7.0,   justification: 'Economical apparatus.', keyPassage: null },
              { dimension: 'Sc', rawScore: 5.0, weight: 0.8, weightedScore: 4.0,   justification: 'Limited to three study sites.', keyPassage: null },
              { dimension: 'L',  rawScore: 7.0, weight: 1.0, weightedScore: 7.0,   justification: 'Well-situated in prior work.', keyPassage: null },
              { dimension: 'M',  rawScore: 8.5, weight: 1.5, weightedScore: 12.75, justification: 'Excellent calibration. The null finding is stated as a null finding.', keyPassage: 'We do not conclude that niche construction feedback loops are absent — only that they are not detectable at the temporal resolution our methodology affords.' },
              { dimension: 'D',  rawScore: 6.0, weight: 0.8, weightedScore: 4.8,   justification: 'Some boundary conditions stated.', keyPassage: null },
            ],
            epistemicLabel: 'corpus-level — no in-session reading on record',
            relativeContext: 'Null-result papers in behavioral ecology typically score 55–68.',
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
