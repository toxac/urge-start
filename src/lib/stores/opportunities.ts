import { atom } from 'nanostores';
import type { UserOpportunity } from '@/lib/types/opportunities';

export interface OpportunitiesState {
  isHydrated: boolean;
  byId: Record<string, UserOpportunity>;
}

export const $opportunities = atom<OpportunitiesState>({
  isHydrated: false,
  byId: {},
});

export const opportunitiesActions = {
  hydrate: (records: UserOpportunity[]) => {
    const byId: Record<string, UserOpportunity> = {};
    for (const record of records) {
      byId[record.id] = record;
    }
    $opportunities.set({ isHydrated: true, byId });
  },

  upsert: (opportunity: UserOpportunity) => {
    const current = $opportunities.get();
    $opportunities.set({
      ...current,
      byId: { ...current.byId, [opportunity.id]: opportunity },
    });
  },

  getAll: (): UserOpportunity[] => {
    return Object.values($opportunities.get().byId);
  },

  getById: (id: string): UserOpportunity | undefined => {
    return $opportunities.get().byId[id];
  },
};