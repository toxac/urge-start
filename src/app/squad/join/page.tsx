import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldAlert } from 'lucide-react';

import { getSquadInvitation } from '@/actions/squad-invite';
import { SquadJoinClient } from '@/components/squad/SquadJoinClient';

export const metadata: Metadata = {
  title: 'Join a Personal Squad · Urge',
  description:
    'You have been invited to be part of someone’s personal support squad on Urge.',
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SquadJoinPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const contactId =
    typeof params.contactId === 'string' ? params.contactId : '';
  const token = typeof params.token === 'string' ? params.token : '';

  const lookup = await getSquadInvitation(contactId, token);

  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto mb-10 flex max-w-2xl items-center justify-between">
        <Link
          href="/"
          className="font-heading text-xl font-semibold tracking-tight text-foreground"
        >
          Urge
        </Link>
        <span className="text-xs text-muted-foreground">
          Squad Invitation
        </span>
      </div>

      {lookup.state === 'invalid' ? (
        <div className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-card p-7 sm:p-10 space-y-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            This invitation link isn’t active.
          </h1>

          <p className="text-base leading-7 text-muted-foreground">
            The link may have expired, been replaced by a newer invitation, or
            copied incompletely. If someone invited you to their squad, ask them
            to share a fresh link from their Urge dashboard.
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Go to Urge
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <SquadJoinClient
          initialState={lookup.state}
          invitation={lookup.invitation}
          token={token}
        />
      )}
    </main>
  );
}