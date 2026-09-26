'use client';

import { useEffect, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';

import { $authStore } from '@/lib/stores/auth-store';
import { $profileStore } from '@/lib/stores/profile-store';
import type { UserProfile } from '@/lib/stores/profile-store';

interface UserHydratorProps {
  user: User;
  profile: UserProfile | null;
  children: ReactNode;
}

export function UserHydrator({
  user,
  profile,
  children,
}: UserHydratorProps) {
  useEffect(() => {
    $authStore.set({
      user,
      isHydrated: true,
    });

    $profileStore.set({
      profile,
      isHydrated: true,
    });
  }, [user, profile]);

  return children;
}