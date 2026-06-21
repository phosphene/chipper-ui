/**
 * Ceremony store tests — T-282
 * Must be green before any component work begins (T-281 constraint).
 * 100% branch coverage required on ceremony.ts and ceremony.selectors.ts.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCeremonyStore } from './ceremony';
import { StageAdvanceError } from './ceremony.types';
import {
  isConsentComplete,
  isIntakeComplete,
  canCrossThreshold,
  canRevealScore,
  canAdvanceFromCurrent,
  getStageSummaryChips,
} from './ceremony.selectors';

// ── Helpers ───────────────────────────────────────────────────

const store = () => useCeremonyStore.getState();

const seedIntake = () => {
  useCeremonyStore.getState().initFromDetection({
    workType: 'null-result',
    domain: 'Behavioral Ecology',
    standing: 'graduate-researcher',
    confidence: 'medium',
    academicMarkersDetected: ['null'],
  });
  useCeremonyStore.getState().updateMakerDeclaration({
    freeText: 'This is a null result paper.',
  });
};

const completeConsent = () => {
  useCeremonyStore.getState().updateConsent('consent1', true);
  // consent2 removed — single checkbox now
};

// ── Setup ─────────────────────────────────────────────────────

beforeEach(() => {
  useCeremonyStore.getState().reset();
});

// ── initFromDetection ─────────────────────────────────────────

describe('initFromDetection', () => {
  it('pre-fills intake fields from detection result with source=detected', () => {
    seedIntake();
    const s = store();
    expect(s.makerDeclaration?.standing.source).toBe('detected');
    expect(s.makerDeclaration?.standing.value).toBe('graduate-researcher');
    expect(s.workClassification?.workType.source).toBe('detected');
    expect(s.workClassification?.workType.value).toBe('null-result');
    expect(s.judgeIdentity?.domain.source).toBe('detected');
    expect(s.judgeIdentity?.domain.value).toBe('Behavioral Ecology');
  });

  it('initialises consent fields to false', () => {
    seedIntake();
    const s = store();
    expect(s.frameAgreement?.consent1).toBe(false);
    // consent2 removed — single checkbox now
  });
});

// ── advanceStage ─────────────────────────────────────────────

describe('advanceStage', () => {
  it('advances from I to II when maker declaration has free text', () => {
    seedIntake();
    store().advanceStage();
    expect(store().currentStage).toBe('II');
    expect(store().completedStages.has('I')).toBe(true);
  });

  it('advances from Stage I even without free text (creator role optional)', () => {
    // Stage I has no preconditions — always advanceable
    store().advanceStage();
    expect(store().currentStage).toBe('II');
  });

  it('advances from Stage II even with unknown work type (all fields optional)', () => {
    seedIntake();
    store().advanceStage(); // I → II
    store().updateWorkClassification({ workType: { value: 'unknown', source: 'detected' } });
    store().advanceStage(); // II → III
    expect(store().currentStage).toBe('III');
  });

  it('advances from II to III when work type is valid', () => {
    seedIntake();
    store().advanceStage(); // I → II
    expect(store().currentStage).toBe('II');
    store().advanceStage(); // II → III
    expect(store().currentStage).toBe('III');
  });

  it('advances from III to IV (always advanceable — acknowledgement)', () => {
    seedIntake();
    store().advanceStage(); // I → II
    store().advanceStage(); // II → III
    store().advanceStage(); // III → IV
    expect(store().currentStage).toBe('IV');
  });

  it('advances from IV even without consent (Proceed always enabled)', () => {
    seedIntake();
    store().advanceStage(); // I
    store().advanceStage(); // II
    store().advanceStage(); // III → IV
    store().advanceStage(); // IV → V
    expect(store().currentStage).toBe('V');
  });

  it('advances from IV to V when consent given', () => {
    seedIntake();
    store().advanceStage(); // I
    store().advanceStage(); // II
    store().advanceStage(); // III → IV
    completeConsent();
    store().advanceStage(); // IV → V
    expect(store().currentStage).toBe('V');
  });
});

// ── backStage ─────────────────────────────────────────────────

describe('backStage', () => {
  it('moves back from II to I', () => {
    seedIntake();
    store().advanceStage();
    store().backStage();
    expect(store().currentStage).toBe('I');
    expect(store().completedStages.has('I')).toBe(false);
  });

  it('does nothing at Stage I (already at start)', () => {
    store().backStage();
    expect(store().currentStage).toBe('I');
  });
});

// ── rest ─────────────────────────────────────────────────────

describe('rest', () => {
  it('advances to VI — no intake gate (rest is always available)', () => {
    seedIntake();
    store().rest();
    expect(store().currentStage).toBe('VI');
    expect(store().completedStages.has('V')).toBe(true);
  });

  it('advances to VI when called after full intake progression', () => {
    seedIntake();
    store().advanceStage(); // I → II
    store().advanceStage(); // II → III
    store().advanceStage(); // III → IV
    completeConsent();
    store().advanceStage(); // IV → V
    store().rest();
    expect(store().currentStage).toBe('VI');
    expect(store().completedStages.has('V')).toBe(true);
  });
});

// ── crossThreshold ────────────────────────────────────────────

describe('crossThreshold', () => {
  it('advances to VII — no intake gate (threshold always crossable)', () => {
    store().crossThreshold();
    expect(store().currentStage).toBe('VII');
    expect(store().completedStages.has('VI')).toBe(true);
  });

  it('advances to VII after full ceremony progression', () => {
    seedIntake();
    store().advanceStage(); // I
    store().advanceStage(); // II
    store().advanceStage(); // III → IV
    completeConsent();
    store().advanceStage(); // IV → V
    store().rest(); // V → VI
    store().crossThreshold(); // VI → VII
    expect(store().currentStage).toBe('VII');
  });
});

// ── revealScore ───────────────────────────────────────────────

describe('revealScore', () => {
  it('throws if processing not complete', () => {
    expect(() => store().revealScore()).toThrow(StageAdvanceError);
  });

  it('advances to VIII when processing complete', () => {
    useCeremonyStore.setState({ processingComplete: true });
    store().revealScore();
    expect(store().currentStage).toBe('VIII');
  });
});

// ── recording ─────────────────────────────────────────────────

describe('recording', () => {
  it('sets recording choice', () => {
    store().setRecordingChoice('private');
    expect(store().recordingChoice).toBe('private');
  });

  it('toggles property on', () => {
    store().toggleProperty('boards');
    expect(store().selectedProperties.has('boards')).toBe(true);
  });

  it('toggles property off', () => {
    store().toggleProperty('boards');
    store().toggleProperty('boards');
    expect(store().selectedProperties.has('boards')).toBe(false);
  });
});

// ── reset ─────────────────────────────────────────────────────

describe('reset', () => {
  it('clears all state to initial', () => {
    seedIntake();
    store().advanceStage();
    store().reset();
    const s = store();
    expect(s.currentStage).toBe('I');
    expect(s.completedStages.size).toBe(0);
    expect(s.makerDeclaration).toBeNull();
    expect(s.wciResult).toBeNull();
    expect(s.recordingChoice).toBeNull();
    expect(s.selectedProperties.size).toBe(0);
  });
});

// ── Selectors ─────────────────────────────────────────────────

describe('selectors', () => {
  it('isConsentComplete — false when neither checked', () => {
    seedIntake();
    expect(isConsentComplete(store())).toBe(false);
  });


  it('isConsentComplete — true when consent1 checked', () => {
    seedIntake();
    completeConsent();
    expect(isConsentComplete(store())).toBe(true);
  });

  it('isIntakeComplete — false without consent', () => {
    seedIntake();
    expect(isIntakeComplete(store())).toBe(false);
  });

  it('canCrossThreshold — false before rest', () => {
    seedIntake();
    expect(canCrossThreshold(store())).toBe(false);
  });

  it('canRevealScore — false before processingComplete', () => {
    expect(canRevealScore(store())).toBe(false);
  });

  it('canRevealScore — true after processingComplete', () => {
    useCeremonyStore.setState({ processingComplete: true });
    expect(canRevealScore(store())).toBe(true);
  });

  it('getStageSummaryChips — returns chips for completed stage I', () => {
    seedIntake();
    const chips = getStageSummaryChips(store(), 'I');
    expect(chips).toContain('graduate-researcher');
    expect(chips).toContain('Behavioral Ecology');
  });

  it('canAdvanceFromCurrent — true at I with no free text (creator role optional)', () => {
    expect(canAdvanceFromCurrent(store())).toBe(true);
  });

  it('canAdvanceFromCurrent — true at I with free text', () => {
    seedIntake();
    expect(canAdvanceFromCurrent(store())).toBe(true);
  });
});
