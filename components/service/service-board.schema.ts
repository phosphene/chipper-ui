/**
 * Service Board — Effect Schema data contracts.
 *
 * Pure data definitions. No logic, no DOM, no React.
 * All business types for the service board live here.
 *
 * @module service-board.schema
 * @ticket T-378
 */

import * as S from "@effect/schema/Schema";

// ── Service taxonomy ──────────────────────────────────────────

/** Available service operations. */
export const ServiceType = S.Union(
  S.Literal("edit-abstract"),
  S.Literal("check-citations"),
  S.Literal("spellcheck"),
  S.Literal("doi-metadata"),
  S.Literal("zenodo-record"),
);
export type ServiceType = S.Schema.Type<typeof ServiceType>;

/** Computational tier — governs pacing and resource expectations. */
export const ServiceTier = S.Union(
  S.Literal("rules"),
  S.Literal("small"),
  S.Literal("frontier"),
  S.Literal("stub"),
);
export type ServiceTier = S.Schema.Type<typeof ServiceTier>;

// ── Tier + pacing maps (plain const, not schema) ─────────────

/** Maps each service to its computational tier. */
export const SERVICE_TIER: Record<ServiceType, ServiceTier> = {
  "edit-abstract": "frontier",
  "check-citations": "frontier",
  spellcheck: "small",
  "doi-metadata": "frontier",
  "zenodo-record": "stub",
} as const;

/** Minimum display milliseconds per tier. */
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
  output: S.String,
  outputType: OutputType,
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
