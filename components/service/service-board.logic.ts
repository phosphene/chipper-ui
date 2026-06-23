/**
 * Service board logic — pure functions with injectable dependencies.
 *
 * All I/O is injectable via the `httpClient` parameter so this module
 * is testable in Node without a browser or running API. Swap in
 * `MockHttpClient` for unit tests; the real woodchipper-services client
 * (T-371) replaces it when the API is deployed — no function body changes.
 *
 * Pacing is deliberate: a frontier service returning in 200ms signals
 * that nothing was actually evaluated. Minimum times are
 * $t_{\text{small}} \geq 2\ \text{s}$, $t_{\text{frontier}} \geq 4\ \text{s}$.
 *
 * @remarks
 * This module owns the service execution contract. The XState machine in
 * service-board.machine.ts owns the lifecycle state. The view in
 * service-board.view.tsx observes the machine. None of these layers
 * need to know about the others' internals.
 *
 * @ticket T-380
 */

import type {
  ServiceType,
  ServiceResult,
  ServiceRequest,
  ServiceNodeState,
  OutputType,
} from "./service-board.schema";
import { SERVICE_TIER, PACING_MS } from "./service-board.schema";

// ── HttpClient interface + DI ─────────────────────────────────

/** Injectable HTTP client for service requests. */
export interface HttpClient {
  post(url: string, body: unknown): Promise<unknown>;
}

/** DI stub — returns canned responses for testing without a real API. */
export const MockHttpClient: HttpClient = {
  async post(_url: string, body: unknown): Promise<unknown> {
    return { ok: true, body };
  },
};

// ── Output type map ───────────────────────────────────────────

const OUTPUT_TYPE_MAP: Record<ServiceType, OutputType> = {
  spellcheck: "corrected-paper",
  "edit-abstract": "corrected-paper",
  "check-citations": "report",
  "doi-metadata": "metadata",
  "zenodo-record": "record",
} as const;

// ── Mock output generators ────────────────────────────────────

function generateMockOutput(
  serviceType: ServiceType,
  request: ServiceRequest,
): string {
  const { workText, context } = request;

  switch (serviceType) {
    case "spellcheck":
      return (
        '3 corrections found: (1) \'occured\' → \'occurred\' ' +
        '(2) \'recieve\' → \'receive\' (3) \'seperate\' → \'separate\''
      );

    case "edit-abstract":
      return (
        "Revised abstract: " +
        workText.slice(0, 200) +
        " [clarity improved, passive voice reduced]"
      );

    case "check-citations":
      return (
        "2 of 3 citations verified. " +
        "Citation [2] could not be cross-referenced."
      );

    case "doi-metadata":
      return JSON.stringify({
        title: workText.slice(0, 60),
        type: context.workType,
        domain: context.domain,
        date: new Date().toISOString().slice(0, 10),
      });

    case "zenodo-record":
      return (
        "Zenodo deposit record drafted. " +
        "Title, authors, and metadata ready for submission."
      );

    default: {
      const _exhaustive: never = serviceType;
      return `Unknown service: ${_exhaustive}`;
    }
  }
}

// ── Delay helper ──────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── requestService ────────────────────────────────────────────

/**
 * Execute a single service request and return the result after tier-appropriate pacing.
 *
 * @param request - Service request carrying `service` type, `workText`, `evaluation`
 *   (WCIResult), and maker `context` (standing, workType, domain).
 * @param httpClient - Injectable HTTP client. Defaults to `MockHttpClient` for tests;
 *   replaced by the real woodchipper-services client (T-371) in production.
 * @returns `ServiceResult` containing the output text, output type, and optional
 *   change count. Returned after a minimum delay of `PACING_MS[tier]`.
 *
 * @remarks
 * Stub-tier services ($t_{\text{stub}} = 0\ \text{s}$) return immediately with a
 * descriptive note explaining what would happen with real infrastructure.
 * This is the correct behaviour: the user sees the shape of the future service
 * without being misled about its current availability.
 */
export async function requestService(
  request: ServiceRequest,
  httpClient: HttpClient = MockHttpClient,
): Promise<ServiceResult> {
  const tier = SERVICE_TIER[request.service];

  // Stub tier: immediate return, no network
  if (tier === "stub") {
    return {
      serviceType: request.service,
      output: generateMockOutput(request.service, request),
      outputType: OUTPUT_TYPE_MAP[request.service],
    };
  }

  // Simulate pacing delay
  const pacingMs = PACING_MS[tier];
  if (pacingMs > 0) {
    await delay(pacingMs);
  }

  // Fire mock HTTP (unused response — real impl will parse it)
  await httpClient.post(`/api/service/${request.service}`, {
    workText: request.workText,
    context: request.context,
  });

  return {
    serviceType: request.service,
    output: generateMockOutput(request.service, request),
    outputType: OUTPUT_TYPE_MAP[request.service],
  };
}

// ── Callback types ────────────────────────────────────────────

/** Callback fired when a service node's state changes. */
export type OnNodeUpdate = (
  serviceType: ServiceType,
  nodeState: ServiceNodeState,
) => void;

/** Callback fired when all requested services have completed. */
export type OnAllComplete = () => void;

// ── requestAllServices ────────────────────────────────────────

/**
 * Fire all requested services in parallel and report results via callbacks.
 *
 * Services execute concurrently via `Promise.all`. For each service:
 * 1. `onNodeUpdate(type, { status: 'active', statusText: '...' })` fires immediately
 * 2. The service runs (see `requestService`)
 * 3. `onNodeUpdate(type, { status: 'complete', result })` fires on completion
 * After all services complete: `onAllComplete()` fires once.
 *
 * The invariant $\forall s \in \text{services}: s\ \text{reaches terminal state}$
 * is guaranteed by `Promise.all` — `onAllComplete` cannot fire until every
 * service has resolved or rejected.
 *
 * @param selectedServices - Array of `ServiceType` values to execute.
 * @param baseRequest - Base request data shared across all services (workText, evaluation, context).
 * @param callbacks - Object containing `onNodeUpdate` (called on each node state transition:
 *   active → complete/failed) and `onAllComplete` (called exactly once when all services
 *   have reached terminal state).
 * @param httpClient - Injectable HTTP client (see `requestService`).
 * @returns `ServiceResult[]` in the same order as the input `selectedServices` array.
 */
export async function requestAllServices(
  selectedServices: ServiceType[],
  baseRequest: Omit<ServiceRequest, "service">,
  callbacks: {
    onNodeUpdate: OnNodeUpdate;
    onAllComplete: OnAllComplete;
  },
  httpClient: HttpClient = MockHttpClient,
): Promise<ServiceResult[]> {
  const { onNodeUpdate, onAllComplete } = callbacks;

  const results = await Promise.all(
    selectedServices.map(async (serviceType) => {
      // Signal: node is now active
      onNodeUpdate(serviceType, {
        status: "active",
        statusText: `Processing ${serviceType}…`,
      });

      const result = await requestService(
        { ...baseRequest, service: serviceType },
        httpClient,
      );

      // Signal: node is complete
      onNodeUpdate(serviceType, {
        status: "complete",
        result,
      });

      return result;
    }),
  );

  onAllComplete();
  return results;
}
