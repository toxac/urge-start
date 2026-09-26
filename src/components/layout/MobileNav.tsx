'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@nanostores/react';
import {
  Menu,
  UserRound,
  X,
} from 'lucide-react';

import { $profileStore } from '@/lib/stores/profile-store';
import type { UserProfile } from '@/lib/stores/profile-store';

import {
  PLATFORM_ACCOUNT_ITEMS,
  PLATFORM_NAV_ITEMS,
} from './platformNavigation';

interface MobileNavProps {
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

export function MobileNav({
  initialProfile,
}: MobileNavProps) {
  const pathname = usePathname();
  const profileState = useStore($profileStore);
  const [open, setOpen] = useState(false);

  const profile = profileState.isHydrated
    ? profileState.profile
    : initialProfile;

  const displayName =
    profile?.display_name ||
    profile?.username ||
    'Profile';

  const avatarUrl = profile?.avatar_url ?? null;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        <Link
          href="/dashboard"
          className="font-heading text-2xl font-bold tracking-tight"
        >
          urge
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          <aside className="absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col bg-background shadow-xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="font-heading text-2xl font-bold tracking-tight"
              >
                urge
              </Link>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
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
                  const active =
                    isActivePath(
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
                        'flex h-11 items-center gap-3 rounded-lg px-3 text-sm',
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
                }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-5 w-5" />
                    )}

                    <span>{displayName}</span>
                  </Link>
                ),
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}