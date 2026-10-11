'use client';

import { useRef, useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

import {
  Confetti,
  type ConfettiRef,
} from '@/components/ui/confetti';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type ActionPayload = {
  completed?: boolean;
  commitment?: string;
};

export function Mission1Action({ progress, onComplete }: NodeComponentProps) {
  const saved = (progress.payload ?? {}) as ActionPayload;
  const [commitment, setCommitment] = useState(saved.commitment ?? '');
  const [isComplete, setIsComplete] = useState(
    saved.completed === true || progress.completed === true,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confettiRef = useRef<ConfettiRef>(null);

  async function handleComplete() {
    if (isSubmitting || isComplete) return;

    setIsSubmitting(true);
    try {
      await onComplete({
        completed: true,
        commitment: commitment.trim(),
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
    } catch (error) {
      console.error('[MISSION 1 ACTION]', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div className="relative flex min-h-[520px] w-full items-center justify-center overflow-hidden">
        <Confetti
          ref={confettiRef}
          manualstart
          className="pointer-events-none absolute inset-0 z-0 h-full w-full"
          options={{ disableForReducedMotion: true, zIndex: 20 }}
        />

        <div className="relative z-10 w-full max-w-3xl space-y-9 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-9 w-9" />
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Mission 1 complete
            </p>
            <h2 className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl">
              You moved.
            </h2>
            <p className="mx-auto max-w-2xl text-xl leading-9 text-muted-foreground">
              You didn’t wait until you felt ready. You looked closer, involved people, asked, and learned from what happened.
            </p>
          </div>

          {commitment.trim() && (
            <div className="mx-auto max-w-xl rounded-2xl border border-border bg-muted/30 p-6 text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Your reminder
              </p>
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
              You’ll start noticing problems, needs, and possibilities around you—and explore which ones might be worth pursuing. You don’t need the perfect idea. You need to get curious and look more closely.
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-12">
      <div className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          One last step
        </p>
        <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Take this with you.
        </h2>
        <p className="text-lg leading-8 text-muted-foreground">
          You don’t have to become fearless or have everything figured out. You’ve practised looking inward, noticing what you already have, asking, and learning from what actually happens.
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
            Write a reminder you can return to when doubt shows up. Keep it in your own words.
          </p>
        </div>
        <Textarea
          value={commitment}
          onChange={(event) => setCommitment(event.target.value)}
          placeholder="I can take one small step before I have all the answers…"
          rows={4}
          className="resize-y bg-background text-base leading-7"
        />
      </section>

      <div className="space-y-5 rounded-3xl bg-muted/50 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Next · Mission 2
        </p>
        <h3 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          See What Others Miss
        </h3>
        <p className="text-lg leading-8 text-muted-foreground">
          You’ll look for problems, needs, and possibilities that others might overlook. Instead of trying to invent the perfect idea, you’ll learn to notice opportunities in the world around you and choose one worth exploring.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleComplete}
          disabled={isSubmitting}
          className="h-14 gap-2 rounded-full px-9 text-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Commit & Continue
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
