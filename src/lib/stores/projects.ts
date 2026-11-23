import { computed, map } from 'nanostores';
import type { UserProject, UserProjectOffer } from '@/lib/types/projects';

export type { UserProject, UserProjectOffer } from '@/lib/types/projects';

export type UserProjectsState = {
  byId: Record<string, UserProject>;
  allIds: string[];
  activeId: string | null;
  hydrated: boolean;
};

export const $userProjects = map<UserProjectsState>({
  byId: {},
  allIds: [],
  activeId: null,
  hydrated: false,
});

export type UserProjectOffersState = {
  byId: Record<string, UserProjectOffer>;
  allIds: string[];
  hydrated: boolean;
};

export const $userProjectOffers = map<UserProjectOffersState>({
  byId: {},
  allIds: [],
  hydrated: false,
});

export const projectsActions = {
  hydrateProjects(items: UserProject[]) {
    const byId: Record<string, UserProject> = {};
    const allIds: string[] = [];
    for (const item of items) {
      byId[item.id] = item;
      allIds.push(item.id);
    }
    const active =
      items.find((p) => p.metadata?.status === 'active') ?? items[0] ?? null;

    $userProjects.set({
      byId,
      allIds,
      activeId: active?.id ?? null,
      hydrated: true,
    });
  },

  upsertProject(item: UserProject) {
    const current = $userProjects.get();
    const exists = Boolean(current.byId[item.id]);
    $userProjects.set({
      byId: { ...current.byId, [item.id]: item },
      allIds: exists ? current.allIds : [item.id, ...current.allIds],
      activeId: current.activeId ?? item.id,
      hydrated: true,
    });
  },

  setActive(item: UserProject) {
    const current = $userProjects.get();
    const exists = Boolean(current.byId[item.id]);
    $userProjects.set({
      byId: { ...current.byId, [item.id]: item },
      allIds: exists ? current.allIds : [item.id, ...current.allIds],
      activeId: item.id,
      hydrated: true,
    });
  },

  hydrateOffers(items: UserProjectOffer[]) {
    const byId: Record<string, UserProjectOffer> = {};
    const allIds: string[] = [];
    for (const item of items) {
      byId[item.id] = item;
      allIds.push(item.id);
    }
    $userProjectOffers.set({ byId, allIds, hydrated: true });
  },

  upsertOffer(item: UserProjectOffer) {
    const current = $userProjectOffers.get();
    const exists = Boolean(current.byId[item.id]);
    $userProjectOffers.set({
      byId: { ...current.byId, [item.id]: item },
      allIds: exists ? current.allIds : [item.id, ...current.allIds],
      hydrated: true,
    });
  },
};

export const $activeProject = computed(
  $userProjects,
  (state): UserProject | null => {
    if (state.activeId && state.byId[state.activeId]) {
      return state.byId[state.activeId];
    }
    const projects = state.allIds
      .map((id) => state.byId[id])
      .filter((p): p is UserProject => Boolean(p));
    return (
      projects.find((p) => p.metadata?.status === 'active') ??
      projects[0] ??
      null
    );
  },
);

export const $selectedOffer = computed(
  [$activeProject, $userProjectOffers],
  (project, offerState): UserProjectOffer | null => {
    if (!project) return null;
    if (
      project.selected_offer_id &&
      offerState.byId[project.selected_offer_id]
    ) {
      return offerState.byId[project.selected_offer_id];
    }
    const projectOffers = offerState.allIds
      .map((id) => offerState.byId[id])
      .filter(
        (o): o is UserProjectOffer =>
          Boolean(o) && o.project_id === project.id,
      );
    return projectOffers[0] ?? null;
  },
);