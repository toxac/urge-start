import { atom } from 'nanostores';
import type { Tables } from '@/database.types'; // Adjust path if your types are elsewhere

export type ProfileRow = Tables<'user_profile'>;
export type ProgramContextRow = Tables<'user_program_context'>;

export type UserContextState = {
  isHydrated: boolean;
  profile: ProfileRow | null;
  userContext: ProgramContextRow | null;
};

export const $userContext = atom<UserContextState>({
  isHydrated: false,
  profile: null,
  userContext: null,
});

export const userContextActions = {
  hydrate(profile: ProfileRow | null, userContext: ProgramContextRow | null) {
    $userContext.set({ isHydrated: true, profile, userContext });
  },
  
  updateProfileLocally(updates: Partial<ProfileRow>) {
    const current = $userContext.get();
    if (current.profile) {
      $userContext.set({ ...current, profile: { ...current.profile, ...updates } });
    }
  },

  updateContextLocally(updates: Partial<ProgramContextRow>) {
    const current = $userContext.get();
    // Allow setting userContext even if it was null previously (first time save)
    $userContext.set({
      ...current,
      userContext: current.userContext 
        ? { ...current.userContext, ...updates } 
        : updates as ProgramContextRow
    });
  }
};