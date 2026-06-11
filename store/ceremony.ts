/**
 * Zustand ceremony store — pure TypeScript, no React imports.
 * All business logic lives here. Invariants throw, not silent no-ops.
 *
 * T-265: Zustand ceremony store
 * T-282: Store testability-first implementation
 */

import { create } from 'zustand';
import type {
  Stage,
  MakerDeclaration,
  WorkClassification,
  JudgeIdentity,
  FrameAgreement,
  WCIResult,
  RecordingChoice,
  Property,
  DetectionResult,
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

  // Score
  wciResult: WCIResult | null;

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

  // Actions — score
  setWCIResult: (result: WCIResult) => void;

  // Reset
  reset: () => void;
}

// ── Initial state ─────────────────────────────────────────────

const initialState = {
  makerDeclaration: null,
  workClassification: null,
  judgeIdentity: null,
  frameAgreement: null,
  currentStage: 'I' as Stage,
  completedStages: new Set<Stage>(),
  processingComplete: false,
  processingDimensions: new Set<string>(),
  wciResult: null,
  recordingChoice: null as RecordingChoice,
  selectedProperties: new Set<Property>(),
};

// ── Store ─────────────────────────────────────────────────────

export const useCeremonyStore = create<CeremonyState>()((set, get) => ({
  ...initialState,

  initFromDetection: (result: DetectionResult) => set({
    makerDeclaration: {
      freeText: '',
      standing: { value: result.standing, source: 'detected' },
      tradition: { value: result.domain, source: 'detected' },
      relationshipToWork: { value: 'Primary author', source: 'detected' },
    },
    workClassification: {
      workType: { value: result.workType, source: 'detected' },
      description: '',
    },
    judgeIdentity: {
      domain: { value: result.domain, source: 'detected' },
      instrumentVersion: 'WCI v1.0',
      variantAvailable: false,
      variantName: null,
      corpusSize: 0,
      contentConfidence: result.confidence,
    },
    frameAgreement: {
      consent1: false,
      consent2: false,
      lastWord: '',
    },
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
    const state = get();
    if (!isIntakeComplete(state)) {
      throw new StageAdvanceError('Cannot rest: intake not complete');
    }
    set((s) => ({
      completedStages: new Set([...s.completedStages, 'V' as Stage]),
      currentStage: 'VI' as Stage,
    }));
  },

  crossThreshold: () => {
    const state = get();
    if (!canCrossThreshold(state)) {
      throw new StageAdvanceError('Cannot cross threshold: intake not complete');
    }
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

  setWCIResult: (result) => set({
    wciResult: result,
    processingComplete: true,
  }),

  reset: () => set({ ...initialState,
    completedStages: new Set<Stage>(),
    processingDimensions: new Set<string>(),
    selectedProperties: new Set<Property>(),
  }),
}));
