/**
 * Ceremony store types — pure TypeScript, no React imports.
 * All business logic lives here; components are rendering-only.
 *
 * T-265: Zustand ceremony store
 * T-282: Store testability-first
 */

// ── Intake types ──────────────────────────────────────────────

export type WorkType =
  | 'original-argument'
  | 'null-result'
  | 'replication'
  | 'synthesis-review'
  | 'methodological-contribution'
  | 'evidentiary-finding'
  | 'theoretical-framework'
  | 'unknown';

export type MakerStanding =
  | 'graduate-researcher'
  | 'postdoctoral-researcher'
  | 'professor'
  | 'independent-researcher'
  | 'practitioner'
  | 'unknown';

export type ValueSource = 'detected' | 'user';

export interface SourcedValue<T> {
  value: T;
  source: ValueSource;
}

export interface MakerDeclaration {
  freeText: string;
  standing: SourcedValue<MakerStanding>;
  tradition: SourcedValue<string>;
  relationshipToWork: SourcedValue<string>;
}

export interface WorkClassification {
  workType: SourcedValue<WorkType>;
  description: string;
}

export interface JudgeIdentity {
  domain: SourcedValue<string>;
  instrumentVersion: string;
  variantAvailable: boolean;
  variantName: string | null;
  corpusSize: number;
  contentConfidence: 'high' | 'medium' | 'low';
}

export interface FrameAgreement {
  consent1: boolean; // "I understand what this evaluation will and will not recognize"
  consent2: boolean; // "I consent to have my work evaluated on these terms"
  lastWord: string;
}

// ── Stage types ───────────────────────────────────────────────

export type Stage =
  | 'I'   // Maker Declaration
  | 'II'  // Work Classification
  | 'III' // Judge Identification
  | 'IV'  // Frame Agreement
  | 'V'   // The Resting
  | 'VI'  // The Threshold
  | 'VII' // The Processing
  | 'VIII'// The Pronouncement
  | 'IX'  // The Recording
  | 'X'   // The Boards
  | 'XI'; // The Portfolio

export const STAGE_ORDER: Stage[] = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];

// ── Score types ───────────────────────────────────────────────

export type Band =
  | 'landmark'
  | 'significant'
  | 'promising'
  | 'developing'
  | 'early-stage';

export type Dimension = 'N' | 'E' | 'P' | 'C' | 'S' | 'Sc' | 'L' | 'M' | 'D';

export interface DimensionScore {
  dimension: Dimension;
  rawScore: number;
  weight: number;
  weightedScore: number;
  justification: string;
  keyPassage: string | null;
}

export interface WCIResult {
  compositeScore: number;
  band: Band;
  dimensionScores: DimensionScore[];
  epistemicLabel: string;
  relativeContext: string;
  rubricVersion: string;
  evaluationDate: string;
  provenance: 'cold' | 'warm' | 'iterative';
}

// ── Recording types ───────────────────────────────────────────

export type RecordingChoice = 'view-only' | 'private' | 'public' | null;

export type Property = 'boards' | 'observatory' | 'zenodo' | 'orcid';

// ── Detection result (from API) ───────────────────────────────

export interface DetectionResult {
  workType: WorkType;
  domain: string;
  standing: MakerStanding;
  confidence: 'high' | 'medium' | 'low';
  academicMarkersDetected: string[];
}

// ── Store errors ──────────────────────────────────────────────

export class StageAdvanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StageAdvanceError';
  }
}

export class ConsentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConsentError';
  }
}
