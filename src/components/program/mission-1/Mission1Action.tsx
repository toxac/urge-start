'use client';

import { useRef, useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

import {
  Confetti,
  type ConfettiRef,
} from '@/components/ui/confetti';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type ActionPayload = {
  completed?: boolean;
};

export function Mission1Action({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const saved = (progress.payload ?? {}) as ActionPayload;

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
      });

      /*
       * The mission is now actually complete.
       * Celebrate only after the completion has been saved.
       */
      setIsComplete(true);

      window.setTimeout(() => {
        confettiRef.current?.fire({
          particleCount: 70,
          spread: 70,
          startVelocity: 32,
          gravity: 1,
          ticks: 180,
          origin: {
            x: 0.5,
            y: 0.45,
          },
        });
      }, 150);
    } catch (error) {
      console.error('[MISSION 1 ACTION]', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
   * Completion state.
   *
   * This is intentionally different from a normal node completion.
   * The founder should feel that they have crossed a meaningful boundary.
   */
  if (isComplete) {
    return (
      <div className="relative flex min-h-[520px] w-full items-center justify-center overflow-hidden">
        <Confetti
          ref={confettiRef}
          manualstart
          className="pointer-events-none absolute inset-0 z-0 h-full w-full"
          options={{
            disableForReducedMotion: true,
            zIndex: 20,
          }}
        />

        <div className="relative z-10 w-full max-w-3xl space-y-10 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-9 w-9" />
          </div>

          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Mission 1 complete
            </p>

            <h2 className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl">
              You moved.
            </h2>

            <p className="mx-auto max-w-2xl text-xl leading-9 text-muted-foreground">
              You didn't wait until you felt ready.
              You looked closer, involved people, asked,
              and found out what actually happened.
            </p>
          </div>

          <div className="mx-auto max-w-xl border-y border-border py-8">
            <p className="text-lg leading-8">
              You now have something more useful than certainty:
              <span className="font-semibold">
                {' '}evidence that you can move before you have all the answers.
              </span>
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => onComplete(saved)}
              className="h-12 gap-2 rounded-full px-8 text-base"
            >
              Continue to Mission 2
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Final confirmation before completing the mission.
   *
   * This should feel like a threshold, not another exercise.
   */
  return (
    <div className="relative w-full max-w-3xl space-y-12">
      <div className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          One last step
        </p>

        <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Ready to move on?
        </h2>

        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
          Mission 1 was not about becoming fearless or having
          everything figured out.
        </p>

        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
          It was about learning that you can move, find out what
          happens, and decide what to do next.
        </p>
      </div>

      <div className="rounded-3xl bg-muted/50 p-8 sm:p-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <Threshold
            number="01"
            title="Look"
            text="You examined what was getting in the way."
          />

          <Threshold
            number="02"
            title="Ask"
            text="You involved people and tested your assumptions."
          />

          <Threshold
            number="03"
            title="Find out"
            text="You learned from what actually happened."
          />
        </div>
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
              Completing...
            </>
          ) : (
            <>
              Complete Mission 1
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Threshold({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
        {number}
      </p>

      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      <p className="leading-7 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}