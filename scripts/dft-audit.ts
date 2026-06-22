#!/usr/bin/env npx tsx
/**
 * dft-audit.ts — Design for Testability coverage enforcer
 *
 * Statically verifies that every component listed in DFT.md beat map
 * has its required data-testid attributes present in source code.
 * Also cross-checks that every registered testid has at least one
 * E2E test assertion against it.
 *
 * Exit 0  — all required testids present, all have coverage
 * Exit 1  — coverage gap found; prints actionable report
 *
 * Usage:
 *   npx tsx scripts/dft-audit.ts
 *   npx tsx scripts/dft-audit.ts --strict   (also fails on untested testids)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(import.meta.dirname, '..');
const COMPONENTS_DIR = join(ROOT, 'components');
const APP_DIR = join(ROOT, 'app');
const E2E_DIR = join(ROOT, 'tests', 'e2e');
const STRICT = process.argv.includes('--strict');

// ── Required testid manifest ────────────────────────────────────────────────
// Source of truth: live app route (page.tsx → ProgressiveForm + LiveBoard).
// Only testids reachable from the deployed app are required for strict E2E.
// Ceremony-only testids (CeremonyFlow, not yet mounted) are tracked separately.
//
// Each entry: { id: testid, required: true = hard failure, false = warning }
const REQUIRED_TESTIDS: { id: string; note: string; required: boolean }[] = [
  // ── Live app: workspace layout (page.tsx) ──────────────────────────────
  { id: 'workspace-panels',       note: 'Workspace panel container',        required: true },
  { id: 'workspace-board',        note: 'Board panel',                      required: true },
  { id: 'board-toggle',           note: 'Board show/hide toggle',           required: true },
  { id: 'live-board-canvas',      note: 'Board canvas element',             required: true },

  // ── Live app: ProgressiveForm ──────────────────────────────────────────
  { id: 'progressive-form',       note: 'Progressive form container',       required: true },
  { id: 'entry-text-field',       note: 'Main entry textarea',              required: true },
  { id: 'evaluate-progressive',   note: 'Primary evaluate button',          required: true },
  { id: 'reading-panel',          note: 'Reading/results panel',            required: true },
  { id: 'detection-confirm',      note: 'Detection confirmation panel',     required: true },

  // ── Live app: Pronouncement (rendered inside ProgressiveForm) ──────────
  { id: 'pronouncement',          note: 'Pronouncement container',          required: true },
  { id: 'pronouncement-proceed',  note: 'Pronouncement proceed button',     required: true },

  // ── Live app: Export strip ─────────────────────────────────────────────
  { id: 'export-strip',           note: 'Export button strip container',    required: true },
  { id: 'export-pdf',             note: 'Export PDF button',                required: true },
  { id: 'export-markdown',        note: 'Export Markdown button',           required: true },
  { id: 'export-json',            note: 'Export JSON button',               required: true },
  { id: 'export-copy',            note: 'Export Copy button',               required: true },

  // ── Ceremony stages (CeremonyFlow — not yet mounted in app route) ─────
  // These testids exist in component source but CeremonyFlow is not
  // rendered by any live route. E2E coverage deferred until mount.
  { id: 'stage-I',                note: 'Beat I container (ceremony)',       required: false },
  { id: 'stage-I-advance',        note: 'Beat I advance button (ceremony)', required: false },
  { id: 'stage-II',               note: 'Beat II container (ceremony)',      required: false },
  { id: 'stage-III',              note: 'Beat III container (ceremony)',     required: false },
  { id: 'stage-IV',               note: 'Beat IV container (ceremony)',      required: false },
  { id: 'stage-IV-enter',         note: 'Beat IV consent enter (ceremony)', required: false },
  { id: 'stage-IV-decline',       note: 'Beat IV decline (ceremony)',       required: false },
  { id: 'stage-V',                note: 'Beat V container (ceremony)',       required: false },
  { id: 'stage-V-last-word',      note: 'Beat V last-word input (ceremony)',required: false },
  { id: 'stage-V-rest',           note: 'Beat V rest/submit (ceremony)',    required: false },
  { id: 'threshold',              note: 'Threshold container (ceremony)',    required: false },
  { id: 'threshold-proceed',      note: 'Threshold proceed (ceremony)',     required: false },
  { id: 'processing',             note: 'Processing animation (ceremony)',   required: false },
  { id: 'score-reveal-container', note: 'Score reveal wrapper (ceremony)',   required: false },
  { id: 'score-reveal',           note: 'Score reveal button (ceremony)',    required: false },
  { id: 'score-hero',             note: 'Score display (ceremony)',          required: false },
  { id: 'recording-beat',         note: 'Recording beat (ceremony)',         required: false },
  { id: 'recording-confirm',      note: 'Recording confirm (ceremony)',     required: false },
  { id: 'opening',                note: 'Opening screen (ceremony)',         required: false },
  { id: 'opening-begin',          note: 'Opening begin (ceremony)',          required: false },

  // ── Service Board (T-377 — components not yet written) ─────────────────
  { id: 'service-board',              note: 'Service board container',          required: true },
  { id: 'service-paper-input',        note: 'Paper paste/drop area',            required: true },
  { id: 'service-request-btn',        note: 'Request services button',          required: true },
  { id: 'results-panel',              note: 'Post-completion results surface',  required: true },
  { id: 'results-download-paper',     note: 'Corrected paper download',         required: true },
  { id: 'results-download-receipt',   note: 'Receipt download',                 required: true },

  // ── Service Board: per-service testids (edit-abstract) ─────────────────
  { id: 'service-option-edit-abstract',         note: 'Service checkbox: edit-abstract',          required: true },
  { id: 'service-node-edit-abstract',           note: 'Board node card: edit-abstract',           required: true },
  { id: 'service-node-edit-abstract-status',    note: 'Status text in node: edit-abstract',       required: true },
  { id: 'results-service-edit-abstract',        note: 'Individual service result: edit-abstract',  required: true },
  { id: 'results-service-edit-abstract-view',   note: 'View button: edit-abstract',               required: true },
  { id: 'results-service-edit-abstract-copy',   note: 'Copy button: edit-abstract',               required: true },

  // ── Service Board: per-service testids (check-citations) ───────────────
  { id: 'service-option-check-citations',       note: 'Service checkbox: check-citations',        required: true },
  { id: 'service-node-check-citations',         note: 'Board node card: check-citations',         required: true },
  { id: 'service-node-check-citations-status',  note: 'Status text in node: check-citations',     required: true },
  { id: 'results-service-check-citations',      note: 'Individual service result: check-citations', required: true },
  { id: 'results-service-check-citations-view', note: 'View button: check-citations',             required: true },
  { id: 'results-service-check-citations-copy', note: 'Copy button: check-citations',             required: true },

  // ── Service Board: per-service testids (spellcheck) ────────────────────
  { id: 'service-option-spellcheck',            note: 'Service checkbox: spellcheck',             required: true },
  { id: 'service-node-spellcheck',              note: 'Board node card: spellcheck',              required: true },
  { id: 'service-node-spellcheck-status',       note: 'Status text in node: spellcheck',          required: true },
  { id: 'results-service-spellcheck',           note: 'Individual service result: spellcheck',    required: true },
  { id: 'results-service-spellcheck-view',      note: 'View button: spellcheck',                  required: true },
  { id: 'results-service-spellcheck-copy',      note: 'Copy button: spellcheck',                  required: true },

  // ── Service Board: per-service testids (doi-metadata) ──────────────────
  { id: 'service-option-doi-metadata',          note: 'Service checkbox: doi-metadata',           required: true },
  { id: 'service-node-doi-metadata',            note: 'Board node card: doi-metadata',            required: true },
  { id: 'service-node-doi-metadata-status',     note: 'Status text in node: doi-metadata',        required: true },
  { id: 'results-service-doi-metadata',         note: 'Individual service result: doi-metadata',  required: true },
  { id: 'results-service-doi-metadata-view',    note: 'View button: doi-metadata',                required: true },
  { id: 'results-service-doi-metadata-copy',    note: 'Copy button: doi-metadata',                required: true },

  // ── Service Board: per-service testids (zenodo-record) ─────────────────
  { id: 'service-option-zenodo-record',         note: 'Service checkbox: zenodo-record',          required: true },
  { id: 'service-node-zenodo-record',           note: 'Board node card: zenodo-record',           required: true },
  { id: 'service-node-zenodo-record-status',    note: 'Status text in node: zenodo-record',       required: true },
  { id: 'results-service-zenodo-record',        note: 'Individual service result: zenodo-record',  required: true },
  { id: 'results-service-zenodo-record-view',   note: 'View button: zenodo-record',               required: true },
  { id: 'results-service-zenodo-record-copy',   note: 'Copy button: zenodo-record',               required: true },
];

// ── File scanner ─────────────────────────────────────────────────────────────

function scanDir(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry === 'node_modules' || entry === '.next') continue;
        results.push(...scanDir(full));
      } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
        results.push(full);
      }
    }
  } catch { /* skip unreadable dirs */ }
  return results;
}

function readAll(files: string[]): string {
  return files.map(f => readFileSync(f, 'utf8')).join('\n');
}

// ── Main audit ───────────────────────────────────────────────────────────────

const componentSources = readAll(scanDir(COMPONENTS_DIR).concat(scanDir(APP_DIR)));
const e2eSources = readAll(scanDir(E2E_DIR));

const missing: typeof REQUIRED_TESTIDS = [];
const untestedRequired: string[] = [];   // required=true, no E2E coverage
const untestedDeferred: string[] = [];   // required=false, no E2E coverage (ceremony etc.)

function hasE2eCoverage(id: string): boolean {
  return (
    e2eSources.includes(`"[data-testid=\\"${id}\\"]"`) ||
    e2eSources.includes(`'[data-testid="${id}"]'`) ||
    e2eSources.includes(`testid="${id}"`) ||
    e2eSources.includes(`testid='${id}'`) ||
    // Playwright locator patterns
    e2eSources.includes(`data-testid="${id}"`) ||
    e2eSources.includes(`data-testid='${id}'`)
  );
}

for (const entry of REQUIRED_TESTIDS) {
  // Check presence in component source
  const inSource = componentSources.includes(`data-testid="${entry.id}"`);
  if (!inSource) {
    missing.push(entry);
    continue;
  }

  // Check that an E2E test references it
  if (!hasE2eCoverage(entry.id)) {
    if (entry.required) {
      untestedRequired.push(entry.id);
    } else {
      untestedDeferred.push(entry.id);
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

let exitCode = 0;

if (missing.length > 0) {
  console.error('\n❌ DFT AUDIT FAILED — Missing required testids:\n');
  for (const m of missing) {
    const severity = m.required ? 'REQUIRED' : 'WARNING ';
    console.error(`  [${severity}] data-testid="${m.id}"`);
    console.error(`             ${m.note}`);
    if (m.required) exitCode = 1;
  }
  console.error('\nRule: An untestable element is an unfinished element. (DFT.md §6)');
  console.error('Fix: Add data-testid to the component before this commit.\n');
}

// Strict mode: required testids without E2E coverage are hard failures
if (untestedRequired.length > 0) {
  if (STRICT) {
    console.error('\n❌ DFT AUDIT FAILED (--strict) — Required testids with no E2E coverage:\n');
    exitCode = 1;
  } else {
    console.warn('\n⚠️  DFT WARNING — Required testids present but no E2E assertion found:\n');
  }
  for (const id of untestedRequired) {
    console[STRICT ? 'error' : 'warn'](`  data-testid="${id}"`);
  }
  if (STRICT) {
    console.error('\nFix: Write an E2E test that asserts on each testid above.\n');
  } else {
    console.warn('\nRun with --strict to turn this into a hard failure.\n');
  }
}

// Deferred testids: always informational (components exist but not mounted in live app)
if (untestedDeferred.length > 0) {
  console.warn(`\nℹ️  ${untestedDeferred.length} deferred testids (ceremony — not yet routed) lack E2E coverage:`);
  for (const id of untestedDeferred) {
    console.warn(`  data-testid="${id}"`);
  }
  console.warn('  These will become required when CeremonyFlow is mounted in the app route.\n');
}

const requiredMissing = missing.filter(m => m.required).length;
if (requiredMissing === 0 && untestedRequired.length === 0) {
  const extra = untestedDeferred.length > 0
    ? ` (${untestedDeferred.length} ceremony testids deferred — not yet routed)`
    : '';
  console.log(`✅ DFT audit passed${STRICT ? ' (strict)' : ''}${extra}\n`);
}

process.exit(exitCode);
