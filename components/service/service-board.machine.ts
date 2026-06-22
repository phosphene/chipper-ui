/**
 * Service Board — XState v5 state machine.
 *
 * Orchestrates the service selection → request → processing → results lifecycle.
 * Pure state logic. No DOM, no React, no side effects.
 *
 * @module service-board.machine
 * @ticket T-379
 *
 * @behavior
 * The machine enforces a strict lifecycle: users select services, submit them
 * for processing, receive incremental updates as nodes report back, and finally
 * acknowledge the completed results. Guards prevent requesting with no services
 * selected and ensure the ALL_COMPLETE event is only valid when every node has
 * reached a terminal state.
 *
 * @invariants
 * - `selectedServices` is never empty in states beyond `idle` (except during
 *   deselection that transitions back to `idle`).
 * - `nodeStates` keys always mirror `selectedServices` entries.
 * - Terminal node statuses are: `complete`, `stub`, `failed`.
 * - The `canRequest` guard prevents submission with zero services.
 * - The `allTerminal` guard prevents premature completion signalling.
 *
 * @remarks
 * Uses XState v5 `setup()` pattern. Context types align with
 * `service-board.schema.ts` (T-378) but are defined inline to avoid
 * runtime Effect Schema dependency in the machine.
 */

import { setup, assign, type ActorLogicFrom } from "xstate";
import type { ServiceType, ServiceNodeState, ServiceResult } from "./service-board.schema";

// ── Context ───────────────────────────────────────────────────

export interface ServiceBoardContext {
  selectedServices: ServiceType[];
  paperText: string;
  nodeStates: Record<string, ServiceNodeState>;
  results: ServiceResult[];
}

// ── Events ────────────────────────────────────────────────────

export type ServiceBoardEvent =
  | { type: "SELECT_SERVICE"; serviceType: ServiceType }
  | { type: "DESELECT_SERVICE"; serviceType: ServiceType }
  | { type: "SET_PAPER"; text: string }
  | { type: "REQUEST_SERVICES" }
  | { type: "SERVICE_UPDATE"; serviceType: ServiceType; nodeState: ServiceNodeState }
  | { type: "ALL_COMPLETE" }
  | { type: "ACKNOWLEDGE" };

// ── Terminal statuses ─────────────────────────────────────────

const TERMINAL_STATUSES = new Set(["complete", "stub", "failed"]);

// ── Machine ───────────────────────────────────────────────────

export const serviceBoardMachine = setup({
  types: {
    context: {} as ServiceBoardContext,
    events: {} as ServiceBoardEvent,
  },
  guards: {
    canRequest: ({ context }) => context.selectedServices.length > 0,
    allTerminal: ({ context }) => {
      const entries = Object.values(context.nodeStates);
      return entries.length > 0 && entries.every((ns) => TERMINAL_STATUSES.has(ns.status));
    },
  },
  actions: {
    addService: assign({
      selectedServices: ({ context, event }) => {
        const e = event as { type: "SELECT_SERVICE"; serviceType: ServiceType };
        if (context.selectedServices.includes(e.serviceType)) return context.selectedServices;
        return [...context.selectedServices, e.serviceType];
      },
      nodeStates: ({ context, event }) => {
        const e = event as { type: "SELECT_SERVICE"; serviceType: ServiceType };
        if (context.nodeStates[e.serviceType]) return context.nodeStates;
        return { ...context.nodeStates, [e.serviceType]: { status: "pending" as const } };
      },
    }),
    removeService: assign({
      selectedServices: ({ context, event }) => {
        const e = event as { type: "DESELECT_SERVICE"; serviceType: ServiceType };
        return context.selectedServices.filter((s) => s !== e.serviceType);
      },
      nodeStates: ({ context, event }) => {
        const e = event as { type: "DESELECT_SERVICE"; serviceType: ServiceType };
        const { [e.serviceType]: _, ...rest } = context.nodeStates;
        return rest;
      },
    }),
    setPaper: assign({
      paperText: ({ event }) => (event as { type: "SET_PAPER"; text: string }).text,
    }),
    updateNodeState: assign({
      nodeStates: ({ context, event }) => {
        const e = event as { type: "SERVICE_UPDATE"; serviceType: ServiceType; nodeState: ServiceNodeState };
        return { ...context.nodeStates, [e.serviceType]: e.nodeState };
      },
    }),
    collectResults: assign({
      results: ({ context }) =>
        Object.entries(context.nodeStates)
          .filter(([, ns]) => ns.status === "complete")
          .map(([, ns]) => (ns as { status: "complete"; result: ServiceResult }).result),
    }),
  },
}).createMachine({
  id: "serviceBoard",
  initial: "idle",
  context: {
    selectedServices: [],
    paperText: "",
    nodeStates: {},
    results: [],
  },
  states: {
    idle: {
      on: {
        SELECT_SERVICE: {
          target: "services_selected",
          actions: "addService",
        },
        SET_PAPER: {
          actions: "setPaper",
        },
      },
    },
    services_selected: {
      on: {
        SELECT_SERVICE: {
          actions: "addService",
        },
        DESELECT_SERVICE: [
          {
            // Last service removed → back to idle
            guard: ({ context, event }) => {
              const remaining = context.selectedServices.filter(
                (s) => s !== event.serviceType,
              );
              return remaining.length === 0;
            },
            target: "idle",
            actions: "removeService",
          },
          {
            // Still have services → stay
            actions: "removeService",
          },
        ],
        SET_PAPER: {
          actions: "setPaper",
        },
        REQUEST_SERVICES: {
          target: "requesting",
          guard: "canRequest",
        },
      },
    },
    requesting: {
      on: {
        SERVICE_UPDATE: {
          target: "processing",
          actions: "updateNodeState",
        },
      },
    },
    processing: {
      on: {
        SERVICE_UPDATE: {
          actions: "updateNodeState",
        },
        ALL_COMPLETE: {
          target: "all_complete",
          guard: "allTerminal",
          actions: "collectResults",
        },
      },
    },
    all_complete: {
      on: {
        ACKNOWLEDGE: {
          target: "results_viewed",
        },
      },
    },
    results_viewed: {
      type: "final",
    },
  },
});

export type ServiceBoardMachine = typeof serviceBoardMachine;
export type ServiceBoardActorLogic = ActorLogicFrom<ServiceBoardMachine>;
