import { atom } from 'nanostores';
import type { User } from '@supabase/supabase-js';

export type AuthStoreState = {
  user: User | null;
  isHydrated: boolean;
};

export const $authStore = atom<AuthStoreState>({
  user: null,
  isHydrated: false,
});