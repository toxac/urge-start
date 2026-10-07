'use client';

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $progress } from '@/lib/stores/progress';

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

type RevealPayload = {
  difference?: string;
  prediction?: string;
  outcome?: string;
  reaction?: string;
  reflection?: string;
  completed?: boolean;
};

export function PredictionRealityReveal({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);

  /*
   * The previous node is the source of the experiment evidence.
   * We read it directly from the progress store rather than
   * passing its payload through the component props.
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

  const [difference, setDifference] = useState(
    typeof saved.difference === 'string'
      ? saved.difference
      : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canContinue = difference.trim().length > 0;

  async function handleComplete() {
    if (!canContinue || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onComplete({
        prediction,
        outcome,
        reaction,
        reflection,
        difference: difference.trim(),
        completed: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
   * Revisit state.
   *
   * The reveal should remain a mirror of the experience,
   * not generate a new interpretation.
   */
  if (progress.completed || saved.completed === true) {
    return (
      <div className="w-full max-w-4xl space-y-10">
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You had a prediction. You acted. Now you know what actually
            happened.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you expected
            </p>

            <p className="text-lg leading-8">
              {prediction || 'No prediction recorded.'}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What happened
            </p>

            <p className="text-lg leading-8">
              {outcome || 'No outcome recorded.'}
            </p>
          </div>
        </div>

        {reaction && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How you reacted
            </p>

            <p className="max-w-3xl text-lg leading-8">
              {reaction}
            </p>
          </div>
        )}

        {reflection && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you noticed
            </p>

            <p className="max-w-3xl text-lg leading-8">
              {reflection}
            </p>
          </div>
        )}

        <div className="border-t border-border pt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What was different?
          </p>

          <p className="max-w-3xl text-lg leading-8">
            {difference}
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => onComplete(saved)}
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-12">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Before you made the ask, you had an idea of how it would go.
          Now you have something better: what actually happened.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What did you expect?
          </p>

          <p className="text-lg leading-8">
            {prediction || 'No prediction recorded.'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What actually happened?
          </p>

          <p className="text-lg leading-8">
            {outcome || 'No outcome recorded.'}
          </p>
        </div>
      </div>

      {reaction && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            How did you react?
          </p>

          <p className="max-w-3xl text-lg leading-8">
            {reaction}
          </p>
        </div>
      )}

      {reflection && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What did you notice?
          </p>

          <p className="max-w-3xl text-lg leading-8">
            {reflection}
          </p>
        </div>
      )}

      <div className="space-y-5 border-t border-border pt-8">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            Was anything different from what you expected?
          </h3>

          <p className="text-muted-foreground">
            It could have gone better, worse, or simply differently.
            What stands out when you put your prediction beside reality?
          </p>
        </div>

        <Textarea
          value={difference}
          onChange={(event) => setDifference(event.target.value)}
          placeholder="What was different..."
          className="min-h-[160px] max-w-3xl resize-none text-lg leading-8"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex max-w-3xl justify-end">
        <Button
          onClick={handleComplete}
          disabled={!canContinue || isSubmitting}
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