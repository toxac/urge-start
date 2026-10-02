// src/lib/stores/progress.ts
import { atom } from 'nanostores';

export interface ProgressState {
  isHydrated: boolean;
  completedNodes: Set<string>;
  payloads: Record<string, any>;
}

export const $progress = atom<ProgressState>({
  isHydrated: false,
  completedNodes: new Set(),
  payloads: {},
});

export const progressActions = {
  hydrate: (records: { node_key: string; payload: any }[]) => {
    $progress.set({
      isHydrated: true,
      completedNodes: new Set(records.map((r) => r.node_key)),
      payloads: records.reduce((acc, r) => {
        acc[r.node_key] = r.payload;
        return acc;
      }, {} as Record<string, any>),
    });
  },
  addCompletion: (nodeKey: string, payload?: any) => {
    const current = $progress.get();
    const nextNodes = new Set(current.completedNodes).add(nodeKey);
    $progress.set({
      ...current,
      completedNodes: nextNodes,
      payloads: { ...current.payloads, [nodeKey]: payload },
    });
  }
};