/**
 * useDetection — T-266
 *
 * Handles the POST /api/detect call and feeds results into the ceremony store.
 * All side effects here; components call this hook and render results.
 *
 * SoC: network call here, not in components.
 */

import { useState, useCallback } from 'react';
import type { DetectionResult } from '@/store/ceremony.types';
import { useCeremonyStore } from '@/store/ceremony';

interface UseDetectionReturn {
  detect: (text: string, fileContent?: string) => Promise<void>;
  result: DetectionResult | null;
  isLoading: boolean;
  error: string | null;
  hasAcademicMarkers: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export function useDetection(): UseDetectionReturn {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initFromDetection = useCeremonyStore((s) => s.initFromDetection);

  const detect = useCallback(async (text: string, fileContent?: string) => {
    if (text.trim().length < 15) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          file_content: fileContent ?? null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Detection failed');
      }

      const data: DetectionResult = await res.json();

      // Map snake_case API response to camelCase store types
      const mapped: DetectionResult = {
        workType: data.work_type ?? data.workType,
        domain: data.domain,
        standing: data.standing,
        confidence: data.confidence,
        academicMarkersDetected: data.academic_markers_detected ?? data.academicMarkersDetected ?? [],
      } as unknown as DetectionResult;

      setResult(mapped);
      initFromDetection(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [initFromDetection]);

  return {
    detect,
    result,
    isLoading,
    error,
    hasAcademicMarkers: (result?.academicMarkersDetected?.length ?? 0) > 0,
  };
}
