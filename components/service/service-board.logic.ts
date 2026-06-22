/**
 * Service Board — Effect logic stub with dependency injection.
 *
 * Pure logic module. No DOM, no React.
 * All I/O is injected via the HttpClient interface so the module
 * can run in tests with MockHttpClient and swap to real HTTP later.
 *
 * @module service-board.logic
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

/**
 * Mock HTTP client that returns canned responses.
 * Used for testing and stub-tier development.
 */
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
 * Execute a single service request against the given (or mock) HTTP client.
 *
 * - Stub-tier services resolve immediately with a note.
 * - Other tiers delay by their configured PACING_MS to simulate latency.
 * - Returns a fully typed ServiceResult.
 *
 * @param request - The service request payload
 * @param httpClient - Injectable HTTP client (defaults to MockHttpClient)
 * @returns Promise resolving to a ServiceResult
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
 * Execute multiple service requests in parallel, reporting progress
 * via callbacks as each node transitions through its lifecycle.
 *
 * Fires onNodeUpdate(serviceType, {status:'active'}) before each request,
 * then onNodeUpdate(serviceType, {status:'complete', result}) after resolution.
 * Once all services resolve, fires onAllComplete().
 *
 * @param selectedServices - Array of service types to execute
 * @param baseRequest - Base request data (workText, evaluation, context)
 * @param callbacks - Progress reporting callbacks
 * @param httpClient - Injectable HTTP client (defaults to MockHttpClient)
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
