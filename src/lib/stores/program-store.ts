import { atom } from 'nanostores';

import type { ProgressSnapshot } from '@/lib/progress/types';

export type ProgramStoreState = {
  programVersion: number | null;
  currentNodeKey: string | null;
  isHydrated: boolean;
};

const initialState: ProgramStoreState = {
  programVersion: null,
  currentNodeKey: null,
  isHydrated: false,
};

export const $programStore = atom<ProgramStoreState>({
  ...initialState,
});

export function hydrateProgram(snapshot: ProgressSnapshot) {
  $programStore.set({
    programVersion: snapshot.programVersion,
    currentNodeKey: snapshot.currentNodeKey,
    isHydrated: true,
  });
}

export function updateProgramAfterCompletion(
  snapshot: ProgressSnapshot,
) {
  $programStore.set({
    programVersion: snapshot.programVersion,
    currentNodeKey: snapshot.currentNodeKey,
    isHydrated: true,
  });
}