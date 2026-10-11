
'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $progress } from '@/lib/stores/progress';
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
};

type ReflectionRecord = {
  title: string;
  content: string;
  source_node_key?: string | null;
};

type FrictionSynthesis = {
  headline: string;
  interpretation: string;
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

  // The experiment's structured answers are stored in the previous node.
  const experiment = (
    progressState.payloads['m1-q3-ask'] ?? {}
  ) as ExperimentPayload;

  // This reveal node stores its own generated synthesis.
  const saved = (progress.payload ?? {}) as RevealPayload;
  const savedSynthesis = saved.synthesis ?? null;

  const prediction = experiment.prediction ?? '';
  const actionTaken = experiment.actionTaken ?? '';
  const outcome = experiment.outcome ?? '';
  const reaction = experiment.reaction ?? '';

  const [reflection, setReflection] = useState('');

  const [headline, setHeadline] = useState(
    savedSynthesis?.headline ?? '',
  );

  const [interpretation, setInterpretation] = useState(
    savedSynthesis?.interpretation ?? '',
  );

  const [isGenerating, setIsGenerating] = useState(
    !savedSynthesis,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (savedSynthesis) {
      setIsGenerating(false);
      return;
    }

    let cancelled = false;

    async function generate() {
      setIsGenerating(true);
      setError(null);

      try {
        const observations = await getQuest3Reflections();

        const experimentReflection = observations.find(
          (item: ReflectionRecord) =>
            item.source_node_key === 'm1-q3-ask',
        );

        const finalReflection =
          experimentReflection?.content?.trim() ?? '';

        if (!finalReflection) {
          throw new Error(
            'Your final reflection could not be found. Please return to the previous step and save your reflection again.',
          );
        }

        if (
          !prediction.trim() ||
          !actionTaken.trim() ||
          !outcome.trim() ||
          !reaction.trim()
        ) {
          throw new Error(
            'Some experiment answers are missing. Please check that the previous step has been saved.',
          );
        }

        const evidence = [
          {
            title: 'What I expected',
            content: prediction,
          },
          {
            title: 'Who I approached and what I asked for',
            content: [
              experiment.target
                ? `Who I approached: ${experiment.target}`
                : '',
              experiment.intention
                ? `What I asked for: ${experiment.intention}`
                : '',
              experiment.why
                ? `Why I chose this person: ${experiment.why}`
                : '',
            ]
              .filter(Boolean)
              .join('\n'),
          },
          {
            title: 'What I actually did',
            content: actionTaken,
          },
          {
            title: 'What happened',
            content: outcome,
          },
          {
            title: 'How I reacted',
            content: reaction,
          },
          {
            title: 'What I noticed',
            content: finalReflection,
          },
        ].filter((item) => item.content.trim());

        const result = await generateFrictionSynthesis(
          evidence,
          nodeKey,
        );

        if (cancelled) return;

        if (
          !result?.headline?.trim() ||
          !result?.interpretation?.trim()
        ) {
          throw new Error(
            'The AI returned an incomplete reflection.',
          );
        }

        setReflection(finalReflection);
        setHeadline(result.headline.trim());
        setInterpretation(result.interpretation.trim());
      } catch (err) {
        if (cancelled) return;

        console.error('[PREDICTION REALITY REVEAL]', err);

        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while generating your reflection.',
        );
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
        }
      }
    }

    void generate();

    return () => {
      cancelled = true;
    };
  }, [
    savedSynthesis,
    nodeKey,
    retryCount,
    prediction,
    actionTaken,
    outcome,
    reaction,
    experiment.target,
    experiment.intention,
    experiment.why,
  ]);

  function handleRetry() {
    setError(null);
    setHeadline('');
    setInterpretation('');
    setReflection('');
    setIsGenerating(true);
    setRetryCount((count) => count + 1);
  }

  async function handleContinue() {
    if (
      !headline.trim() ||
      !interpretation.trim() ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onComplete({
        synthesis: {
          headline,
          interpretation,
        },
        completed: true,
      });
    } catch (err) {
      console.error(
        '[PREDICTION REALITY REVEAL SAVE]',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'We could not save your progress. Please try again.',
      );
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
            You had a prediction. You acted. Now we are looking
            across what happened to see what the experience itself
            tells you.
          </p>
        </div>

        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Looking for the interesting part...</span>
        </div>
      </div>
    );
  }

  if (error && !headline && !interpretation) {
    return (
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            SOMETHING WENT WRONG
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            We could not complete the reflection.
          </h2>

          <p className="text-muted-foreground">{error}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleRetry}
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

              <p className="text-lg leading-8">{reaction}</p>
            </div>
          )}

          {reflection && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                WHAT YOU NOTICED
              </p>

              <p className="text-lg leading-8">{reflection}</p>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border pt-10">
        <div className="max-w-3xl space-y-6">
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

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end border-t border-border pt-8">
        <Button
          type="button"
          onClick={handleContinue}
          disabled={
            !headline.trim() ||
            !interpretation.trim() ||
            isSubmitting
          }
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
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
