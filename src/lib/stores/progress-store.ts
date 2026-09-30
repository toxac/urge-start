import { atom } from 'nanostores';

import type { ProgressSnapshot } from '@/lib/progress/types';

export type ProgressStoreState = {
  programVersion: number | null;
  currentNodeKey: string | null;
  completed: string[];
  isHydrated: boolean;
  isSaving: boolean;
};

const initialState: ProgressStoreState = {
  programVersion: null,
  currentNodeKey: null,
  completed: [],
  isHydrated: false,
  isSaving: false,
};

export const $progressStore = atom<ProgressStoreState>({
  ...initialState,
});

export function hydrateProgress(snapshot: ProgressSnapshot) {
  $progressStore.set({
    programVersion: snapshot.programVersion,
    currentNodeKey: snapshot.currentNodeKey,
    completed: snapshot.completed,
    isHydrated: true,
    isSaving: false,
  });
}

export function updateProgressAfterCompletion(
  snapshot: ProgressSnapshot,
) {
  const current = $progressStore.get();

  $progressStore.set({
    ...current,
    programVersion: snapshot.programVersion,
    currentNodeKey: snapshot.currentNodeKey,
    completed: snapshot.completed,
    isHydrated: true,
  });
}

export function setProgressSaving(isSaving: boolean) {
  $progressStore.set({
    ...$progressStore.get(),
    isSaving,
  });
}