'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  HeartHandshake,
  Loader2,
  MapPin,
  MessageSquare,
  Sparkles,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  respondToSquadInvitation,
  type PublicSquadInvitation,
} from '@/actions/squad-invite';

type Props = {
  initialState: 'valid' | 'already_accepted' | 'declined';
  invitation: PublicSquadInvitation;
  token: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function SquadJoinClient({ initialState, invitation, token }: Props) {
  const [viewState, setViewState] = useState<
    'valid' | 'already_accepted' | 'declined'
  >(initialState);
  const [replyNote, setReplyNote] = useState(invitation.replyNote ?? '');
  const [confirmingDecline, setConfirmingDecline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDecision(decision: 'accepted' | 'declined') {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await respondToSquadInvitation({
        contactId: invitation.contactId,
        token,
        decision,
        replyNote,
      });

      setViewState(
        decision === 'accepted' ? 'already_accepted' : 'declined',
      );
      setConfirmingDecline(false);
    } catch (err) {
      console.error('[SQUAD JOIN RESPOND]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // 1. Accepted / Confirmed State
  if (viewState === 'already_accepted') {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-8 animate-in fade-in duration-300">
        <div className="rounded-3xl border border-border bg-card p-7 sm:p-10 space-y-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-7 w-7" />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Confirmed
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              You’re in {invitation.founderName}’s squad.
            </h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Thank you for showing up, {invitation.inviteeName}.{' '}
              {invitation.founderName} can now see that you accepted—no
              account setup or extra steps needed on your end.
            </p>
          </div>

          {invitation.roles.length > 0 && (
            <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                How {invitation.founderName} sees you helping
              </p>
              <div className="space-y-2.5">
                {invitation.roles.map((role) => (
                  <div key={role.id}>
                    <p className="text-sm font-semibold text-foreground">
                      {role.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {replyNote.trim() && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Your note to {invitation.founderName}
              </p>
              <p className="text-sm leading-6 text-foreground whitespace-pre-wrap">
                “{replyNote.trim()}”
              </p>
            </div>
          )}
        </div>

        {/* Gentle, zero-pressure Urge introduction */}
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-heading text-base font-semibold">
              Curious what {invitation.founderName} is using?
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Urge helps people start something from scratch through small,
              real-world steps instead of guessing alone.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Explore Urge
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // 2. Politely Declined State
  if (viewState === 'declined') {
    return (
      <div className="mx-auto w-full max-w-2xl animate-in fade-in duration-300">
        <div className="rounded-3xl border border-border bg-card p-7 sm:p-10 space-y-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <XCircle className="h-6 w-6" />
          </div>

          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Thanks for letting {invitation.founderName} know.
          </h1>

          <p className="text-base leading-7 text-muted-foreground">
            We’ve updated your response so {invitation.founderName} knows you
            can’t join their squad right now. No hard feelings—honesty early on
            is always helpful.
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Learn more about Urge
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Pending / Valid Invitation View
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-border bg-card p-7 sm:p-10 space-y-8 shadow-sm">
        {/* Founder Identity Header */}
        <div className="flex items-start gap-4">
          {invitation.founderAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={invitation.founderAvatarUrl}
              alt={invitation.founderName}
              className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-lg font-semibold text-primary">
              {getInitials(invitation.founderName)}
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Personal Squad Invitation
            </p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {invitation.founderName} invited you to join their squad.
            </h1>
            {invitation.founderLocation && (
              <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {invitation.founderLocation}
              </p>
            )}
          </div>
        </div>

        {/* Personal Note from Founder */}
        {invitation.invitationMessage && (
          <div className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span>Note from {invitation.founderName}</span>
            </div>
            <p className="whitespace-pre-wrap text-base leading-7 text-foreground">
              {invitation.invitationMessage}
            </p>
          </div>
        )}

        {/* Roles They Were Chosen For */}
        {invitation.roles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-base font-semibold">
                Why {invitation.founderName} thought of you
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {invitation.roles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 space-y-1"
                >
                  <p className="font-semibold text-sm text-foreground">
                    {role.label}
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What Being in a Squad Means */}
        <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-background p-4 text-sm text-muted-foreground">
          <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="leading-6">
            <strong className="font-medium text-foreground">
              What this means:
            </strong>{' '}
            A squad on Urge is a small circle of 3–5 trusted people. There are
            no scheduled calls or formal obligations—just occasional honest
            perspective, encouragement, or a quick reality check when{' '}
            {invitation.founderName} is testing ideas in the real world.
          </p>
        </div>

        {/* Optional Reply Note */}
        <div className="space-y-2">
          <label
            htmlFor="invitee-reply"
            className="block text-sm font-medium text-foreground"
          >
            Leave a quick note back for {invitation.founderName}{' '}
            <span className="font-normal text-muted-foreground">(Optional)</span>
          </label>
          <Textarea
            id="invitee-reply"
            value={replyNote}
            onChange={(e) => setReplyNote(e.target.value)}
            placeholder={`Happy to be in your corner, ${invitation.founderName}! Reach out anytime you want a second pair of eyes.`}
            rows={3}
            maxLength={500}
            disabled={isSubmitting}
            className="resize-y text-sm leading-6"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Actions */}
        {confirmingDecline ? (
          <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
            <p className="text-sm text-foreground">
              Are you sure you want to let {invitation.founderName} know you
              can’t join right now?
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
                onClick={() => setConfirmingDecline(false)}
              >
                Go back
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isSubmitting}
                onClick={() => void handleDecision('declined')}
                className="rounded-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Yes, decline invitation'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setConfirmingDecline(true)}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              I can’t join right now
            </button>

            <Button
              type="button"
              onClick={() => void handleDecision('accepted')}
              disabled={isSubmitting}
              className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Accept &amp; Join Squad
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}