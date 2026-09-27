'use client';

import type { Json } from '@/database.types';

import {
  completeNode as completeNodeAction,
} from './actions';

import {
  hydrateProgress,
  setProgressSaving,
} from '@/lib/stores/progress-store';

export async function completeNode(
  nodeKey: string,
  payload: Json,
) {
  setProgressSaving(true);

  try {
    const snapshot = await completeNodeAction(
      nodeKey,
      payload,
    );

    hydrateProgress(snapshot);

    return snapshot;
  } finally {
    setProgressSaving(false);
  }
}