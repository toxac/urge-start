'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@nanostores/react';
import { UserRound } from 'lucide-react';

import { $profileStore } from '@/lib/stores/profile-store';
import type { UserProfile } from '@/lib/stores/profile-store';

import {
  PLATFORM_ACCOUNT_ITEMS,
  PLATFORM_NAV_ITEMS,
} from './platformNavigation';

interface SidebarProps {
  initialProfile: UserProfile | null;
}

function isActivePath(
  pathname: string,
  href: string,
  exact = false,
) {
  if (exact) {
    return pathname === href;
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export function Sidebar({
  initialProfile,
}: SidebarProps) {
  const pathname = usePathname();
  const profileState = useStore($profileStore);

  const profile = profileState.isHydrated
    ? profileState.profile
    : initialProfile;

  const avatarUrl = profile?.avatar_url ?? null;
  const displayName =
    profile?.display_name ||
    profile?.username ||
    'Profile';

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-background lg:flex lg:flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
        <Link
          href="/dashboard"
          className="font-heading text-2xl font-bold tracking-tight"
        >
          urge
        </Link>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-1 overflow-y-auto p-4"
      >
        {PLATFORM_NAV_ITEMS.map(
          ({
            label,
            href,
            icon: Icon,
            exact,
          }) => {
            const active = isActivePath(
              pathname,
              href,
              exact,
            );

            return (
              <Link
                key={href}
                href={href}
                aria-current={
                  active ? 'page' : undefined
                }
                className={[
                  'flex h-11 items-center gap-3 rounded-lg px-3',
                  'text-sm transition-colors',
                  active
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                ].join(' ')}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          },
        )}
      </nav>

      <div className="shrink-0 border-t border-border p-4">
        {PLATFORM_ACCOUNT_ITEMS.map(
          ({
            label,
            href,
            icon: Icon,
          }) => {
            const active = isActivePath(
              pathname,
              href,
              true,
            );

            return (
              <Link
                key={href}
                href={href}
                aria-current={
                  active ? 'page' : undefined
                }
                className={[
                  'flex h-11 items-center gap-3 rounded-lg px-3',
                  'text-sm transition-colors',
                  active
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                ].join(' ')}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <Icon className="h-5 w-5 shrink-0" />
                )}

                <span className="min-w-0 truncate">
                  {displayName}
                </span>
              </Link>
            );
          },
        )}
      </div>
    </aside>
  );
}