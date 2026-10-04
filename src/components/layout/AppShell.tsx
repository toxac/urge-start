import type { ReactNode } from 'react';

// Use the new ProfileRow type from user-context
import type { ProfileRow } from '@/lib/stores/user-context';

import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
  profile: ProfileRow | null;
}

export function AppShell({
  children,
  profile,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <Sidebar initialProfile={profile} />

        <div className="min-w-0 flex-1">
          <MobileNav initialProfile={profile} />

          <main className="min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}