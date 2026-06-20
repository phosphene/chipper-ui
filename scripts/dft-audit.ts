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
// Source of truth: DFT.md beat map.
// Each entry: { id: testid, required: true = hard failure, false = warning }
const REQUIRED_TESTIDS: { id: string; note: string; required: boolean }[] = [
  // Entry / workspace
  { id: 'entry-text-field',       note: 'Main entry textarea',              required: true },
  { id: 'evaluate-progressive',   note: 'Primary evaluate button',          required: true },
  { id: 'workspace-panels',       note: 'Workspace panel container',        required: true },
  { id: 'workspace-board',        note: 'Board panel',                      required: true },
  { id: 'board-toggle',           note: 'Board show/hide toggle',           required: true },
  { id: 'progressive-form',       note: 'Progressive form container',       required: true },
  { id: 'reading-panel',          note: 'Reading/results panel',            required: true },
  { id: 'detection-confirm',      note: 'Detection confirmation panel',     required: true },

  // Ceremony beats I–V
  { id: 'stage-I',                note: 'Beat I container',                 required: true },
  { id: 'stage-I-advance',        note: 'Beat I advance button',            required: true },
  { id: 'stage-II',               note: 'Beat II container',                required: true },
  { id: 'stage-III',              note: 'Beat III container',               required: true },
  { id: 'stage-IV',               note: 'Beat IV container',                required: true },
  { id: 'stage-IV-enter',         note: 'Beat IV consent enter button',     required: true },
  { id: 'stage-IV-decline',       note: 'Beat IV decline button',           required: true },
  { id: 'stage-V',                note: 'Beat V container',                 required: true },
  { id: 'stage-V-last-word',      note: 'Beat V last-word input',           required: true },
  { id: 'stage-V-rest',           note: 'Beat V rest/submit button',        required: true },

  // Ceremony beats VI–IX
  { id: 'threshold',              note: 'Threshold container',              required: true },
  { id: 'threshold-proceed',      note: 'Threshold proceed button',         required: true },
  { id: 'processing',             note: 'Processing animation container',   required: true },
  { id: 'score-reveal-container', note: 'Score reveal (timed) wrapper',     required: true },
  { id: 'score-reveal',           note: 'Score reveal button',              required: true },
  { id: 'pronouncement',          note: 'Pronouncement container',          required: true },
  { id: 'pronouncement-proceed',  note: 'Pronouncement proceed button',     required: true },
  { id: 'score-hero',             note: 'Score display element',            required: true },
  { id: 'recording-beat',         note: 'Recording beat container',         required: true },
  { id: 'recording-confirm',      note: 'Recording confirm button',         required: true },

  // Opening
  { id: 'opening',                note: 'Opening screen container',         required: true },
  { id: 'opening-begin',          note: 'Opening begin button',             required: true },
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
const untestedIds: string[] = [];

for (const entry of REQUIRED_TESTIDS) {
  // Check presence in component source
  const inSource = componentSources.includes(`data-testid="${entry.id}"`);
  if (!inSource) {
    missing.push(entry);
    continue;
  }

  // Check that an E2E test references it
  const inE2e =
    e2eSources.includes(`"[data-testid=\\"${entry.id}\\"]"`) ||
    e2eSources.includes(`'[data-testid="${entry.id}"]'`) ||
    e2eSources.includes(`testid="${entry.id}"`) ||
    e2eSources.includes(`testid='${entry.id}'`) ||
    // Playwright locator patterns
    e2eSources.includes(`data-testid="${entry.id}"`) ||
    e2eSources.includes(`data-testid='${entry.id}'`);

  if (!inE2e) {
    untestedIds.push(entry.id);
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

if (untestedIds.length > 0) {
  if (STRICT) {
    console.error('\n❌ DFT AUDIT FAILED (--strict) — Testids with no E2E coverage:\n');
    exitCode = 1;
  } else {
    console.warn('\n⚠️  DFT WARNING — Testids present but no E2E assertion found:\n');
  }
  for (const id of untestedIds) {
    console[STRICT ? 'error' : 'warn'](`  data-testid="${id}"`);
  }
  if (STRICT) {
    console.error('\nFix: Write an E2E test that asserts on each testid above.\n');
  } else {
    console.warn('\nRun with --strict to turn this into a hard failure.\n');
  }
}

if (missing.length === 0 && untestedIds.length === 0) {
  console.log('✅ DFT audit passed — all required testids present and covered.\n');
}

if (missing.length === 0 && untestedIds.length > 0 && !STRICT) {
  console.log(`✅ DFT audit passed (${untestedIds.length} testids lack E2E coverage — run --strict to enforce).\n`);
}

process.exit(exitCode);
