
import { atom } from 'nanostores';

import type { UserObservation } from '@/lib/types/observations';

export interface ObservationsState {
  isHydrated: boolean;
  byId: Record<string, UserObservation>;
  idsByNode: Record<string, string[]>;
}

const initialState: ObservationsState = {
  isHydrated: false,
  byId: {},
  idsByNode: {},
};

export const $observations = atom<ObservationsState>(initialState);

function buildNodeIndex(
  records: Record<string, UserObservation>,
): Record<string, string[]> {
  const index: Record<string, string[]> = {};

  for (const observation of Object.values(records)) {
    const nodeKey = observation.source_node_key;

    if (!nodeKey) continue;

    (index[nodeKey] ??= []).push(observation.id);
  }

  return index;
}

export const observationsActions = {
  hydrate: (records: UserObservation[]) => {
    const byId: Record<string, UserObservation> = {};

    for (const record of records) {
      byId[record.id] = record;
    }

    $observations.set({
      isHydrated: true,
      byId,
      idsByNode: buildNodeIndex(byId),
    });
  },

  upsert: (observation: UserObservation) => {
    const current = $observations.get();

    const byId = {
      ...current.byId,
      [observation.id]: observation,
    };

    $observations.set({
      ...current,
      byId,
      idsByNode: buildNodeIndex(byId),
    });
  },

  remove: (id: string) => {
    const current = $observations.get();

    if (!current.byId[id]) return;

    const byId = { ...current.byId };
    delete byId[id];

    $observations.set({
      ...current,
      byId,
      idsByNode: buildNodeIndex(byId),
    });
  },

  getById: (id: string): UserObservation | undefined => {
    return $observations.get().byId[id];
  },

  getByNode: (nodeKey: string): UserObservation[] => {
    const state = $observations.get();

    return (state.idsByNode[nodeKey] ?? [])
      .map((id) => state.byId[id])
      .filter(
        (observation): observation is UserObservation =>
          observation !== undefined,
      );
  },
};
