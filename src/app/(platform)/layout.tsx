import type { ReactNode } from 'react';

import { UserHydrator } from '@/components/hydrators/UserHydrator';
import { AppShell } from '@/components/layout/AppShell';
import { getAuthenticatedUser, getCurrentProfile } from '@/actions/auth';
import { getCurrentProgramContext } from '@/actions/user-context';

interface PlatformLayoutProps {
  children: ReactNode;
}

export default async function PlatformLayout({ children }: PlatformLayoutProps) {
  const user = await getAuthenticatedUser();
  
  // Fetch both sets of data in parallel to keep loads fast
  const [profile, userContext] = await Promise.all([
    getCurrentProfile(user.id),
    getCurrentProgramContext(user.id)
  ]);

  return (
    <UserHydrator
      user={user}
      profile={profile}
      userContext={userContext}
    >
      <AppShell profile={profile}>
        {children}
      </AppShell>
    </UserHydrator>
  );
}