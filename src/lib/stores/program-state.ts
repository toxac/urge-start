// src/lib/stores/program-state.ts
import { atom } from 'nanostores';

export interface ProgramState {
  isHydrated: boolean;
  currentNodeKey: string | null;
  programVersion: number;
}

export const $programState = atom<ProgramState>({
  isHydrated: false,
  currentNodeKey: null,
  programVersion: 2,
});

export const programStateActions = {
  hydrate: (nodeKey: string, version: number = 2) => {
    $programState.set({
      isHydrated: true,
      currentNodeKey: nodeKey,
      programVersion: version,
    });
  },
  setCurrentNode: (nodeKey: string) => {
    const current = $programState.get();$programState.set({ ...current, currentNodeKey: nodeKey });
  }
};