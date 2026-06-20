/**
 * Ceremony store selectors — named functions, not inline in components.
 * Every derived state is computed here.
 *
 * Rule: components import selectors, never raw state conditionals.
 * T-282: Store testability-first
 * T-283: Zero logic in JSX
 */

import type { CeremonyState } from './ceremony';
import { STAGE_ORDER } from './ceremony.types';

export const isStageComplete = (state: CeremonyState, stage: string): boolean =>
  state.completedStages.has(stage as never);

export const isConsentComplete = (state: CeremonyState): boolean =>
  !!(state.frameAgreement?.consent1);

export const isIntakeComplete = (state: CeremonyState): boolean =>
  isConsentComplete(state) && state.completedStages.has('IV');

export const canCrossThreshold = (state: CeremonyState): boolean =>
  isIntakeComplete(state) && state.completedStages.has('V');

export const canRevealScore = (state: CeremonyState): boolean =>
  state.processingComplete;

export const canAdvanceFromCurrent = (state: CeremonyState): boolean => {
  const stage = state.currentStage;
  switch (stage) {
    case 'I':  return !!(state.makerDeclaration?.standing?.value);
    case 'II': return !!(state.workClassification?.workType?.value && state.workClassification.workType.value !== 'unknown');
    case 'III': return true; // acknowledged
    case 'IV': return isConsentComplete(state);
    case 'V':  return true; // resting — always advanceable
    default:   return false;
  }
};

export const getStageSummaryChips = (state: CeremonyState, stage: string): string[] => {
  switch (stage) {
    case 'I':
      return [
        state.makerDeclaration?.standing?.value ?? '',
        state.makerDeclaration?.tradition?.value ?? '',
      ].filter(Boolean);
    case 'II':
      return [state.workClassification?.workType?.value ?? ''].filter(Boolean);
    case 'III':
      return [
        state.judgeIdentity?.domain?.value ?? '',
        state.judgeIdentity?.variantAvailable ? state.judgeIdentity.variantName ?? 'variant' : 'general WCI',
      ].filter(Boolean);
    case 'IV':
      return ['Frame accepted'];
    case 'V':
      return ['Case closed'];
    default:
      return [];
  }
};

export const getRelativeStageIndex = (stage: string): number =>
  STAGE_ORDER.indexOf(stage as never);

export const isPublicRecording = (state: CeremonyState): boolean =>
  state.recordingChoice === 'public';
