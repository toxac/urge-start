import { atom } from 'nanostores';

import type { Database } from '@/database.types';

export type UserProfile = Database['public']['Tables']['user_profile']['Row'];

export type ProfileStoreState = {
  profile: UserProfile | null;
  isHydrated: boolean;
};

export const $profileStore = atom<ProfileStoreState>({
  profile: null,
  isHydrated: false,
});