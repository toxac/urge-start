'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@nanostores/react';
import {
  ArrowRight,
  Compass,
  ExternalLink,
  Loader2,
  MessageSquareHeart,
  Sparkles,
  UserCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { createUserContent } from '@/actions/user-content';
import { $userContext } from '@/lib/stores/user-context';
import type { CapabilitiesContext, ExperienceContext } from '@/lib/types/ai';

type VisibilityActionPayload = {
  title?: string;
  body?: string;
  postId?: string;
  published?: boolean;
  completed?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getContextTagHints(
  capabilitiesRaw: unknown,
  experienceRaw: unknown
): string[] {
  const hints: string[] = [];

  if (isRecord(capabilitiesRaw) && Array.isArray((capabilitiesRaw as CapabilitiesContext).entries)) {
    for (const entry of (capabilitiesRaw as CapabilitiesContext).entries) {
      if (Array.isArray(entry.tags)) {
        for (const tag of entry.tags) {
          if (typeof tag?.name === 'string' && tag.name.trim()) {
            hints.push(tag.name.trim());
          }
        }
      }
    }
  }

  if (isRecord(experienceRaw) && Array.isArray((experienceRaw as ExperienceContext).entries)) {
    for (const entry of (experienceRaw as ExperienceContext).entries) {
      if (Array.isArray(entry.tags)) {
        for (const tag of entry.tags) {
          if (typeof tag?.name === 'string' && tag.name.trim()) {
            hints.push(tag.name.trim());
          }
        }
      }
    }
  }

  return Array.from(new Set(hints)).slice(0, 6);
}

export function VisibilityAction({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);
  const profile = contextState.profile;
  const userContext = contextState.userContext;

  const saved = (progress.payload ?? {}) as VisibilityActionPayload;

  const [title, setTitle] = useState(
    typeof saved.title === 'string' ? saved.title : ''
  );

  const [body, setBody] = useState(
    typeof saved.body === 'string' ? saved.body : ''
  );

  const [postId, setPostId] = useState<string | null>(
    typeof saved.postId === 'string' ? saved.postId : null
  );

  const [step, setStep] = useState<'write' | 'published' | 'done'>(
    saved.completed
      ? 'done'
      : saved.published
        ? 'published'
        : 'write'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contextHints = useMemo(
    () =>
      getContextTagHints(
        userContext?.capabilities,
        userContext?.experience
      ),
    [userContext?.capabilities, userContext?.experience]
  );

  const founderName =
    profile?.display_name?.trim() || profile?.username?.trim() || '';

  const canPublish =
    title.trim().length > 0 &&
    title.trim().length <= 200 &&
    body.trim().length >= 30;

  function handleInsertOutline() {
    if (body.trim().length > 0) return;

    const greeting = founderName ? `Hi everyone, I'm ${founderName}.` : "Hi everyone, I'm [Your Name].";
    const template = `${greeting} Right now I'm based in [City] and spend my days [what you currently do / study / work on].\n\nWhat brought me to Urge:\nI'm exploring [a problem area, curiosity, or why you decided to start now—even if you don't have an idea yet].\n\nWhat I'm hoping to get out of this community (and how I can help others):\nI'd love to connect with people who [e.g., want to swap honest feedback, share weekly check-ins, or know about X]. Happy to be a sounding board on [your strengths/interests] in return!`;

    setBody(template);
    if (!title.trim()) {
      setTitle(
        founderName
          ? `Hello from ${founderName} — excited to start building`
          : 'Hello everyone — excited to start exploring'
      );
    }
  }

  async function handlePublish() {
    if (!canPublish || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createUserContent({
        title: title.trim(),
        category: 'introduction',
        body: body.trim(),
        status: 'published',
        source_type: 'program_node',
        metadata: {
          mission: 1,
          quest: 3,
          node_key: nodeKey,
        },
      });

      setPostId(result.content.id);
      setStep('published');
    } catch (err) {
      console.error(err);
      setError('We could not publish your introduction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onComplete({
        title: title.trim(),
        body: body.trim(),
        postId: postId ?? undefined,
        published: true,
        completed: true,
      });
    } catch (err) {
      console.error(err);
      setError('We could not save your progress. Please try again.');
      setIsSubmitting(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="w-full max-w-3xl space-y-8 animate-in fade-in duration-300">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            YOU ARE IN THE ROOM
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            You showed up.
          </h2>

          <p className="text-lg leading-8 text-muted-foreground">
            You did not wait until you had a finished business or a polished
            story. You let people see you starting.
          </p>
        </div>

        {body && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            {title && (
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {title}
              </h3>
            )}
            <p className="whitespace-pre-wrap text-base leading-7 text-muted-foreground">
              {body}
            </p>
            {postId && (
              <div className="pt-2">
                <Link
                  href={`/community/forum/${postId}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  View your post in the forum
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end border-t border-border pt-6">
          <Button
            onClick={() => void handleComplete()}
            disabled={isSubmitting}
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            Continue
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'published') {
    return (
      <div className="w-full max-w-3xl space-y-10 animate-in fade-in duration-300">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            YOU MADE YOURSELF VISIBLE
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Your introduction is live in the forum.
          </h2>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
            <h3 className="mb-3 text-xl font-semibold text-foreground">
              {title}
            </h3>

            <p className="whitespace-pre-wrap text-base leading-7 text-foreground sm:text-lg sm:leading-8">
              {body}
            </p>

            {postId && (
              <p className="mt-5 text-sm">
                <Link
                  href={`/community/forum/${postId}`}
                  className="inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-4"
                >
                  Open your introduction in the forum
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </p>
            )}
          </div>

          <p className="text-lg leading-8 text-muted-foreground">
            That might have felt easy, or it might have felt uncomfortable.
            Either way, you just took a step that required you to be seen
            before everything was ready—and gave other members a way to find you.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end border-t border-border pt-6">
          <Button
            onClick={() => void handleComplete()}
            disabled={isSubmitting}
            className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-8 pb-16 animate-in fade-in duration-300">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          YOUR FIRST FORUM POST
        </p>

        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'Introduce yourself to the room.'}
        </h1>

        <p className="text-lg leading-8 text-muted-foreground">
          For most people, this is your very first post in the Urge community.
          Everyone here is starting from scratch—nobody expects a finished
          business, a polished pitch, or even a concrete idea yet.
        </p>
      </div>

      {/* Structured 3-Part Prompting Guide */}
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            What makes a great introduction
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            The more real and specific you are, the easier it is for the right
            peers to reply and connect with you. Aim to cover these three things:
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <UserCheck className="h-4 w-4 shrink-0" />
              <h3 className="text-sm font-semibold text-foreground">
                1. Who you are now
              </h3>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Where you&apos;re based, what your day-to-day looks like, and a
              skill, hobby, or environment you know well.
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Compass className="h-4 w-4 shrink-0" />
              <h3 className="text-sm font-semibold text-foreground">
                2. Why you&apos;re here
              </h3>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              What made you start now, a problem or space you&apos;re curious
              about, or what you&apos;re trying to figure out.
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <MessageSquareHeart className="h-4 w-4 shrink-0" />
              <h3 className="text-sm font-semibold text-foreground">
                3. What you want from Urge
              </h3>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              What kind of people, feedback, or accountability you&apos;re
              hoping to find here—and what you can offer others.
            </p>
          </div>
        </div>

        {contextHints.length > 0 && (
          <div className="rounded-xl bg-primary/[0.04] border border-primary/15 px-4 py-3 text-xs leading-5 text-muted-foreground">
            <span className="font-semibold text-foreground">
              Things you already mapped that you could mention:{' '}
            </span>
            {contextHints.join(' · ')}
          </div>
        )}
      </section>

      {/* Form Inputs */}
      <div className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="introduction-title"
            className="block text-base font-medium text-foreground"
          >
            Post headline
          </label>

          <Input
            id="introduction-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Backend dev in Bengaluru exploring tools for hardware makers"
            maxLength={200}
            disabled={isSubmitting}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="introduction"
              className="text-base font-medium text-foreground"
            >
              Your introduction
            </label>

            {body.trim().length === 0 && (
              <button
                type="button"
                onClick={handleInsertOutline}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Need a starting point? Insert rough outline
              </button>
            )}
          </div>

          <SpeechTextarea
            id="introduction"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share a bit about who you are, what brought you here, and what you're hoping to get out of the Urge community..."
            rows={8}
            disabled={isSubmitting}
            className="resize-y text-base leading-7"
          />

          <p className="text-xs leading-5 text-muted-foreground">
            Tip: Tap the microphone button if it&apos;s easier to speak your
            introduction out loud. This will be published to the Urge Community
            Forum.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end border-t border-border pt-6">
        <Button
          onClick={() => void handlePublish()}
          disabled={!canPublish || isSubmitting}
          className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Publishing to forum...
            </>
          ) : (
            <>
              Publish my introduction
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}