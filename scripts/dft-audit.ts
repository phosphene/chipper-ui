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

  // ── Live app: Work stage selection ──────────────────────────────────────
  { id: 'work-stage-selection',   note: 'Work stage selection container',   required: true },
  { id: 'work-stage-ideas',       note: 'Work stage: Ideas',               required: true },
  { id: 'work-stage-in-progress', note: 'Work stage: In the works',        required: true },
  { id: 'work-stage-finished',    note: 'Work stage: Finished',            required: true },
  { id: 'work-stage-published',   note: 'Work stage: Published',           required: true },

  // ── Live app: ProgressiveForm — Stage 1 (T-389) ────────────────────────
  { id: 'progressive-form',       note: 'Progressive form container',       required: true },
  { id: 'entry-text-field',       note: 'Main entry textarea',              required: true },
  { id: 'entry-proceed-btn',      note: 'Proceed button (Stage 1)',         required: true },
  { id: 'entry-upload-zone',      note: 'Upload drop zone',                 required: true },
  { id: 'entry-details-expander', note: 'Details expander toggle',           required: true },
  { id: 'entry-details-text',     note: 'Details expanded textarea',         required: true },
  { id: 'entry-role-student',     note: 'Role pill: Student',               required: true },
  { id: 'entry-role-scholar',     note: 'Role pill: Scholar',               required: true },
  { id: 'entry-role-practitioner',note: 'Role pill: Practitioner',          required: true },
  { id: 'entry-domain-input',     note: 'Domain type-in input',             required: true },
  { id: 'as-you-proceed',         note: 'As you proceed info section',      required: true },

  // ── Domain picker (T-390) ──────────────────────────────────────────────
  { id: 'domain-picker',          note: 'Domain picker container',           required: true },
  { id: 'domain-search-input',    note: 'Domain search input field',         required: true },

  // ── Stage 2: Maker declaration + Work classification (T-391) ───────────
  { id: 'maker-role-student',     note: 'Maker role pill: Student',          required: true },
  { id: 'maker-role-scholar',     note: 'Maker role pill: Scholar',          required: true },
  { id: 'maker-role-practitioner',note: 'Maker role pill: Practitioner',     required: true },
  { id: 'maker-creator-sole',     note: 'Creator type: Sole creator',       required: true },
  { id: 'maker-creator-co-creator', note: 'Creator type: Co-creator',       required: true },
  { id: 'maker-creator-llm',      note: 'Creator type: LLM',               required: true },
  { id: 'maker-creator-llm-assisted', note: 'Creator type: LLM-assisted',   required: true },
  { id: 'work-type-original-argument', note: 'Work type: Original Argument', required: true },
  { id: 'work-type-null-result',  note: 'Work type: Null Result',           required: true },
  { id: 'work-type-replication',  note: 'Work type: Replication',           required: true },
  { id: 'work-type-synthesis-review', note: 'Work type: Synthesis/Review',   required: true },
  { id: 'work-type-methodological', note: 'Work type: Methodological',       required: true },
  { id: 'work-type-evidentiary',  note: 'Work type: Evidentiary Finding',   required: true },
  { id: 'work-type-none',         note: 'Work type: None of these',         required: true },
  { id: 'stage2-domain-display',  note: 'Stage 2 domain display',           required: true },
  { id: 'stage2-proceed',         note: 'Stage 2 proceed button',           required: true },

  // ── Detection chips (T-392) ────────────────────────────────────────────
  { id: 'detection-chips-container', note: 'Detection chips container',      required: true },
  { id: 'detection-chip-work-type', note: 'Detection chip: work type',       required: true },
  { id: 'detection-chip-domain',  note: 'Detection chip: domain',           required: true },
  { id: 'detection-chip-standing', note: 'Detection chip: standing',         required: true },

  // ── Layer 2: Intent selection (T-393) ──────────────────────────────────
  { id: 'layer-2-intent',         note: 'Layer 2 intent container',         required: true },
  { id: 'intent-assess',          note: 'Intent card: Assess',              required: true },
  { id: 'intent-develop',         note: 'Intent card: Develop',             required: true },
  { id: 'intent-publish',         note: 'Intent card: Publish',             required: true },
  { id: 'intent-register',        note: 'Intent card: Register & Index',    required: true },
  { id: 'intent-proceed',         note: 'Intent proceed button',            required: true },

  // ── Layer 3: Route selection (T-394) ───────────────────────────────────
  { id: 'layer-3-routes',         note: 'Layer 3 routes container',         required: true },
  { id: 'route-quick-review',     note: 'Route: Quick summary review',      required: true },
  { id: 'route-wci',              note: 'Route: Credibility evaluation',    required: true },
  { id: 'route-full-eval',        note: 'Route: Full evaluation',           required: true },
  { id: 'route-impact',           note: 'Route: Impact assessment',         required: true },
  { id: 'route-title-framing',    note: 'Route: Title and framing',         required: true },
  { id: 'route-improvement',      note: 'Route: Improvement rounds',        required: true },
  { id: 'route-registry',         note: 'Route: Woodchipper registry',      required: true },
  { id: 'route-journal',          note: 'Route: Journal submission',        required: true },
  { id: 'route-observatory',      note: 'Route: Observatory.wiki',          required: true },
  { id: 'route-export',           note: 'Route: Print/export',              required: true },
  { id: 'route-uri',              note: 'Route: Woodchipper URI',           required: true },
  { id: 'route-orcid',            note: 'Route: ORCID work record',         required: true },
  { id: 'route-doi',              note: 'Route: DOI via Zenodo',            required: true },
  { id: 'route-arxiv',            note: 'Route: arXiv deposit',             required: true },
  { id: 'route-sherpa',           note: 'Route: SHERPA/RoMEO check',        required: true },
  { id: 'layer-3-proceed',        note: 'Layer 3 proceed button',           required: true },

  // ── Layer 4: Confirmation screen (T-395) ───────────────────────────────
  { id: 'layer-4-confirmation',   note: 'Layer 4 confirmation container',   required: true },
  { id: 'confirm-description',    note: 'Confirm: description value',       required: true },
  { id: 'confirm-description-change', note: 'Confirm: description change',  required: true },
  { id: 'confirm-upload',         note: 'Confirm: upload value',            required: true },
  { id: 'confirm-role',           note: 'Confirm: role value',              required: true },
  { id: 'confirm-role-change',    note: 'Confirm: role change',             required: true },
  { id: 'confirm-creator',        note: 'Confirm: creator value',           required: true },
  { id: 'confirm-creator-change', note: 'Confirm: creator change',          required: true },
  { id: 'confirm-work-type',      note: 'Confirm: work type value',         required: true },
  { id: 'confirm-work-type-change', note: 'Confirm: work type change',      required: true },
  { id: 'confirm-domain',         note: 'Confirm: domain value',            required: true },
  { id: 'confirm-domain-change',  note: 'Confirm: domain change',           required: true },
  { id: 'confirm-intents',        note: 'Confirm: intents value',           required: true },
  { id: 'confirm-routes',         note: 'Confirm: routes value',            required: true },
  { id: 'layer-4-confirm-btn',    note: 'Layer 4 confirm button',           required: true },

  // ── Layer 5: Review screen (T-395) ─────────────────────────────────────
  { id: 'layer-5-review',         note: 'Layer 5 review container',         required: true },
  { id: 'layer-5-begin',          note: 'Layer 5 begin button',             required: true },

  // ── Post-ceremony (deferred — wired in T-390+) ────────────────────────
  { id: 'reading-panel',          note: 'Reading/results panel (T-390+)',   required: false },
  { id: 'detection-confirm',      note: 'Detection confirmation (T-390+)', required: false },
  { id: 'pronouncement',          note: 'Pronouncement container (T-390+)',required: false },
  { id: 'pronouncement-proceed',  note: 'Pronouncement proceed (T-390+)',  required: false },

  // ── Export strip (deferred — wired in T-390+) ─────────────────────────
  { id: 'export-strip',           note: 'Export strip container (T-390+)', required: false },
  { id: 'export-pdf',             note: 'Export PDF button (T-390+)',      required: false },
  { id: 'export-markdown',        note: 'Export Markdown (T-390+)',        required: false },
  { id: 'export-json',            note: 'Export JSON (T-390+)',            required: false },
  { id: 'export-copy',            note: 'Export Copy (T-390+)',            required: false },

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

  // ── Entry layer — Stage 1 ────────────────────────────────────────────────
  { id: 'entry-upload-zone',            note: 'Stage 1 upload zone',                    required: true },
  { id: 'entry-details-expander',       note: 'Stage 1 add more details expander',      required: true },
  { id: 'entry-details-text',           note: 'Stage 1 expanded details textarea',      required: true },
  { id: 'entry-role-student',           note: 'Stage 1 I am a: Student',                required: true },
  { id: 'entry-role-scholar',           note: 'Stage 1 I am a: Scholar',                required: true },
  { id: 'entry-role-practitioner',      note: 'Stage 1 I am a: Practitioner',           required: true },
  { id: 'entry-domain-input',           note: 'Stage 1 domain input',                   required: true },
  { id: 'entry-proceed-btn',            note: 'Stage 1 proceed button',                 required: true },

  // ── Entry layer — Domain picker ──────────────────────────────────────────
  { id: 'domain-picker',                note: 'Domain picker container',                required: true },
  { id: 'domain-search-input',          note: 'Domain picker search input',             required: true },

  // ── Entry layer — Stage 2 maker declaration ──────────────────────────────
  { id: 'maker-role-student',           note: 'Stage 2 I am a: Student',               required: true },
  { id: 'maker-role-scholar',           note: 'Stage 2 I am a: Scholar',               required: true },
  { id: 'maker-role-practitioner',      note: 'Stage 2 I am a: Practitioner',          required: true },
  { id: 'maker-creator-sole',           note: 'Stage 2 I am the: Sole creator',        required: true },
  { id: 'maker-creator-co-creator',     note: 'Stage 2 I am the: Co-creator',          required: true },
  { id: 'maker-creator-llm',            note: 'Stage 2 I am the: LLM',                 required: true },
  { id: 'maker-creator-llm-assisted',   note: 'Stage 2 I am the: LLM-assisted',        required: true },
  { id: 'work-type-original-argument',  note: 'Stage 2 work type: Original Argument',  required: true },
  { id: 'work-type-null-result',        note: 'Stage 2 work type: Null Result',         required: true },
  { id: 'work-type-replication',        note: 'Stage 2 work type: Replication',         required: true },
  { id: 'work-type-synthesis-review',   note: 'Stage 2 work type: Synthesis/Review',   required: true },
  { id: 'work-type-methodological',     note: 'Stage 2 work type: Methodological',     required: true },
  { id: 'work-type-evidentiary',        note: 'Stage 2 work type: Evidentiary',        required: true },
  { id: 'work-type-none',              note: 'Stage 2 work type: None of these',       required: true },
  { id: 'stage2-domain-display',        note: 'Stage 2 domain pre-fill display',       required: true },
  { id: 'stage2-proceed',               note: 'Stage 2 proceed button',                required: true },

  // ── Entry layer — Detection chips ────────────────────────────────────────
  { id: 'detection-chips-container',    note: 'Detection chips wrapper',               required: true },
  { id: 'detection-chip-work-type',     note: 'Detection chip: work type',             required: true },
  { id: 'detection-chip-domain',        note: 'Detection chip: domain',                required: true },
  { id: 'detection-chip-standing',      note: 'Detection chip: standing',              required: true },

  // ── Entry layer — Layer 2 intent ─────────────────────────────────────────
  { id: 'layer-2-intent',               note: 'Layer 2 intent container',              required: true },
  { id: 'intent-assess',                note: 'Layer 2 intent: Assess',                required: true },
  { id: 'intent-develop',               note: 'Layer 2 intent: Develop',               required: true },
  { id: 'intent-publish',               note: 'Layer 2 intent: Publish',               required: true },
  { id: 'intent-register',              note: 'Layer 2 intent: Register',              required: true },
  { id: 'intent-proceed',               note: 'Layer 2 proceed button',                required: true },

  // ── Entry layer — Layer 3 routes ─────────────────────────────────────────
  { id: 'layer-3-routes',               note: 'Layer 3 route container',               required: true },
  { id: 'route-quick-review',           note: 'Layer 3 route: Quick review',           required: true },
  { id: 'route-wci',                    note: 'Layer 3 route: Credibility evaluation', required: true },
  { id: 'route-full-eval',              note: 'Layer 3 route: Full eval',              required: true },
  { id: 'route-impact',                 note: 'Layer 3 route: Impact',                 required: true },
  { id: 'route-title-framing',          note: 'Layer 3 route: Title/framing',          required: true },
  { id: 'route-improvement',            note: 'Layer 3 route: Improvement rounds',     required: true },
  { id: 'route-registry',               note: 'Layer 3 route: Registry',               required: true },
  { id: 'route-journal',                note: 'Layer 3 route: Journal export',         required: true },
  { id: 'route-observatory',            note: 'Layer 3 route: Observatory',            required: true },
  { id: 'route-export',                 note: 'Layer 3 route: Print/export',           required: true },
  { id: 'route-uri',                    note: 'Layer 3 route: Woodchipper URI',        required: true },
  { id: 'route-orcid',                  note: 'Layer 3 route: ORCID',                  required: true },
  { id: 'route-doi',                    note: 'Layer 3 route: DOI via Zenodo',         required: true },
  { id: 'route-arxiv',                  note: 'Layer 3 route: arXiv',                  required: true },
  { id: 'route-sherpa',                 note: 'Layer 3 route: SHERPA/RoMEO',           required: true },
  { id: 'layer-3-proceed',              note: 'Layer 3 proceed button',                required: true },

  // ── Entry layer — Layer 4 confirmation ──────────────────────────────────
  { id: 'layer-4-confirmation',         note: 'Layer 4 confirmation container',        required: true },
  { id: 'confirm-description',          note: 'Layer 4 confirm: description',          required: true },
  { id: 'confirm-description-change',   note: 'Layer 4 change: description',           required: true },
  { id: 'confirm-upload',               note: 'Layer 4 confirm: upload',               required: true },
  { id: 'confirm-role',                 note: 'Layer 4 confirm: role',                 required: true },
  { id: 'confirm-role-change',          note: 'Layer 4 change: role',                  required: true },
  { id: 'confirm-creator',              note: 'Layer 4 confirm: creator',              required: true },
  { id: 'confirm-creator-change',       note: 'Layer 4 change: creator',               required: true },
  { id: 'confirm-work-type',            note: 'Layer 4 confirm: work type',            required: true },
  { id: 'confirm-work-type-change',     note: 'Layer 4 change: work type',             required: true },
  { id: 'confirm-domain',               note: 'Layer 4 confirm: domain',               required: true },
  { id: 'confirm-domain-change',        note: 'Layer 4 change: domain',                required: true },
  { id: 'confirm-intents',              note: 'Layer 4 confirm: intents',              required: true },
  { id: 'confirm-routes',               note: 'Layer 4 confirm: routes',               required: true },
  { id: 'layer-4-confirm-btn',          note: 'Layer 4 confirm button',                required: true },

  // ── Entry layer — Layer 5 review ─────────────────────────────────────────
  { id: 'layer-5-review',               note: 'Layer 5 review container',              required: true },
  { id: 'layer-5-begin',                note: 'Layer 5 begin button',                  required: true },
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
  // Check presence in component source — matches both:
  //   data-testid="xxx"         (literal JSX attribute)
  //   testId: 'xxx'             (constant array entry rendered via data-testid={testId})
  //   `detection-chip-${field}` (template literal where field matches suffix)
  const literal = componentSources.includes(`data-testid="${entry.id}"`);
  const constRef = componentSources.includes(`testId: '${entry.id}'`);
  const constRefDQ = componentSources.includes(`testId: "${entry.id}"`);
  // JSX prop patterns: testId="xxx" or changeTestId="xxx" passed to sub-components
  // that render data-testid={testId} or data-testid={changeTestId}
  const jsxProp = componentSources.includes(`testId="${entry.id}"`) ||
                  componentSources.includes(`changeTestId="${entry.id}"`);
  // Template literal patterns: e.g. `detection-chip-${chip.field}` with field: 'work-type'
  // produces data-testid="detection-chip-work-type" at runtime.
  // Also handles `review-route-${route}` patterns.
  // Strategy: find any template literal `prefix${` where prefix matches the id start,
  // then verify the suffix exists as a string constant in the source.
  let templateMatch = false;
  if (!literal && !constRef && !constRefDQ) {
    // Try splitting the id at various dash positions to find prefix+suffix combos
    for (let i = entry.id.indexOf('-'); i > 0; i = entry.id.indexOf('-', i + 1)) {
      const prefix = entry.id.slice(0, i + 1);
      const suffix = entry.id.slice(i + 1);
      if (componentSources.includes(prefix + '${') &&
          componentSources.includes(`'${suffix}'`)) {
        templateMatch = true;
        break;
      }
    }
  }
  const inSource = literal || constRef || constRefDQ || jsxProp || templateMatch;
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
