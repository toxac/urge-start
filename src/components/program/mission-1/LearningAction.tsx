'use client';

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  ArrowRight,
  Ear,
  HandHeart,
  Loader2,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SpeechContent } from '@/components/ui/speech-content';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $progress } from '@/lib/stores/progress';

type RevealPayload = {
  synthesis?: {
    headline?: string;
    interpretation?: string;
  };
};

const ASKING_PRACTICES = [
  {
    title: 'Ask while things are still rough',
    detail:
      'You do not need a finished idea or all the answers before talking to someone. Conversations are easier and more honest when you are trying to understand, not trying to impress.',
  },
  {
    title: 'Keep the ask small and clear',
    detail:
      'People are more willing to help when they know what you are asking for. One clear question or 15 minutes around a specific topic is much easier to say yes to than a vague request.',
  },
  {
    title: 'Act before you overthink it',
    detail:
      'The longer you wait to reach out, the bigger the ask feels in your head. When you catch yourself rewriting a message to make it sound better, send the simpler version.',
  },
  {
    title: 'Follow up afterward',
    detail:
      'When someone gives you their time or perspective, let them know later what you did with it. It is a simple habit that turns a one-off conversation into a real connection.',
  },
] as const;

const PRESENCE_PRACTICES = [
  {
    title: 'Listen without waiting to talk',
    detail:
      'Pay attention to what the other person is dealing with, what frustrates them, and what they care about—without steering the conversation back to yourself.',
  },
  {
    title: 'Show up when you need nothing',
    detail:
      'Check in on people without an agenda. Reply to something they shared, pass along a useful link, or offer a second pair of eyes when someone is stuck.',
  },
  {
    title: 'Notice what people put up with',
    detail:
      'When you spend time listening in real communities and conversations, people start mentioning the everyday frustrations they tolerate. That is often where real opportunities begin.',
  },
] as const;

export function LearningAction({
  node,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reveal = (progressState.payloads['m1-q3-reveal'] ??
    {}) as RevealPayload;

  const headline =
    typeof reveal.synthesis?.headline === 'string'
      ? reveal.synthesis.headline.trim()
      : '';

  const interpretation =
    typeof reveal.synthesis?.interpretation === 'string'
      ? reveal.synthesis.interpretation.trim()
      : '';

  const readAloudText = [
    headline
      ? `What this experience showed you. ${headline}. ${interpretation}`
      : '',
    'Ways to make asking part of normal life.',
    ...ASKING_PRACTICES.map((item) => `${item.title}. ${item.detail}`),
    'It is not always about asking.',
    ...PRESENCE_PRACTICES.map((item) => `${item.title}. ${item.detail}`),
  ]
    .filter(Boolean)
    .join(' ');

  async function handleContinue() {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onComplete({
        completed: true,
      });
    } catch (err) {
      console.error('[LEARNING ACTION COMPLETE]', err);
      setError('Something went wrong while saving this. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-3xl space-y-10 pb-16 animate-in fade-in duration-300">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Carry the learning forward
        </p>

        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'Make reaching out part of how you work.'}
        </h1>

        <p className="text-lg leading-8 text-muted-foreground">
          You do not need another task from this step. What matters is how you
          relate to people from here—both when you have something to ask and
          when you do not.
        </p>
      </header>

      <SpeechContent
        textToRead={readAloudText}
        showControls="always"
        controlsPosition="top-right"
        className="space-y-10"
      >
        {headline && (
          <section className="rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-3">
            <div className="flex items-center gap-2 pr-16 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>What this experience showed you</span>
            </div>

            <h2 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
              {headline}
            </h2>

            {interpretation && (
              <p className="text-base leading-7 text-muted-foreground">
                {interpretation}
              </p>
            )}
          </section>
        )}

        <section className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Reaching out
              </span>
            </div>

            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Ways to make asking part of normal life
            </h2>

            <p className="text-base leading-7 text-muted-foreground">
              Most people treat asking as a rare, high-stakes event. It becomes
              much easier when it is a small, ordinary habit.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ASKING_PRACTICES.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-5 space-y-2"
              >
                <h3 className="font-heading text-base font-semibold leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5 border-t border-border pt-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Ear className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Being present
              </span>
            </div>

            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              It is not always about asking
            </h2>

            <p className="text-base leading-7 text-muted-foreground">
              Building relationships is not only about what you need. It also
              comes from listening, staying present, and being available to
              others.
            </p>
          </div>

          <div className="space-y-3">
            {PRESENCE_PRACTICES.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3.5 rounded-2xl border border-border bg-muted/25 p-5"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <HandHeart className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-base font-semibold leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
          <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Ask early, listen closely, and be someone others are glad to talk
            to. You do not need to force anything beyond that.
          </p>
        </section>
      </SpeechContent>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end border-t border-border pt-6">
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={isSubmitting}
          className="h-12 gap-2 rounded-full px-8 text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}