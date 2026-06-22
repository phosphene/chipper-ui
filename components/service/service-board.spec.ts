/**
 * Service Board machine — Vitest spec.
 *
 * Pure state-machine tests using createActor from xstate.
 * No DOM, no browser, no React.
 *
 * @module service-board.spec
 * @ticket T-379
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createActor, type AnyActorRef } from "xstate";
import { serviceBoardMachine } from "./service-board.machine";
import type { ServiceType, ServiceNodeState } from "./service-board.schema";

// ── Helpers ───────────────────────────────────────────────────

const startActor = () => {
  const actor = createActor(serviceBoardMachine);
  actor.start();
  return actor;
};

const snap = (actor: ReturnType<typeof startActor>) => actor.getSnapshot();

const makeCompleteNodeState = (serviceType: ServiceType): ServiceNodeState => ({
  status: "complete",
  result: {
    serviceType,
    output: `Result for ${serviceType}`,
    outputType: "report",
  },
});

const makeFailedNodeState = (): ServiceNodeState => ({
  status: "failed",
  error: "Something went wrong",
});

const makeStubNodeState = (): ServiceNodeState => ({
  status: "stub",
  note: "Not implemented yet",
});

// ── Tests ─────────────────────────────────────────────────────

describe("serviceBoardMachine", () => {
  let actor: ReturnType<typeof startActor>;

  beforeEach(() => {
    actor = startActor();
  });

  // ── Initial state ─────────────────────────────────────────

  it("starts in idle state", () => {
    expect(snap(actor).value).toBe("idle");
  });

  it("starts with empty context", () => {
    const ctx = snap(actor).context;
    expect(ctx.selectedServices).toEqual([]);
    expect(ctx.paperText).toBe("");
    expect(ctx.nodeStates).toEqual({});
    expect(ctx.results).toEqual([]);
  });

  // ── idle → services_selected on SELECT_SERVICE ────────────

  it("transitions from idle to services_selected on SELECT_SERVICE", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    expect(snap(actor).value).toBe("services_selected");
  });

  it("SELECT_SERVICE adds to selectedServices context", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    expect(snap(actor).context.selectedServices).toEqual(["spellcheck"]);
  });

  it("SELECT_SERVICE initialises nodeState as pending", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    expect(snap(actor).context.nodeStates["spellcheck"]).toEqual({ status: "pending" });
  });

  // ── Multiple selections ───────────────────────────────────

  it("adds multiple services while staying in services_selected", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "SELECT_SERVICE", serviceType: "edit-abstract" });
    expect(snap(actor).value).toBe("services_selected");
    expect(snap(actor).context.selectedServices).toEqual(["spellcheck", "edit-abstract"]);
    expect(snap(actor).context.nodeStates["spellcheck"]).toEqual({ status: "pending" });
    expect(snap(actor).context.nodeStates["edit-abstract"]).toEqual({ status: "pending" });
  });

  it("does not duplicate a service already selected", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    expect(snap(actor).context.selectedServices).toEqual(["spellcheck"]);
  });

  // ── DESELECT_SERVICE ──────────────────────────────────────

  it("DESELECT_SERVICE removes from selectedServices context", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "SELECT_SERVICE", serviceType: "edit-abstract" });
    actor.send({ type: "DESELECT_SERVICE", serviceType: "spellcheck" });
    expect(snap(actor).context.selectedServices).toEqual(["edit-abstract"]);
    expect(snap(actor).context.nodeStates["spellcheck"]).toBeUndefined();
  });

  it("services_selected + all deselected → idle", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "DESELECT_SERVICE", serviceType: "spellcheck" });
    expect(snap(actor).value).toBe("idle");
    expect(snap(actor).context.selectedServices).toEqual([]);
  });

  it("deselecting one of two stays in services_selected", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "SELECT_SERVICE", serviceType: "edit-abstract" });
    actor.send({ type: "DESELECT_SERVICE", serviceType: "spellcheck" });
    expect(snap(actor).value).toBe("services_selected");
    expect(snap(actor).context.selectedServices).toEqual(["edit-abstract"]);
  });

  // ── SET_PAPER ─────────────────────────────────────────────

  it("SET_PAPER updates paperText from idle", () => {
    actor.send({ type: "SET_PAPER", text: "My paper content" });
    expect(snap(actor).context.paperText).toBe("My paper content");
    expect(snap(actor).value).toBe("idle");
  });

  it("SET_PAPER updates paperText from services_selected", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "SET_PAPER", text: "Updated content" });
    expect(snap(actor).context.paperText).toBe("Updated content");
    expect(snap(actor).value).toBe("services_selected");
  });

  // ── Cannot REQUEST_SERVICES from idle (guard) ─────────────

  it("cannot REQUEST_SERVICES from idle (no services selected)", () => {
    actor.send({ type: "REQUEST_SERVICES" });
    expect(snap(actor).value).toBe("idle");
  });

  // ── services_selected + REQUEST_SERVICES → requesting ─────

  it("services_selected + REQUEST_SERVICES → requesting", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "REQUEST_SERVICES" });
    expect(snap(actor).value).toBe("requesting");
  });

  // ── requesting + SERVICE_UPDATE → processing ──────────────

  it("requesting + SERVICE_UPDATE → processing, nodeState updated", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "REQUEST_SERVICES" });

    const activeState: ServiceNodeState = { status: "active", statusText: "Checking spelling…" };
    actor.send({ type: "SERVICE_UPDATE", serviceType: "spellcheck", nodeState: activeState });

    expect(snap(actor).value).toBe("processing");
    expect(snap(actor).context.nodeStates["spellcheck"]).toEqual(activeState);
  });

  // ── processing + SERVICE_UPDATE → processing ──────────────

  it("SERVICE_UPDATE in processing updates nodeStates and stays in processing", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "SELECT_SERVICE", serviceType: "edit-abstract" });
    actor.send({ type: "REQUEST_SERVICES" });

    actor.send({
      type: "SERVICE_UPDATE",
      serviceType: "spellcheck",
      nodeState: { status: "active", statusText: "Running…" },
    });
    expect(snap(actor).value).toBe("processing");

    // Second update on different service
    actor.send({
      type: "SERVICE_UPDATE",
      serviceType: "edit-abstract",
      nodeState: { status: "active", statusText: "Editing…" },
    });
    expect(snap(actor).value).toBe("processing");
    expect(snap(actor).context.nodeStates["edit-abstract"]).toEqual({
      status: "active",
      statusText: "Editing…",
    });
  });

  // ── processing + ALL_COMPLETE → all_complete ──────────────

  it("processing + ALL_COMPLETE → all_complete when all nodes are terminal", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "SELECT_SERVICE", serviceType: "zenodo-record" });
    actor.send({ type: "REQUEST_SERVICES" });

    // First update moves to processing
    actor.send({
      type: "SERVICE_UPDATE",
      serviceType: "spellcheck",
      nodeState: makeCompleteNodeState("spellcheck"),
    });

    // Second update: stub terminal
    actor.send({
      type: "SERVICE_UPDATE",
      serviceType: "zenodo-record",
      nodeState: makeStubNodeState(),
    });

    // Now all terminal — ALL_COMPLETE should work
    actor.send({ type: "ALL_COMPLETE" });
    expect(snap(actor).value).toBe("all_complete");
  });

  it("ALL_COMPLETE collects results from completed nodes", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "REQUEST_SERVICES" });
    actor.send({
      type: "SERVICE_UPDATE",
      serviceType: "spellcheck",
      nodeState: makeCompleteNodeState("spellcheck"),
    });
    actor.send({ type: "ALL_COMPLETE" });

    expect(snap(actor).context.results).toHaveLength(1);
    expect(snap(actor).context.results[0].serviceType).toBe("spellcheck");
  });

  it("ALL_COMPLETE is blocked when not all nodes are terminal", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "SELECT_SERVICE", serviceType: "edit-abstract" });
    actor.send({ type: "REQUEST_SERVICES" });

    // Only one service reports
    actor.send({
      type: "SERVICE_UPDATE",
      serviceType: "spellcheck",
      nodeState: makeCompleteNodeState("spellcheck"),
    });

    // edit-abstract still pending — ALL_COMPLETE should be blocked
    actor.send({ type: "ALL_COMPLETE" });
    expect(snap(actor).value).toBe("processing");
  });

  it("ALL_COMPLETE accepts failed nodes as terminal", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "REQUEST_SERVICES" });
    actor.send({
      type: "SERVICE_UPDATE",
      serviceType: "spellcheck",
      nodeState: makeFailedNodeState(),
    });
    actor.send({ type: "ALL_COMPLETE" });
    expect(snap(actor).value).toBe("all_complete");
  });

  // ── all_complete + ACKNOWLEDGE → results_viewed ───────────

  it("all_complete + ACKNOWLEDGE → results_viewed", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "REQUEST_SERVICES" });
    actor.send({
      type: "SERVICE_UPDATE",
      serviceType: "spellcheck",
      nodeState: makeCompleteNodeState("spellcheck"),
    });
    actor.send({ type: "ALL_COMPLETE" });
    expect(snap(actor).value).toBe("all_complete");

    actor.send({ type: "ACKNOWLEDGE" });
    expect(snap(actor).value).toBe("results_viewed");
  });

  it("results_viewed is a final state", () => {
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "REQUEST_SERVICES" });
    actor.send({
      type: "SERVICE_UPDATE",
      serviceType: "spellcheck",
      nodeState: makeCompleteNodeState("spellcheck"),
    });
    actor.send({ type: "ALL_COMPLETE" });
    actor.send({ type: "ACKNOWLEDGE" });

    const snapshot = snap(actor);
    expect(snapshot.value).toBe("results_viewed");
    expect(snapshot.status).toBe("done");
  });

  // ── Full lifecycle ────────────────────────────────────────

  it("completes the full lifecycle: idle → results_viewed", () => {
    // 1. Select services
    actor.send({ type: "SELECT_SERVICE", serviceType: "spellcheck" });
    actor.send({ type: "SELECT_SERVICE", serviceType: "doi-metadata" });
    actor.send({ type: "SET_PAPER", text: "Abstract: We study frogs." });
    expect(snap(actor).value).toBe("services_selected");

    // 2. Request
    actor.send({ type: "REQUEST_SERVICES" });
    expect(snap(actor).value).toBe("requesting");

    // 3. First update → processing
    actor.send({
      type: "SERVICE_UPDATE",
      serviceType: "spellcheck",
      nodeState: { status: "active", statusText: "Checking…" },
    });
    expect(snap(actor).value).toBe("processing");

    // 4. Updates complete both nodes
    actor.send({
      type: "SERVICE_UPDATE",
      serviceType: "spellcheck",
      nodeState: makeCompleteNodeState("spellcheck"),
    });
    actor.send({
      type: "SERVICE_UPDATE",
      serviceType: "doi-metadata",
      nodeState: makeCompleteNodeState("doi-metadata"),
    });

    // 5. All complete
    actor.send({ type: "ALL_COMPLETE" });
    expect(snap(actor).value).toBe("all_complete");
    expect(snap(actor).context.results).toHaveLength(2);

    // 6. Acknowledge
    actor.send({ type: "ACKNOWLEDGE" });
    expect(snap(actor).value).toBe("results_viewed");
    expect(snap(actor).status).toBe("done");
  });
});
