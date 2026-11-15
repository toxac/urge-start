'use client';

import { useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Check, Loader2, Pencil, Sparkles } from 'lucide-react';

import {
  Confetti,
  type ConfettiRef,
} from '@/components/ui/confetti';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveCommitment } from '@/actions/commitments';
import { $progress } from '@/lib/stores/progress';
import { $userContext } from '@/lib/stores/user-context';

type ActionPayload = {
  completed?: boolean;
  commitment?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function Mission1Action({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);
  const contextState = useStore($userContext);

  const founderName =
    contextState.profile?.display_name?.trim() ||
    contextState.profile?.username?.trim() ||
    null;

  const saved = (progress.payload ?? {}) as ActionPayload;
  const [commitment, setCommitment] = useState(saved.commitment ?? '');
  const [isComplete, setIsComplete] = useState(
    saved.completed === true || progress.completed === true,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confettiRef = useRef<ConfettiRef>(null);

  // Pull brief inspiration prompts from their Q3/Q4 insights if available
  const starterPrompts = useMemo(() => {
    const payloads = progressState.payloads ?? {};
    const suggestions: string[] = [];

    const q3Reveal = isRecord(payloads['m1-q3-reveal'])
      ? payloads['m1-q3-reveal']
      : {};
    const q3Synthesis = isRecord(q3Reveal.synthesis)
      ? q3Reveal.synthesis
      : {};
    if (
      typeof q3Synthesis.headline === 'string' &&
      q3Synthesis.headline.trim()
    ) {
      suggestions.push(q3Synthesis.headline.trim());
    }

    const q4Action = isRecord(payloads['m1-q4-action'])
      ? payloads['m1-q4-action']
      : {};
    if (
      typeof q4Action.commitment === 'string' &&
      q4Action.commitment.trim()
    ) {
      suggestions.push(q4Action.commitment.trim());
    }

    return suggestions.slice(0, 2);
  }, [progressState.payloads]);

  const canCommit = commitment.trim().length > 0 && !isSubmitting;

  async function handleComplete() {
    if (!canCommit || isComplete) return;

    const statement = commitment.trim();
    setIsSubmitting(true);
    setError(null);

    try {
      await saveCommitment({
        statement,
        source_node_key: nodeKey || node.key,
      });

      await onComplete({
        completed: true,
        commitment: statement,
      });

      setIsComplete(true);
      window.setTimeout(() => {
        confettiRef.current?.fire({
          particleCount: 70,
          spread: 70,
          startVelocity: 32,
          gravity: 1,
          ticks: 180,
          origin: { x: 0.5, y: 0.45 },
        });
      }, 150);
    } catch (err) {
      console.error('[MISSION 1 ACTION]', err);
      setError('We could not save your reminder. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div className="relative flex min-h-[540px] w-full items-center justify-center overflow-hidden py-8">
        <Confetti
          ref={confettiRef}
          manualstart
          className="pointer-events-none absolute inset-0 z-0 h-full w-full"
          options={{ disableForReducedMotion: true, zIndex: 20 }}
        />

        <div className="relative z-10 w-full max-w-3xl space-y-9 text-center animate-in fade-in duration-300">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-9 w-9" />
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Mission 1 complete
            </p>
            <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              {founderName
                ? `You’re ready to look outward, ${founderName}.`
                : 'You’re ready to look outward.'}
            </h2>
            <p className="mx-auto max-w-2xl text-xl leading-9 text-muted-foreground">
              You didn’t wait until you felt ready. You looked closer, involved
              people, asked, and learned from what happened.
            </p>
          </div>

          {commitment.trim() && (
            <div className="mx-auto max-w-xl rounded-2xl border border-border bg-muted/30 p-6 text-left">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Your reminder
                </p>
                <button
                  type="button"
                  onClick={() => setIsComplete(false)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              </div>
              <p className="text-lg leading-8">{commitment}</p>
            </div>
          )}

          <div className="mx-auto max-w-2xl space-y-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Coming up · Mission 2
            </p>
            <h3 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              See What Others Miss
            </h3>
            <p className="text-lg leading-8 text-muted-foreground">
              You’ll start noticing problems, needs, and possibilities around
              you—and explore which ones might be worth pursuing. You don’t need
              the perfect idea. You need to get curious and look more closely.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              type="button"
              onClick={() =>
                onComplete({
                  completed: true,
                  commitment: commitment.trim(),
                })
              }
              className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
            >
              Continue to Mission 2
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-12 pb-16 animate-in fade-in duration-300">
      <div className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          One last step
        </p>
        <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          {node.title || 'Take this with you.'}
        </h2>
        <p className="text-lg leading-8 text-muted-foreground">
          You don’t have to become fearless or have everything figured out.
          You’ve practised looking inward, noticing what you already have,
          asking, and learning from what actually happens.
        </p>
      </div>

      <section className="space-y-5 rounded-3xl border border-border bg-muted/30 p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Your commitment
          </p>
          <h3 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            When I start overthinking or feel stuck, I want to remember…
          </h3>
          <p className="leading-7 text-muted-foreground">
            Write a reminder you can return to when doubt shows up. Keep it in
            your own words.
          </p>
        </div>

        <SpeechTextarea
          value={commitment}
          onChange={(event) => {
            setCommitment(event.target.value);
            setError(null);
          }}
          placeholder="I can take one small step before I have all the answers…"
          rows={4}
          disabled={isSubmitting}
          className="resize-y bg-background text-base leading-7"
        />

        {commitment.trim().length === 0 && starterPrompts.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Draw from what you uncovered earlier:
            </p>
            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((promptText) => (
                <button
                  key={promptText}
                  type="button"
                  onClick={() => setCommitment(promptText)}
                  className="rounded-full border border-border bg-background px-3.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  “{promptText}”
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="space-y-5 rounded-3xl bg-muted/50 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Next · Mission 2
        </p>
        <h3 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          See What Others Miss
        </h3>
        <p className="text-lg leading-8 text-muted-foreground">
          You’ll look for problems, needs, and possibilities that others might
          overlook. Instead of trying to invent the perfect idea, you’ll learn
          to notice opportunities in the world around you and choose one worth
          exploring.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => void handleComplete()}
          disabled={!canCommit}
          className="h-14 gap-2 rounded-full px-9 text-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Commit &amp; Continue
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}