'use client';

import { useEffect } from 'react';

import { hydrateProgress } from '@/lib/stores/progress-store';
import type { ProgressSnapshot } from '@/lib/progress/types';

type ProgressHydratorProps = {
  snapshot: ProgressSnapshot;
};

export function ProgressHydrator({
  snapshot,
}: ProgressHydratorProps) {
  useEffect(() => {
    hydrateProgress(snapshot);
  }, [snapshot]);

  return null;
}