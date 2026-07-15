/**
 * Store-level verification: Woodchipper works without WCI.
 *
 * The main evaluation path should produce a WoodchipperReading,
 * not a WCIResult. wciResult should remain null throughout
 * a standard user journey.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCeremonyStore } from './ceremony';
import type { WoodchipperReading } from './ceremony.types';

describe('Woodchipper without WCI', () => {
  beforeEach(() => {
    useCeremonyStore.getState().reset();
  });

  it('initial state has null woodchipperReading and null wciResult', () => {
    const state = useCeremonyStore.getState();
    expect(state.woodchipperReading).toBeNull();
    expect(state.wciResult).toBeNull();
  });

  it('setWoodchipperReading populates reading and sets processingComplete', () => {
    const reading: WoodchipperReading = {
      workStage: 'draft',
      stageReasoning: "Test stage reasoning",
      categorization: 'original argument',
      strengths: ['Clear methodology described'],
      developmentAreas: ['Claims outrun evidence in section 3'],
      claimsGap: 'Claims detected but supporting evidence not yet visible in the abstract',
      titleAlignment: 'Title is broader than the demonstrated findings',
      bearings: ['This work bears on cooperative foraging theory'],
      futureDirections: ['Test BEI metric against additional fossil assemblages'],
      unintendedDiscoveries: [],
      basis: 'high confidence — substantial submission, detailed reading possible',
      relativeContext: 'Within paleoanthropology',
    };

    useCeremonyStore.getState().setWoodchipperReading(reading);

    const state = useCeremonyStore.getState();
    expect(state.woodchipperReading).toEqual(reading);
    expect(state.processingComplete).toBe(true);
    // WCI must remain untouched
    expect(state.wciResult).toBeNull();
  });

  it('setWoodchipperReading does not touch wciResult', () => {
    const reading: WoodchipperReading = {
      workStage: 'ideas',
      stageReasoning: "Test stage reasoning",
      categorization: 'synthesis review',
      strengths: ['Work submitted'],
      developmentAreas: ['More content needed'],
      claimsGap: null,
      titleAlignment: 'No title provided',
      bearings: [],
      futureDirections: [],
      unintendedDiscoveries: [],
      basis: 'low confidence — brief submission',
      relativeContext: null,
    };

    useCeremonyStore.getState().setWoodchipperReading(reading);
    expect(useCeremonyStore.getState().wciResult).toBeNull();
  });

  it('WoodchipperReading has no score, band, or dimension fields', () => {
    const reading: WoodchipperReading = {
      workStage: 'near-final',
      stageReasoning: "Test stage reasoning",
      categorization: 'evidentiary finding',
      strengths: ['Strong evidential markers'],
      developmentAreas: [],
      claimsGap: null,
      titleAlignment: 'Title matches scope well',
      bearings: ['Bears on climate adaptation models'],
      futureDirections: ['Extend to Southern Hemisphere datasets'],
      unintendedDiscoveries: ['Unexpected correlation with altitude'],
      basis: 'high confidence — substantial submission',
      relativeContext: 'Within environmental science',
    };

    // TypeScript enforces this at compile time, but let's verify at runtime too
    const keys = Object.keys(reading);
    expect(keys).not.toContain('compositeScore');
    expect(keys).not.toContain('band');
    expect(keys).not.toContain('dimensionScores');
    expect(keys).not.toContain('rawScore');
    expect(keys).not.toContain('weightedScore');
  });

  it('reset clears woodchipperReading without affecting WCI types', () => {
    const reading: WoodchipperReading = {
      workStage: 'draft',
      stageReasoning: "Test stage reasoning",
      categorization: 'methodological contribution',
      strengths: ['Novel metric introduced'],
      developmentAreas: [],
      claimsGap: null,
      titleAlignment: 'No title provided',
      bearings: [],
      futureDirections: [],
      unintendedDiscoveries: [],
      basis: 'medium confidence',
      relativeContext: null,
    };

    useCeremonyStore.getState().setWoodchipperReading(reading);
    expect(useCeremonyStore.getState().woodchipperReading).not.toBeNull();

    useCeremonyStore.getState().reset();
    expect(useCeremonyStore.getState().woodchipperReading).toBeNull();
    expect(useCeremonyStore.getState().wciResult).toBeNull();
  });
});
