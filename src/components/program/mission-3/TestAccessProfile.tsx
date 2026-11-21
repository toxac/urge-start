'use client';

import { useState } from 'react';
import { AlertCircle, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FounderAccessProfile } from '@/lib/types/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type AccessChannelOption = {
  key: keyof Pick<
    FounderAccessProfile,
    | 'canPostOnline'
    | 'canBuildSimplePage'
    | 'hasWarmContacts'
    | 'canMeetInPerson'
    | 'canRunSmallAds'
  >;
  label: string;
  description: string;
};

const CHANNEL_OPTIONS: AccessChannelOption[] = [
  {
    key: 'canPostOnline',
    label: 'Online communities & social feeds',
    description:
      'I can post or start discussions on Reddit, LinkedIn, Instagram, YouTube, WhatsApp/Facebook groups, or niche forums.',
  },
  {
    key: 'canBuildSimplePage',
    label: 'A simple sign-up page or form',
    description:
      'I can put up a plain one-page site or form (Carrd, Tally, Google Form, or a simple webpage) and share the link.',
  },
  {
    key: 'hasWarmContacts',
    label: '1-on-1 conversations or warm contacts',
    description:
      'I know people who have this problem—or can message individuals directly for a short chat or early spot.',
  },
  {
    key: 'canMeetInPerson',
    label: 'Local spots, flyers, or face-to-face reach',
    description:
      'I can talk to people in person, put up a flyer/poster, or set up at a local venue, campus, market, or meetup.',
  },
  {
    key: 'canRunSmallAds',
    label: 'A small, capped ad budget (optional)',
    description:
      'I am open to spending a small amount on a capped ad pointing to a sign-up page to reach strangers.',
  },
];

const HOURS_OPTIONS = ['2–3 hours', '4–6 hours', '7+ hours'] as const;

type AccessPayload = {
  completed?: boolean;
  accessProfile?: FounderAccessProfile;
};

export function TestAccessProfile({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const saved = (progress.payload ?? {}) as AccessPayload;
  const savedProfile = saved.accessProfile ?? {};

  const [profile, setProfile] = useState<FounderAccessProfile>({
    canPostOnline: Boolean(savedProfile.canPostOnline),
    canBuildSimplePage: Boolean(savedProfile.canBuildSimplePage),
    hasWarmContacts: Boolean(savedProfile.hasWarmContacts),
    canMeetInPerson: Boolean(savedProfile.canMeetInPerson),
    canRunSmallAds: Boolean(savedProfile.canRunSmallAds),
    weeklyHours:
      typeof savedProfile.weeklyHours === 'string'
        ? savedProfile.weeklyHours
        : '4–6 hours',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAtLeastOneChannel = Boolean(
    profile.canPostOnline ||
      profile.canBuildSimplePage ||
      profile.hasWarmContacts ||
      profile.canMeetInPerson ||
      profile.canRunSmallAds,
  );

  function toggleChannel(key: AccessChannelOption['key']) {
    setProfile((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setError(null);
  }

  async function handleContinue() {
    if (isSubmitting) return;
    if (!hasAtLeastOneChannel) {
      setError('Pick at least one way you could reach people this week.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onComplete({
        completed: true,
        accessProfile: profile,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your choices.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      <div className="max-w-3xl space-y-4">
        <h2 className="text-lg font-bold">
          1. Select all the ways you can realistically reach people this week
        </h2>
        <div className="space-y-3">
          {CHANNEL_OPTIONS.map((opt) => {
            const checked = Boolean(profile[opt.key]);
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={checked}
                disabled={isSubmitting}
                onClick={() => toggleChannel(opt.key)}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  checked
                    ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">{opt.label}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                  <div
                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                      checked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border'
                    }`}
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl space-y-3">
        <h2 className="text-lg font-bold">
          2. How much time can you put into running a test over the next week?
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {HOURS_OPTIONS.map((hours) => {
            const isSelected = profile.weeklyHours === hours;
            return (
              <button
                key={hours}
                type="button"
                aria-pressed={isSelected}
                disabled={isSubmitting}
                onClick={() =>
                  setProfile((prev) => ({ ...prev, weeklyHours: hours }))
                }
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  isSelected
                    ? 'border-primary bg-primary/[0.06] text-primary ring-2 ring-primary/20'
                    : 'border-border bg-card text-foreground hover:border-primary/50'
                }`}
              >
                {hours}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={isSubmitting || !hasAtLeastOneChannel}
          className="h-12 rounded-full px-8 text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Frame how you&apos;ll put it
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}