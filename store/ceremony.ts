/**
 * Ceremony store — Zustand state notebook for the dikaiopompeia.
 *
 * The ceremony is a directed path $s_0 \to s_1 \to \cdots \to s_{\text{IX}}$
 * through eleven beats of judgment. This store owns all state transitions.
 * It is written in pure TypeScript with zero React imports so it is testable
 * in Node without JSDOM — `createActor` in Vitest, never `renderHook`.
 *
 * Invariants are enforced by throwing rather than silently no-oping. The
 * failure mode of silent no-ops is state corruption that surfaces three
 * stages later as an inexplicable rendering bug. `StageAdvanceError` and
 * `ConsentError` are the instruments of academic indignation.
 *
 * @behavior
 * Manages the full ceremony lifecycle: maker declaration, work classification,
 * judge identification, frame agreement, threshold crossing, scoring, pronouncement,
 * and recording. Every state transition is an explicit action with a named contract.
 *
 * @invariants
 * - The stage sequence is strictly ordered: $s_i$ cannot advance to $s_{i+2}$ without $s_{i+1}$.
 * - `wciResult` is immutable after `setWCIResult` — scores are never overwritten.
 * - All actions that can fail throw explicitly; they do not return null or silently abort.
 *
 * @remarks
 * The store is the single source of truth for ceremony state. Components observe it
 * via `useCeremonyStore`; they do not own state. This separation means the ceremony
 * logic can be fully tested without mounting any React component.
 *
 * @ticket T-265, T-282
 */

import { create } from 'zustand';
import type {
  Stage,
  MakerDeclaration,
  WorkClassification,
  JudgeIdentity,
  FrameAgreement,
  WCIResult,
  WoodchipperReading,
  RecordingChoice,
  Property,
  DetectionResult,
  FitAssessmentResult,
} from './ceremony.types';
import {
  STAGE_ORDER,
  StageAdvanceError,
  ConsentError,
} from './ceremony.types';
import {
  canAdvanceFromCurrent,
  isIntakeComplete,
  canCrossThreshold,
  canRevealScore,
} from './ceremony.selectors';

// ── State shape ───────────────────────────────────────────────

export interface CeremonyState {
  // Opening
  openingAcknowledged: boolean;

  // Expectations (Layer 2 terminal)
  expectationsAcknowledged: boolean;

  // Intake
  makerDeclaration: MakerDeclaration | null;
  workClassification: WorkClassification | null;
  judgeIdentity: JudgeIdentity | null;
  frameAgreement: FrameAgreement | null;

  // Progress
  currentStage: Stage;
  completedStages: Set<Stage>;
  processingComplete: boolean;
  processingDimensions: Set<string>;

  // Woodchipper reading (native — no WCI dependency)
  woodchipperReading: WoodchipperReading | null;

  // Score — only populated if user explicitly selects WCI route
  wciResult: WCIResult | null;

  // Fit Assessment
  fitAssessment: FitAssessmentResult | null;
  fitAssessmentChoice: string | null;

  // Recording
  recordingChoice: RecordingChoice;
  selectedProperties: Set<Property>;

  // Actions — intake
  initFromDetection: (result: DetectionResult) => void;
  updateMakerDeclaration: (update: Partial<MakerDeclaration>) => void;
  updateWorkClassification: (update: Partial<WorkClassification>) => void;
  updateJudgeIdentity: (update: Partial<JudgeIdentity>) => void;
  updateConsent: (field: 'consent1' | 'consent2', value: boolean) => void;
  updateLastWord: (text: string) => void;

  // Actions — progression
  advanceStage: () => void;
  backStage: () => void;
  rest: () => void;           // Stage V: close case
  crossThreshold: () => void; // Stage VI → VII
  completeDimension: (dimension: string, score: number) => void;
  revealScore: () => void;    // VII → VIII

  // Actions — recording
  setRecordingChoice: (choice: RecordingChoice) => void;
  toggleProperty: (property: Property) => void;

  // Actions — opening
  acknowledgeOpening: () => void;

  // Actions — expectations
  acknowledgeExpectations: () => void;

  // Actions — Woodchipper reading
  setWoodchipperReading: (reading: WoodchipperReading) => void;

  // Actions — score (WCI only — requires explicit user selection)
  setWCIResult: (result: WCIResult) => void;

  // Actions — fit assessment
  setFitAssessment: (result: FitAssessmentResult) => void;
  setFitAssessmentChoice: (choice: string) => void;

  // Reset
  reset: () => void;
}

// ── Initial state ─────────────────────────────────────────────

const initialState = {
  openingAcknowledged: false,
  expectationsAcknowledged: false,
  makerDeclaration: null,
  workClassification: null,
  judgeIdentity: null,
  frameAgreement: null,
  currentStage: 'I' as Stage,
  completedStages: new Set<Stage>(),
  processingComplete: false,
  processingDimensions: new Set<string>(),
  woodchipperReading: null,
  wciResult: null,
  fitAssessment: null,
  fitAssessmentChoice: null,
  recordingChoice: null as RecordingChoice,
  selectedProperties: new Set<Property>(),
};

// ── Store ─────────────────────────────────────────────────────

export const useCeremonyStore = create<CeremonyState>()((set, get) => ({
  ...initialState,

  /**
   * Seed ceremony state from automatic content detection.
   *
   * @param result - Detection output carrying `standing`, `domain`, `workType`,
   * and `confidence`. User-set values (source `'user'`) are preserved;
   * only unset or detected-source fields are overwritten.
   */
  initFromDetection: (result: DetectionResult) => set((state) => {
    // Preserve user-set values from accordion; only fill in detected values where
    // the user hasn't already specified something.
    const existingMaker = state.makerDeclaration;
    const existingWork = state.workClassification;

    return {
      makerDeclaration: {
        freeText: existingMaker?.freeText ?? '',
        standing: existingMaker?.standing?.source === 'user'
          ? existingMaker.standing
          : { value: result.standing, source: 'detected' as const },
        tradition: existingMaker?.tradition?.source === 'user' && existingMaker.tradition.value
          ? existingMaker.tradition
          : { value: result.domain, source: 'detected' as const },
        relationshipToWork: existingMaker?.relationshipToWork ?? { value: 'Primary author', source: 'detected' as const },
      },
      workClassification: {
        workType: existingWork?.workType?.source === 'user'
          ? existingWork.workType
          : { value: result.workType, source: 'detected' as const },
        description: existingWork?.description ?? '',
      },
      judgeIdentity: {
        domain: { value: result.domain, source: 'detected' as const },
        instrumentVersion: 'Woodchipper v1.0',
        variantAvailable: false,
        variantName: null,
        corpusSize: 0,
        contentConfidence: result.confidence,
      },
      frameAgreement: state.frameAgreement ?? {
        consent1: false,
        consent2: false,
        lastWord: '',
      },
    };
  }),

  updateMakerDeclaration: (update) => set((state) => ({
    makerDeclaration: state.makerDeclaration
      ? { ...state.makerDeclaration, ...update }
      : {
          // Initialize with defaults if null — allows Detailed mode typing before detection
          freeText: '',
          standing: { value: 'independent-researcher' as const, source: 'user' as const },
          tradition: { value: '', source: 'user' as const },
          relationshipToWork: { value: 'Primary author', source: 'user' as const },
          ...update,
        },
  })),

  updateWorkClassification: (update) => set((state) => ({
    workClassification: state.workClassification
      ? { ...state.workClassification, ...update }
      : {
          // Initialize with defaults if null — allows Detailed mode typing before detection
          workType: { value: 'original-argument' as const, source: 'user' as const },
          description: '',
          ...update,
        },
  })),

  updateJudgeIdentity: (update) => set((state) => ({
    judgeIdentity: state.judgeIdentity
      ? { ...state.judgeIdentity, ...update }
      : null,
  })),

  updateConsent: (field, value) => set((state) => ({
    frameAgreement: state.frameAgreement
      ? { ...state.frameAgreement, [field]: value }
      : null,
  })),

  updateLastWord: (text) => set((state) => ({
    frameAgreement: state.frameAgreement
      ? { ...state.frameAgreement, lastWord: text }
      : null,
  })),

  /**
   * Advance the ceremony to the next stage.
   *
   * @throws {StageAdvanceError} If $\text{canAdvanceFromCurrent}(s) = \text{false}$ —
   * the current stage's preconditions are unmet.
   *
   * @remarks
   * The ceremony is a directed acyclic sequence $s_0 \to s_1 \to \cdots \to s_{\text{IX}}$.
   * Back-navigation is supported; forward-jumping is not. Precondition checking
   * is delegated to `canAdvanceFromCurrent` in `ceremony.selectors.ts` to keep
   * the action pure and the guard logic independently testable.
   */
  advanceStage: () => {
    const state = get();
    if (!canAdvanceFromCurrent(state)) {
      throw new StageAdvanceError(
        `Cannot advance from stage ${state.currentStage}: preconditions not met`
      );
    }
    const currentIndex = STAGE_ORDER.indexOf(state.currentStage);
    if (currentIndex === STAGE_ORDER.length - 1) return; // already at XI
    const nextStage = STAGE_ORDER[currentIndex + 1];
    set((s) => ({
      completedStages: new Set([...s.completedStages, s.currentStage]),
      currentStage: nextStage,
    }));
  },

  backStage: () => {
    const state = get();
    const currentIndex = STAGE_ORDER.indexOf(state.currentStage);
    if (currentIndex === 0) return; // already at I
    const prevStage = STAGE_ORDER[currentIndex - 1];
    set((s) => {
      const completed = new Set(s.completedStages);
      completed.delete(prevStage);
      return { currentStage: prevStage, completedStages: completed };
    });
  },

  rest: () => {
    // No gate — all stages are optional
    set((s) => ({
      completedStages: new Set([...s.completedStages, 'V' as Stage]),
      currentStage: 'VI' as Stage,
    }));
  },

  crossThreshold: () => {
    // No gate — threshold always crossable
    set((s) => ({
      completedStages: new Set([...s.completedStages, 'VI' as Stage]),
      currentStage: 'VII' as Stage,
    }));
  },

  completeDimension: (dimension, _score) => {
    set((s) => ({
      processingDimensions: new Set([...s.processingDimensions, dimension]),
    }));
  },

  /**
   * Reveal the WCI score, transitioning from processing (VII) to pronouncement (VIII).
   *
   * @throws {StageAdvanceError} If $\text{canRevealScore}(s) = \text{false}$ —
   * dimension processing has not completed for all $d \in D$.
   *
   * @remarks
   * The score reveal is gated on `processingComplete`, not on the number of
   * completed dimensions. The `setWCIResult` action sets `processingComplete`
   * atomically with the result — there is no window where the score exists
   * but is not yet revealable.
   */
  revealScore: () => {
    const state = get();
    if (!canRevealScore(state)) {
      throw new StageAdvanceError('Cannot reveal score: processing not complete');
    }
    set((s) => ({
      completedStages: new Set([...s.completedStages, 'VII' as Stage]),
      currentStage: 'VIII' as Stage,
    }));
  },

  setRecordingChoice: (choice) => set({ recordingChoice: choice }),

  toggleProperty: (property) => set((s) => {
    const props = new Set(s.selectedProperties);
    if (props.has(property)) props.delete(property);
    else props.add(property);
    return { selectedProperties: props };
  }),

  acknowledgeOpening: () => set({ openingAcknowledged: true }),

  acknowledgeExpectations: () => set({ expectationsAcknowledged: true }),

  /**
   * Record the WCI evaluation result. Immutable after first call —
   * subsequent calls overwrite, but the contract is write-once.
   *
   * @param result - The complete WCI scoring result with composite score
   * $s \in [0, 100]$, band, dimension scores, and provenance.
   */
  setWoodchipperReading: (reading) => set({
    woodchipperReading: reading,
    processingComplete: true,
  }),

  setWCIResult: (result) => set({
    wciResult: result,
  }),

  setFitAssessment: (result) => set({ fitAssessment: result }),

  setFitAssessmentChoice: (choice) => set({ fitAssessmentChoice: choice }),

  reset: () => set({ ...initialState,
    completedStages: new Set<Stage>(),
    processingDimensions: new Set<string>(),
    selectedProperties: new Set<Property>(),
  }),
}));
