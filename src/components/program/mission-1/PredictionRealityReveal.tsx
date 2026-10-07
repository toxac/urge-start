'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $progress } from '@/lib/stores/progress';
import { useStore } from '@nanostores/react';
import {
  getQuest3Reflections,
  generateFrictionSynthesis,
} from '@/actions/responses/mission1';

type ExperimentPayload = {
  target?: string;
  intention?: string;
  why?: string;
  prediction?: string;
  actionTaken?: string;
  outcome?: string;
  reaction?: string;
  reflection?: string;
};

type FrictionSynthesis = {
  headline: string;
  interpretation: string;
  confirmed?: boolean;
};

type RevealPayload = {
  synthesis?: FrictionSynthesis;
  completed?: boolean;
};

export function PredictionRealityReveal({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);

  /*
   * The experiment evidence lives on the previous node.
   */
  const experiment =
    (progressState.payloads['m1-q3-ask'] ?? {}) as ExperimentPayload;

  /*
   * This node's own saved progress.
   */
  const saved = (progress.payload ?? {}) as RevealPayload;

  const prediction =
    typeof experiment.prediction === 'string'
      ? experiment.prediction
      : '';

  const outcome =
    typeof experiment.outcome === 'string'
      ? experiment.outcome
      : '';

  const reaction =
    typeof experiment.reaction === 'string'
      ? experiment.reaction
      : '';

  const reflection =
    typeof experiment.reflection === 'string'
      ? experiment.reflection
      : '';

  const savedSynthesis =
    saved.synthesis &&
    typeof saved.synthesis === 'object'
      ? saved.synthesis
      : null;

  const [headline, setHeadline] = useState(
    savedSynthesis?.headline ?? ''
  );

  const [interpretation, setInterpretation] = useState(
    savedSynthesis?.interpretation ?? ''
  );

  const [confirmed, setConfirmed] = useState(
    savedSynthesis?.confirmed === true
  );

  const [isGenerating, setIsGenerating] = useState(
    !savedSynthesis
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    if (savedSynthesis) return;
    if (hasGeneratedRef.current) return;

    hasGeneratedRef.current = true;
    setIsGenerating(true);
    setError(null);

    async function generate() {
      try {
        const reflections = await getQuest3Reflections();

        if (reflections.length === 0) {
          throw new Error(
            'No reflections were found for this experiment.'
          );
        }

        const result = await generateFrictionSynthesis(
          reflections,
          nodeKey
        );

        setHeadline(result.headline);
        setInterpretation(result.interpretation);
        setConfirmed(false);
      } catch (err) {
        console.error('[PREDICTION REALITY REVEAL]', err);

        hasGeneratedRef.current = false;

        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while looking at your experience.'
        );
      } finally {
        setIsGenerating(false);
      }
    }

    generate();
  }, [savedSynthesis, nodeKey]);

  async function handleConfirm() {
    if (!headline || !interpretation || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onComplete({
        synthesis: {
          headline,
          interpretation,
          confirmed: true,
        },
        completed: true,
      });

      setConfirmed(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isGenerating) {
    return (
      <div className="w-full max-w-4xl space-y-10">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            LOOKING AT WHAT HAPPENED
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You had a prediction. You acted. Now we are looking across
            what happened to see what the experience itself tells you.
          </p>
        </div>

        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Looking for the interesting part...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            SOMETHING WENT WRONG
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            We could not complete the reflection.
          </h2>

          <p className="text-muted-foreground">
            {error}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            hasGeneratedRef.current = false;
            setError(null);
            setIsGenerating(true);

            // Force the effect to run again by clearing the local state.
            setHeadline('');
            setInterpretation('');
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-12">
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">
          WHAT WE NOTICE
        </p>

        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          You had a prediction. You acted. Now you have something
          better than a prediction: evidence.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            WHAT YOU EXPECTED
          </p>

          <p className="text-lg leading-8">
            {prediction || 'No prediction recorded.'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            WHAT ACTUALLY HAPPENED
          </p>

          <p className="text-lg leading-8">
            {outcome || 'No outcome recorded.'}
          </p>
        </div>
      </div>

      {(reaction || reflection) && (
        <div className="grid gap-6 md:grid-cols-2">
          {reaction && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                HOW YOU REACTED
              </p>

              <p className="text-lg leading-8">
                {reaction}
              </p>
            </div>
          )}

          {reflection && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                WHAT YOU NOTICED
              </p>

              <p className="text-lg leading-8">
                {reflection}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border pt-10">
        <div className="space-y-6 max-w-3xl">
          <p className="text-sm font-medium text-muted-foreground">
            THE CONNECTION WE SEE
          </p>

          <h3 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {headline}
          </h3>

          <p className="text-lg leading-8 text-foreground">
            {interpretation}
          </p>
        </div>
      </div>

      {!confirmed ? (
        <div className="border-t border-border pt-8 space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              Does this feel true to you?
            </h3>

            <p className="text-muted-foreground">
              This is an interpretation of what happened, not a
              conclusion about you. You decide whether it fits.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="h-12 gap-2 rounded-full px-7 text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Yes, that feels right
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setConfirmed(true);
              }}
              disabled={isSubmitting}
              className="h-12 rounded-full px-7 text-base"
            >
              Not quite
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end border-t border-border pt-8">
          <Button
            onClick={() =>
              onComplete({
                synthesis: {
                  headline,
                  interpretation,
                  confirmed: true,
                },
                completed: true,
              })
            }
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}