'use client';

import { useEffect, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';

import { $authStore } from '@/lib/stores/auth-store';
import { userContextActions } from '@/lib/stores/user-context';
import type { ProfileRow, ProgramContextRow } from '@/lib/stores/user-context';

interface UserHydratorProps {
  user: User;
  profile: ProfileRow | null;
  userContext: ProgramContextRow | null;
  children: ReactNode;
}

export function UserHydrator({
  user,
  profile,
  userContext,
  children,
}: UserHydratorProps) {
  useEffect(() => {
    $authStore.set({
      user,
      isHydrated: true,
    });

    userContextActions.hydrate(profile, userContext);
  }, [user, profile, userContext]);

  return <>{children}</>;
}