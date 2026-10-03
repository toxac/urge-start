import type { ReactNode } from 'react';

import { UserHydrator } from '@/components/hydrators/UserHydrator';
import { AppShell } from '@/components/layout/AppShell';
import {
  getAuthenticatedUser,
  getCurrentProfile,
} from '@/actions/auth';

interface PlatformLayoutProps {
  children: ReactNode;
}

export default async function PlatformLayout({
  children,
}: PlatformLayoutProps) {
  const user = await getAuthenticatedUser();
  const profile = await getCurrentProfile(user.id);

  return (
    <UserHydrator
      user={user}
      profile={profile}
    >
      <AppShell profile={profile}>
        {children}
      </AppShell>
    </UserHydrator>
  );
}