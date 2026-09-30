'use client';

import { useEffect } from 'react';
import type { ProgressSnapshot } from '@/lib/progress/types';
import { hydrateProgress } from '@/lib/stores/progress-store';
import { hydrateProgram } from '@/lib/stores/program-store';

type ProgressHydratorProps = {
  snapshot: ProgressSnapshot;
};

export function ProgressHydrator({
  snapshot,
}: ProgressHydratorProps) {
  useEffect(() => {
    hydrateProgress(snapshot);
    hydrateProgram(snapshot);
  }, [snapshot]);

  return null;
}