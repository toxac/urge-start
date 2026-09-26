import type { ReactNode } from 'react';

import { getAuthenticatedUser, getCurrentProfile } from '@/lib/auth';

interface PlatformLayoutProps {
  children: ReactNode;
}

export default async function PlatformLayout({
  children,
}: PlatformLayoutProps) {
  const user = await getAuthenticatedUser();
  const profile = await getCurrentProfile(user.id);

  return (
    <div>
      {children}
    </div>
  );
}