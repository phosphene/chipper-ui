import { http, HttpResponse } from 'msw';
import type { DetectionResult, WCIResult } from '../../store/ceremony.types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ── Mock response shapes — must match openapi.yaml ──────────────

const mockDetection: DetectionResult = {
  workType: 'null-result',
  domain: 'Behavioral Ecology',
  standing: 'graduate-researcher',
  confidence: 'medium',
  academicMarkersDetected: ['null', 'hypothesis'],
};

const mockWCIResult: WCIResult = {
  compositeScore: 62,
  band: 'promising',
  dimensionScores: [
    { dimension: 'N', rawScore: 4.0, weight: 1.0, weightedScore: 4.0, justification: 'Structurally expected for null result.', keyPassage: null },
    { dimension: 'E', rawScore: 8.0, weight: 1.5, weightedScore: 12.0, justification: 'Three independent study sites.', keyPassage: '"p > 0.3 in all comparisons"' },
    { dimension: 'P', rawScore: 5.0, weight: 1.2, weightedScore: 6.0, justification: 'General prior applies; no domain variant.', keyPassage: null },
    { dimension: 'C', rawScore: 7.0, weight: 1.0, weightedScore: 7.0, justification: 'Framework holds throughout.', keyPassage: null },
    { dimension: 'S', rawScore: 7.0, weight: 1.0, weightedScore: 7.0, justification: 'Economical apparatus.', keyPassage: null },
    { dimension: 'Sc', rawScore: 5.0, weight: 0.8, weightedScore: 4.0, justification: 'Limited to three study sites.', keyPassage: null },
    { dimension: 'L', rawScore: 7.0, weight: 1.0, weightedScore: 7.0, justification: 'Well-situated in prior work.', keyPassage: null },
    { dimension: 'M', rawScore: 8.5, weight: 1.5, weightedScore: 12.75, justification: 'Excellent calibration; null stated as null.', keyPassage: '"not detectable at the temporal resolution our methodology affords"' },
    { dimension: 'D', rawScore: 6.0, weight: 0.8, weightedScore: 4.8, justification: 'Some boundary conditions stated.', keyPassage: null },
  ],
  epistemicLabel: 'corpus-level — no in-session reading on record',
  relativeContext: 'Null-result papers in behavioral ecology typically score 55–68.',
  rubricVersion: '1.0',
  evaluationDate: new Date().toISOString(),
  provenance: 'warm',
};

// ── Handlers — all endpoints + error paths ───────────────────

export const handlers = [
  // Detect
  http.post(`${BASE}/api/detect`, () =>
    HttpResponse.json(mockDetection)
  ),

  // Evaluate
  http.post(`${BASE}/api/evaluate`, () =>
    HttpResponse.json(mockWCIResult)
  ),

  // Boards
  http.get(`${BASE}/api/boards/:domain`, () =>
    HttpResponse.json({ entries: [], distribution: [], total: 0 })
  ),

  // Portfolio
  http.get(`${BASE}/api/portfolio/:userId`, () =>
    HttpResponse.json({ evaluations: [] })
  ),

  // Record
  http.post(`${BASE}/api/record`, () =>
    HttpResponse.json({ recorded: true, properties: [] })
  ),
];

// ── Error handlers — import these in specific tests ──────────

export const errorHandlers = {
  detectFailed: http.post(`${BASE}/api/detect`, () =>
    HttpResponse.json(
      { error: 'Detection failed', code: 'DETECTION_ERROR' },
      { status: 500 }
    )
  ),
  evaluateFailed: http.post(`${BASE}/api/evaluate`, () =>
    HttpResponse.json(
      { error: 'Evaluation failed', code: 'EVALUATION_ERROR' },
      { status: 500 }
    )
  ),
};
