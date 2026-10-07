'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Loader2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

import { $userContext } from '@/lib/stores/user-context';
import { generateCommitmentSynthesis } from '@/actions/responses/mission1';

type Barrier = {
  id: string;
  title: string;
  reflection: string;
};

type Motivation = {
  id: string;
  title: string;
  reflection: string;
};

type QuitCondition = {
  id: string;
  title: string;
  reflection: string;
};
type MotivationsContext = {
  motivations: Motivation[];
};

type BarriersContext = {
  barriers: Barrier[];
};

type DesiredFutureContext = {
  reflection: string;
};

type QuitConditionsContext = {
  conditions: QuitCondition[];
};

type Synthesis = {
  headline: string;
  interpretation: string;
  confirmed: boolean;
};

type CommitmentSynthesisPayload = {
  synthesis?: Synthesis;
  completed?: boolean;
};

export function CommitmentSynthesis({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const rawContext = useStore($userContext);
  const context = rawContext.userContext;
  const hasGeneratedRef = useRef(false);

  const saved = (progress.payload ?? {}) as CommitmentSynthesisPayload;

  const savedSynthesis = saved.synthesis &&
    typeof saved.synthesis === 'object'
    ? saved.synthesis
    : null;

  const situation = typeof context?.start_drive === 'string'
    ? context.start_drive
    : '';

  const barriersContext = context?.perceived_barriers as BarriersContext | null | undefined;
  const motivationsContext = context?.motivations as MotivationsContext | null | undefined;
  const futureContext = context?.desired_future as DesiredFutureContext | null | undefined;
  const quitConditionsContext = context?.quit_conditions as QuitConditionsContext | null | undefined;

  const barriers: Barrier[] = Array.isArray(
    barriersContext?.barriers
  )
    ? barriersContext.barriers
    : [];

  const motivations: Motivation[] = Array.isArray(
    motivationsContext?.motivations
  )
    ? motivationsContext.motivations
    : [];

  const future =
    typeof futureContext?.reflection === 'string'
      ? futureContext.reflection
      : '';

  const quitConditions: QuitCondition[] = Array.isArray(
    quitConditionsContext?.conditions
  )
    ? quitConditionsContext.conditions
    : [];

  const [headline, setHeadline] = useState(savedSynthesis?.headline ?? '');

  const [interpretation, setInterpretation] = useState(
    savedSynthesis?.interpretation ?? ''
  );

  const [confirmed, setConfirmed] = useState(savedSynthesis?.confirmed ?? false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'generating' | 'review'>(
    savedSynthesis ? 'review' : 'generating'
  );

  const [error, setError] = useState<string | null>(null);

  const canContinue =
    headline.trim().length >= 3 &&
    interpretation.trim().length >= 10 &&
    confirmed;

  useEffect(() => {
    if (savedSynthesis) {
      setHeadline(savedSynthesis.headline ?? '');
      setInterpretation(savedSynthesis.interpretation ?? '');
      setConfirmed(savedSynthesis.confirmed ?? false);
      setMode('review');
    }
  }, [savedSynthesis]);

  useEffect(() => {
    if (savedSynthesis) {
      return;
    }

    if (!rawContext.isHydrated) {
      return;
    }

    if (hasGeneratedRef.current) {
      return;
    }

    hasGeneratedRef.current = true;
    setIsGenerating(true);
    setError(null);

    async function generate() {
      try {
        const result = await generateCommitmentSynthesis(
          {
            situation,
            barriers,
            motivations,
            future,
            quitConditions,
          },
          nodeKey
        );

        setHeadline(result.headline);
        setInterpretation(result.interpretation);
        setConfirmed(false);
        setMode('review');
      } catch (err) {
        console.error('[COMMITMENT SYNTHESIS]', err);

        hasGeneratedRef.current = false;

        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong creating the reflection.'
        );
      } finally {
        setIsGenerating(false);
      }
    }

    generate();
  }, [
    rawContext.isHydrated,
    savedSynthesis,
    nodeKey,
  ]);

  function handleConfirm() { setConfirmed(true); }

  function handleEdit() { setConfirmed(false); }

  async function handleSubmit() {
    if (!canContinue || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const synthesis: Synthesis = {
        headline: headline.trim(),
        interpretation: interpretation.trim(),
        confirmed: true,
      };

      await onComplete({
        synthesis,
        completed: true,
      });
    } catch (err) {
      console.error(
        '[COMMITMENT SYNTHESIS COMPLETE]',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your reflection.'
      );

      setIsSubmitting(false);
    }
  }

  if (mode === 'generating') {
    return (
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            WHAT WE NOTICE
          </p>

          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Looking across what you told us.
          </h2>

          <p className="text-lg leading-8 text-muted-foreground">
            You explored different parts of your journey. Now we are
            looking at them together to see whether there is a connection
            you may not have noticed yet.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Taking a closer look...</span>
        </div>

        {error && (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-destructive">
              {error}
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setError(null);
                setMode('generating');
                setIsGenerating(false);
              }}
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-10">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
          WHAT WE NOTICE
        </p>

        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'Look at what is actually driving you.'}
        </h2>

        <p className="text-lg leading-8 text-muted-foreground">
          You answered each question separately. Looking at them together
          reveals something different.
        </p>
      </div>

      <div className="rounded-2xl border bg-muted/20 p-6 sm:p-8">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              THE CONNECTION WE SEE
            </p>

            <h3 className="mt-3 text-2xl font-semibold leading-9">
              {headline}
            </h3>
          </div>

          <div className="border-t border-border pt-6">
            <p className="text-lg leading-8 text-foreground">
              {interpretation}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-4 border-t border-border pt-8">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
          WHY THIS JOURNEY STARTS HERE
        </p>

        <p className="text-lg leading-8 text-foreground">
          You made the right choice by starting this journey.
        </p>

        <p className="text-lg leading-8 text-muted-foreground">
          Starting a business is about more than money, numbers, or sales.
          Those things matter, but they come later. First, you need to be
          ready to act, learn from what happens, deal with uncertainty, and
          keep moving when things don't go as planned.
        </p>

        <p className="text-lg leading-8 text-muted-foreground">
          That's what we're working on here.{' '}
          <strong className="font-semibold text-foreground">
            Before we build the business, we're building your capacity to start.
          </strong>
        </p>
      </div>

      {!confirmed ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              Does this feel true to you?
            </h3>

            <p className="text-base leading-7 text-muted-foreground">
              This is an interpretation of what you told us, not a verdict.
              You are the person who gets to decide whether it fits.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={handleConfirm}
              className="gap-2"
            >
              Yes, that feels right
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleEdit}
            >
              Not quite — let me change it
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-dashed p-6">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              YOUR TAKE
            </p>

            <p className="mt-3 text-base leading-7 text-foreground">
              You confirmed that this reflection feels true to your
              experience.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleEdit}
              disabled={isSubmitting}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Reconsider
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canContinue || isSubmitting}
              className="gap-2"
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
      )}

      {error && (
        <p className="text-sm leading-6 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}