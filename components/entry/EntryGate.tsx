/**
 * EntryGate — T-266, T-267
 *
 * The top-level entry component. Now renders EntryAccordion — the single
 * progressive form that replaced the Simple/Detailed toggle.
 *
 * SimpleEntry and DetailedEntry files are retained but no longer used from here.
 */

'use client';

import { EntryAccordion } from './EntryAccordion';

interface Props {
  onCeremonyStart: () => void;
}

export function EntryGate({ onCeremonyStart }: Props) {
  return (
    <div className="w-full">
      <EntryAccordion onConfirmed={onCeremonyStart} />
    </div>
  );
}
