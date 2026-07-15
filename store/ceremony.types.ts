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

/**
 * Five-band classification of WCI composite scores.
 *
 * | Band | Threshold | Epistemic meaning |
 * |------|-----------|-------------------|
 * | landmark | $s \geq 85$ | Changes the field |
 * | significant | $s \geq 70$ | Advances the field |
 * | promising | $s \geq 55$ | Contributes meaningfully |
 * | developing | $s \geq 40$ | Foundations present, work to do |
 * | early-stage | $s < 40$ | Beginning of the journey |
 *
 * @remarks
 * Bands are not grades. A null-result paper scoring 'developing' has done
 * something genuinely hard — demonstrated absence of effect — and may be
 * doing it appropriately given the work type. The band contextualises the
 * score among comparable work; it does not judge the maker's effort.
 */
export type Band =
  | 'landmark'
  | 'significant'
  | 'promising'
  | 'developing'
  | 'early-stage';

/**
 * The nine WCI evaluation dimensions.
 * N=Novelty, E=Evidence Density, P=Predictive Power, C=Theoretical Coherence,
 * S=Parsimony, Sc=Scope, L=Literature Integration, M=Claim-Evidence Match, D=Demarcation.
 */
export type Dimension = 'N' | 'E' | 'P' | 'C' | 'S' | 'Sc' | 'L' | 'M' | 'D';

export interface DimensionScore {
  dimension: Dimension;
  /** Raw score $r_i \in [1, 10]$ assigned by the evaluation instrument. */
  rawScore: number;
  /** Dimension weight $w_i$ from the WCI weight vector $\mathbf{w}$. */
  weight: number;
  /** Weighted contribution $w_i \cdot r_i$ to the composite score. */
  weightedScore: number;
  /** The evaluator's reasoning for this dimension score — cited in the Pronouncement. */
  justification: string;
  /** The passage from the work most relevant to this dimension, if identified. */
  keyPassage: string | null;
}

/**
 * The output of the dikaiopompeia ceremony — a complete evaluation record.
 *
 * The composite score is computed as:
 * $$s = \frac{\sum_{i=1}^{9} w_i \cdot r_i}{9.8} \times 10$$
 *
 * where the weight vector is
 * $\mathbf{w} = (1.0,\ 1.5,\ 1.2,\ 1.0,\ 1.0,\ 0.8,\ 1.0,\ 1.5,\ 0.8)$
 * and each raw dimension score $r_i \in [1, 10]$.
 * The denominator 9.8 normalises the weighted sum to $s \in [0, 100]$
 * given $D = \sum_i w_i \cdot 10 = 98$ and the factor of 10.
 *
 * @invariants
 * - $s \in [0, 100]$ — enforced by the formula; no dimension weighting escapes this range.
 * - `provenance` is immutable after creation — the epistemic basis of a score
 *   cannot be retroactively revised.
 * - `dimensionScores` always has exactly 9 entries — one per WCI dimension.
 */
export interface WCIResult {
  compositeScore: number;
  band: Band;
  dimensionScores: DimensionScore[];
  epistemicLabel: string;
  relativeContext: string;
  rubricVersion: string;
  evaluationDate: string;
  /**
   * Epistemic provenance of the WCI evaluation.
   *
   * - `cold`: no prior session context; score derived from text alone
   * - `warm`: prior evaluations exist; score informed by submission trajectory
   * - `iterative`: maker has revised and re-submitted; score reflects iteration
   *
   * Provenance is surfaced to the maker in the Pronouncement (Beat VIII) as
   * the epistemic label — "close read", "warm read", or "iterative read".
   * It qualifies the score without invalidating it.
   */
  provenance: 'cold' | 'warm' | 'iterative';
}

// ── Woodchipper reading (native — no WCI) ──────────────────────

/**
 * Woodchipper's reading of the work. This is NOT a score.
 * It situates the user, identifies what the work is, where it stands,
 * and what could help it move forward.
 *
 * WCI scoring is a separate, optional service that only runs when
 * the user explicitly selects the credibility evaluation route.
 * Woodchipper's reading has no dependency on WCI.
 */
export interface WoodchipperReading {
  /** What stage the work is at: ideas, early-draft, working-draft, near-final, published */
  workStage: string;
  /** Why Woodchipper placed the work at this stage — cites textual evidence */
  stageReasoning: string;
  /** What Woodchipper thinks the work is — specific categorization */
  categorization: string;
  /** What reads well — strengths identified, citing actual content */
  strengths: string[];
  /** Where development could help — citing what's missing */
  developmentAreas: string[];
  /** Gap between claims and content — always assessed */
  claimsGap: string | null;
  /** Title-scope alignment — always filled. Infers title if none provided. */
  titleAlignment: string;
  /** What the work bears on — cross-disciplinary implications */
  bearings: string[];
  /** Future directions the work opens */
  futureDirections: string[];
  /** Unintended discoveries — outputs outside original pursuit */
  unintendedDiscoveries: string[];
  /** Basis of the reading — what Woodchipper saw and how much it had to work with */
  basis: string;
  /** Relative context — how this work sits among comparable efforts */
  relativeContext: string | null;
  /** Revision notes — only present on re-evaluations after revision */
  revisionNotes?: string[];
}

// ── Recording types ───────────────────────────────────────────

export type RecordingChoice = 'view-only' | 'private' | 'public' | null;

export type Property = 'boards' | 'observatory' | 'zenodo' | 'orcid';

// ── Fit Assessment types ──────────────────────────────────────

export interface FitOption {
  id: string;
  label: string;
  description: string;
}

export interface FitAssessmentResult {
  trigger: string | null;
  whatWeRead: string | null;
  whyThisMatters: string | null;
  options: FitOption[];
  proceedAnyway: boolean;
}

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
