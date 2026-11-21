import { atom, computed, map } from 'nanostores';
import type {
  ExperimentBlueprint,
  ExperimentCategory,
  UserExperiment,
  UserExperimentWithBlueprint,
} from '@/lib/types/experiments';

// ============================================================================
// 1. Experiment Blueprints Store (Catalog)
// ============================================================================
export const $experimentBlueprints = atom<ExperimentBlueprint[]>([]);
export const $experimentBlueprintsHydrated = atom<boolean>(false);

export const experimentBlueprintsActions = {
  hydrate(items: ExperimentBlueprint[]) {
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
    $experimentBlueprints.set(sorted);
    $experimentBlueprintsHydrated.set(true);
  },

  getByKey(key: string): ExperimentBlueprint | undefined {
    return $experimentBlueprints.get().find((bp) => bp.key === key);
  },

  getByCategory(category: ExperimentCategory): ExperimentBlueprint[] {
    return $experimentBlueprints
      .get()
      .filter((bp) => bp.category === category);
  },
};

// ============================================================================
// 2. User Experiments Store (Founder Runs)
// ============================================================================
export type UserExperimentsState = {
  byId: Record<string, UserExperiment>;
  allIds: string[];
  hydrated: boolean;
};

export const $userExperiments = map<UserExperimentsState>({
  byId: {},
  allIds: [],
  hydrated: false,
});

export const userExperimentsActions = {
  hydrate(items: UserExperiment[]) {
    const byId: Record<string, UserExperiment> = {};
    const allIds: string[] = [];

    for (const item of items) {
      byId[item.id] = item;
      allIds.push(item.id);
    }

    $userExperiments.set({
      byId,
      allIds,
      hydrated: true,
    });
  },

  upsert(item: UserExperiment) {
    const current = $userExperiments.get();
    const exists = Boolean(current.byId[item.id]);

    $userExperiments.set({
      byId: {
        ...current.byId,
        [item.id]: item,
      },
      allIds: exists ? current.allIds : [item.id, ...current.allIds],
      hydrated: true,
    });
  },

  upsertMany(items: UserExperiment[]) {
    if (items.length === 0) return;
    const current = $userExperiments.get();
    const nextById = { ...current.byId };
    const nextIds = [...current.allIds];

    for (const item of items) {
      if (!nextById[item.id]) {
        nextIds.unshift(item.id);
      }
      nextById[item.id] = item;
    }

    $userExperiments.set({
      byId: nextById,
      allIds: nextIds,
      hydrated: true,
    });
  },

  remove(id: string) {
    const current = $userExperiments.get();
    const nextById = { ...current.byId };
    delete nextById[id];

    $userExperiments.set({
      byId: nextById,
      allIds: current.allIds.filter((existingId) => existingId !== id),
      hydrated: current.hydrated,
    });
  },

  getById(id: string): UserExperiment | undefined {
    return $userExperiments.get().byId[id];
  },

  getByMission(missionKey: string): UserExperiment[] {
    const { byId, allIds } = $userExperiments.get();
    return allIds
      .map((id) => byId[id])
      .filter((exp): exp is UserExperiment => Boolean(exp) && exp.mission_key === missionKey);
  },

  getByProject(projectId: string): UserExperiment[] {
    const { byId, allIds } = $userExperiments.get();
    return allIds
      .map((id) => byId[id])
      .filter((exp): exp is UserExperiment => Boolean(exp) && exp.project_id === projectId);
  },
};

// ============================================================================
// 3. Derived Joined View (User Experiments + Blueprint Metadata)
// ============================================================================
export const $userExperimentsWithBlueprints = computed(
  [$userExperiments, $experimentBlueprints],
  (userState, blueprints): UserExperimentWithBlueprint[] => {
    const bpById = new Map(blueprints.map((bp) => [bp.id, bp]));
    const bpByKey = new Map(blueprints.map((bp) => [bp.key, bp]));

    return userState.allIds
      .map((id) => userState.byId[id])
      .filter((exp): exp is UserExperiment => Boolean(exp))
      .map((exp) => ({
        ...exp,
        blueprint:
          (exp.experiment_id ? bpById.get(exp.experiment_id) : undefined) ??
          bpByKey.get(exp.experiment_key) ??
          null,
      }));
  },
);