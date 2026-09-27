import { atom } from 'nanostores';

import type { ProgressSnapshot } from '@/lib/progress/types';

export type ProgressStoreState = {
  programVersion: number | null;
  currentNodeKey: string | null;
  completed: string[];
  isHydrated: boolean;
  isSaving: boolean;
};

export const $progressStore = atom<ProgressStoreState>({
  programVersion: null,
  currentNodeKey: null,
  completed: [],
  isHydrated: false,
  isSaving: false,
});

export function hydrateProgress(
  snapshot: ProgressSnapshot,
) {
  $progressStore.set({
    programVersion: snapshot.programVersion,
    currentNodeKey: snapshot.currentNodeKey,
    completed: snapshot.completed,
    isHydrated: true,
    isSaving: false,
  });
}

export function setProgressSaving(
  isSaving: boolean,
) {
  $progressStore.set({
    ...$progressStore.get(),
    isSaving,
  });
}