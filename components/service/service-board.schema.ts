/**
 * Service board schemas — Effect Schema data contracts for the post-ceremony service layer.
 *
 * Schemas bear the primary documentation burden because they are the source of
 * truth for all data contracts. Types are derived from schemas, not the reverse.
 *
 * The five service types represent two tiers of epistemic difficulty:
 * - Structurally deterministic (spellcheck, doi-metadata): assessed by pattern matching
 *   without domain knowledge; a small model is appropriate.
 * - Judgment-required (check-citations, edit-abstract): require understanding the work's
 *   claims and the literature they reference; a frontier model is necessary.
 * - Infrastructure stub (zenodo-record): the deposit protocol is not yet built, but the
 *   type is present so the UI can surface it as "coming" without a code change.
 *
 * @remarks
 * All exported TypeScript types are derived via `Schema.Schema.Type<typeof X>` — the
 * schema is the source of truth, not a manually maintained interface. This ensures
 * runtime validation and static types from a single declaration.
 *
 * @ticket T-378
 */

import * as S from "@effect/schema/Schema";

// ── Service taxonomy ──────────────────────────────────────────

/**
 * Available service operations, ordered by epistemic complexity.
 *
 * - `spellcheck`: structurally deterministic — pattern matching, no domain knowledge required
 * - `doi-metadata`: structurally deterministic — DataCite schema, no interpretation required
 * - `check-citations`: judgment-required — must understand claims and the cited literature
 * - `edit-abstract`: judgment-required — must understand the work's argument and its register
 * - `zenodo-record`: stub — deposit infrastructure not yet built (T-370); type present for UI
 *
 * Tier assignment lives in `SERVICE_TIER` — not in this union.
 */
export const ServiceType = S.Union(
  S.Literal("edit-abstract"),
  S.Literal("check-citations"),
  S.Literal("spellcheck"),
  S.Literal("doi-metadata"),
  S.Literal("zenodo-record"),
);
export type ServiceType = S.Schema.Type<typeof ServiceType>;

/**
 * Computational tier governing model selection and minimum pacing.
 *
 * - `rules`: deterministic transformation, no LLM
 * - `small`: pattern-aware LLM (e.g. claude-haiku); $t_{\text{min}} \geq 2\ \text{s}$
 * - `frontier`: full judgment LLM (e.g. claude-sonnet); $t_{\text{min}} \geq 4\ \text{s}$
 * - `stub`: infrastructure not yet built; returns gracefully with a descriptive note
 *
 * Tier is invisible to the user. It determines model routing on the backend
 * and minimum display time on the frontend — pacing reflects epistemic weight.
 */
export const ServiceTier = S.Union(
  S.Literal("rules"),
  S.Literal("small"),
  S.Literal("frontier"),
  S.Literal("stub"),
);
export type ServiceTier = S.Schema.Type<typeof ServiceTier>;

// ── Tier + pacing maps (plain const, not schema) ─────────────

/**
 * Maps each service to its computational tier.
 *
 * This is a plain `const` rather than a schema because tier assignment is a
 * routing decision, not a data contract. It governs which model handles the
 * request and how long the UI holds the progress animation — configuration
 * that belongs to the deployment, not to the wire format.
 */
export const SERVICE_TIER: Record<ServiceType, ServiceTier> = {
  "edit-abstract": "frontier",
  "check-citations": "frontier",
  spellcheck: "small",
  "doi-metadata": "frontier",
  "zenodo-record": "stub",
} as const;

/**
 * Minimum display time per tier in milliseconds.
 *
 * Pacing is not deception — it reflects the weight of the service.
 * $t_{\text{rules}} \geq 1\ \text{s}$, $t_{\text{small}} \geq 2\ \text{s}$,
 * $t_{\text{frontier}} \geq 4\ \text{s}$, $t_{\text{stub}} = 0\ \text{s}$.
 *
 * A citation check returning in 200ms signals that nothing was actually checked.
 */
export const PACING_MS: Record<ServiceTier, number> = {
  rules: 1000,
  small: 2000,
  frontier: 4000,
  stub: 0,
} as const;

// ── Node status ───────────────────────────────────────────────

/** Lifecycle status of a single service node on the board. */
export const ServiceNodeStatus = S.Union(
  S.Literal("pending"),
  S.Literal("active"),
  S.Literal("complete"),
  S.Literal("stub"),
  S.Literal("failed"),
);
export type ServiceNodeStatus = S.Schema.Type<typeof ServiceNodeStatus>;

// ── Service result ────────────────────────────────────────────

/** Output type taxonomy for service results. */
export const OutputType = S.Union(
  S.Literal("corrected-paper"),
  S.Literal("report"),
  S.Literal("metadata"),
  S.Literal("record"),
);
export type OutputType = S.Schema.Type<typeof OutputType>;

/** A completed service's output. */
export const ServiceResult = S.Struct({
  serviceType: ServiceType,
  /** The service output text — full corrected content, report, or record draft. */
  output: S.String.annotations({ description: "The service output text — full corrected content, report, or record draft." }),
  /** Semantic kind of the output — determines how the UI renders the result panel. */
  outputType: OutputType.annotations({ description: "Semantic kind of the output — determines how the UI renders the result panel." }),
  changesCount: S.optional(S.Number),
});
export type ServiceResult = S.Schema.Type<typeof ServiceResult>;

// ── Node state (tagged union) ─────────────────────────────────

const PendingState = S.Struct({ status: S.Literal("pending") });
const ActiveState = S.Struct({
  status: S.Literal("active"),
  statusText: S.String,
});
const CompleteState = S.Struct({
  status: S.Literal("complete"),
  result: ServiceResult,
});
const StubState = S.Struct({
  status: S.Literal("stub"),
  note: S.String,
});
const FailedState = S.Struct({
  status: S.Literal("failed"),
  error: S.String,
});

/** Discriminated union over service node lifecycle. */
export const ServiceNodeState = S.Union(
  PendingState,
  ActiveState,
  CompleteState,
  StubState,
  FailedState,
);
export type ServiceNodeState = S.Schema.Type<typeof ServiceNodeState>;

// ── Service request ───────────────────────────────────────────

/** Inbound request to execute a service. */
export const ServiceRequest = S.Struct({
  service: ServiceType,
  workText: S.String,
  evaluation: S.Any,
  context: S.Struct({
    standing: S.String,
    workType: S.String,
    domain: S.String,
  }),
});
export type ServiceRequest = S.Schema.Type<typeof ServiceRequest>;

// ── Board-level context ───────────────────────────────────────

/** Top-level state shape for the service board. */
export const ServiceBoardContext = S.Struct({
  selectedServices: S.Array(ServiceType),
  paperText: S.String,
  nodeStates: S.Record({ key: S.String, value: S.Any }),
  results: S.Array(ServiceResult),
});
export type ServiceBoardContext = S.Schema.Type<typeof ServiceBoardContext>;
