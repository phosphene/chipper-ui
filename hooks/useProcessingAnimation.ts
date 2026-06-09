/**
 * useProcessingAnimation — T-269, T-276
 *
 * Drives the nine dimension dots in Stage VII (Processing).
 * Connects to SSE stream when available; falls back to timed animation.
 *
 * SoC: all animation state here. Processing component renders dot states.
 *
 * Sequence: N → E → P → C → S → Sc → L → M → D
 * Each dot: 380ms active, then marked done.
 * After final dot: 1500ms pause, then reveal button appears.
 */

import { useState, useCallback, useRef } from 'react';

export type DotState = 'pending' | 'active' | 'done';

export interface ProcessingState {
  dots: Record<string, DotState>;
  allComplete: boolean;
  revealReady: boolean;
}

const DIMS = ['N', 'E', 'P', 'C', 'S', 'Sc', 'L', 'M', 'D'];
const DOT_INTERVAL_MS = 380;
const REVEAL_DELAY_MS = 1500;

const initialDots = (): Record<string, DotState> =>
  Object.fromEntries(DIMS.map((d) => [d, 'pending' as DotState]));

export function useProcessingAnimation() {
  const [dots, setDots] = useState<Record<string, DotState>>(initialDots);
  const [allComplete, setAllComplete] = useState(false);
  const [revealReady, setRevealReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    // Reset
    setDots(initialDots());
    setAllComplete(false);
    setRevealReady(false);

    let i = 0;

    const tick = () => {
      if (i < DIMS.length) {
        const dim = DIMS[i];
        const prevDim = i > 0 ? DIMS[i - 1] : null;

        setDots((prev) => ({
          ...prev,
          ...(prevDim ? { [prevDim]: 'done' } : {}),
          [dim]: 'active',
        }));

        i++;
        timerRef.current = setTimeout(tick, DOT_INTERVAL_MS);
      } else {
        // Mark final dot done
        setDots((prev) => ({ ...prev, [DIMS[DIMS.length - 1]]: 'done' }));
        setAllComplete(true);

        // 1.5s pause before reveal button appears
        timerRef.current = setTimeout(() => {
          setRevealReady(true);
        }, REVEAL_DELAY_MS);
      }
    };

    timerRef.current = setTimeout(tick, DOT_INTERVAL_MS);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDots(initialDots());
    setAllComplete(false);
    setRevealReady(false);
  }, []);

  // completeDimension — called by SSE stream when dimension score arrives
  // overrides the timed animation with real scoring events
  const completeDimension = useCallback((dimension: string) => {
    setDots((prev) => ({ ...prev, [dimension]: 'done' }));
    // Check if all done
    setDots((prev) => {
      const allDone = DIMS.every((d) => prev[d] === 'done' || d === dimension);
      if (allDone) {
        setAllComplete(true);
        timerRef.current = setTimeout(() => setRevealReady(true), REVEAL_DELAY_MS);
      }
      return { ...prev, [dimension]: 'done' };
    });
  }, []);

  return {
    dots,
    allComplete,
    revealReady,
    start,
    reset,
    completeDimension,
  };
}
