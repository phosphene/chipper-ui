/**
 * Stage I — Maker Declaration (T-268)
 * SoC: zero logic. Reads store via selectors. Renders only.
 */
'use client';
import { useCeremonyStore } from '@/store/ceremony';
import { canAdvanceFromCurrent } from '@/store/ceremony.selectors';
import { ReviewCard } from '../ReviewCard';
import { StageNav } from '../StageNav';

export function StageI() {
  const store = useCeremonyStore();
  const state = useCeremonyStore.getState();
  const canAdvance = canAdvanceFromCurrent(state);
  const decl = store.makerDeclaration;

  return (
    <div data-testid="stage-I">
      <div className="epigraph">
        The isnad precedes the matn. The chain of who carries the work is examined before the work itself.
        <span className="attr">— Islamic hadith science</span>
      </div>

      <div className="field-group">
        <label className="field-label">In your own words</label>
        <p className="field-hint">Describe yourself in relation to this work.</p>
        <textarea
          data-testid="stage-I-freetext"
          className="ceremony-input"
          value={decl?.freeText ?? ''}
          onChange={(e) => store.updateMakerDeclaration({ freeText: e.target.value })}
          placeholder="I am a graduate student in behavioral ecology…"
        />
      </div>

      {decl && (
        <>
          <ReviewCard label="Standing" value={decl.standing.value} source={decl.standing.source}
            note="Calibrates expectations, not criteria." editable />
          <ReviewCard label="Tradition" value={decl.tradition.value} source={decl.tradition.source} editable />
          <ReviewCard label="Relationship to the Work" value={decl.relationshipToWork.value}
            source={decl.relationshipToWork.source} editable />
        </>
      )}

      <StageNav canAdvance={canAdvance} onAdvance={() => store.advanceStage()} showBack={false} testidPrefix="stage-I" />
    </div>
  );
}
