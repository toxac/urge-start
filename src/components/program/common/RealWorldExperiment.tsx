'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveObservation } from '@/actions/observations';

type ExperimentStage =
  | 'prepare'
  | 'predict'
  | 'go'
  | 'return'
  | 'complete';

type ExperimentPayload = {
  target: string;
  intention: string;
  why: string;
  prediction: string;
  actionTaken: string;
  outcome: string;
  reaction: string;
  reflection: string;
  completed: boolean;
};

export function RealWorldExperiment({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const saved = progress.payload ?? {};

  const [stage, setStage] = useState<ExperimentStage>(
    saved.completed === true ? 'complete' : 'prepare'
  );

  const [target, setTarget] = useState(
    typeof saved.target === 'string' ? saved.target : ''
  );

  const [intention, setIntention] = useState(
    typeof saved.intention === 'string' ? saved.intention : ''
  );

  const [why, setWhy] = useState(
    typeof saved.why === 'string' ? saved.why : ''
  );

  const [prediction, setPrediction] = useState(
    typeof saved.prediction === 'string' ? saved.prediction : ''
  );

  const [actionTaken, setActionTaken] = useState(
    typeof saved.actionTaken === 'string' ? saved.actionTaken : ''
  );

  const [outcome, setOutcome] = useState(
    typeof saved.outcome === 'string' ? saved.outcome : ''
  );

  const [reaction, setReaction] = useState(
    typeof saved.reaction === 'string' ? saved.reaction : ''
  );

  const [reflection, setReflection] = useState(
    typeof saved.reflection === 'string' ? saved.reflection : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPrepare =
    target.trim().length > 0 &&
    intention.trim().length > 0 &&
    why.trim().length > 0;

  const canPredict = prediction.trim().length > 0;

  const canReflect =
    actionTaken.trim().length > 0 &&
    outcome.trim().length > 0 &&
    reaction.trim().length > 0 &&
    reflection.trim().length > 0;

  async function handleComplete() {
    if (!canReflect || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const payload: ExperimentPayload = {
      target: target.trim(),
      intention: intention.trim(),
      why: why.trim(),
      prediction: prediction.trim(),
      actionTaken: actionTaken.trim(),
      outcome: outcome.trim(),
      reaction: reaction.trim(),
      reflection: reflection.trim(),
      completed: true,
    };

    try {
      await saveObservation({
        title: 'Real-world asking experiment',
        content: payload.reflection,
        context: [
          `Who I approached: ${payload.target}`,
          `What I asked for: ${payload.intention}`,
          `Why I chose them: ${payload.why}`,
          `What I predicted: ${payload.prediction}`,
          `What I did: ${payload.actionTaken}`,
          `What happened: ${payload.outcome}`,
          `How I reacted: ${payload.reaction}`,
        ].join('\n\n'),
        type: 'experiment',
        domain: 'personal',
        focus: 'asking',
        source_node_key: nodeKey,
      });

      await onComplete(payload);
      setStage('complete');
    } catch (err) {
      console.error('[REAL WORLD EXPERIMENT]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your experiment.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (stage === 'complete') {
    return (
      <div className="w-full space-y-10">
        <div className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF502F]/10">
            <Check className="h-6 w-6 text-[#FF502F]" />
          </div>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            You did it.
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You went out, made the ask, and came back with something real.
          </p>
        </div>

        <div className="space-y-8 border-t border-border pt-8">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              What you expected
            </p>
            <p className="text-lg leading-8">
              {prediction}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              What actually happened
            </p>
            <p className="text-lg leading-8">
              {outcome}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              What you noticed
            </p>
            <p className="text-lg leading-8">
              {reflection}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() =>
            onComplete({
              target,
              intention,
              why,
              prediction,
              actionTaken,
              outcome,
              reaction,
              reflection,
              completed: true,
            })
          }
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (stage === 'prepare') {
    return (
      <div className="w-full space-y-10">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-[#FF502F]">
            Real World Experiment
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            {node.description}
          </p>
        </div>

        <div className="space-y-8 border-t border-border pt-8">
          <div className="space-y-3">
            <label className="text-base font-medium">
              Who could you make a real ask of today?
            </label>

            <Textarea
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="Someone you can realistically reach..."
              className="min-h-[100px] text-base"
            />
          </div>

          <div className="space-y-3">
            <label className="text-base font-medium">
              What are you going to ask them for?
            </label>

            <Textarea
              value={intention}
              onChange={(event) => setIntention(event.target.value)}
              placeholder="Be specific about what you are asking for..."
              className="min-h-[120px] text-base"
            />
          </div>

          <div className="space-y-3">
            <label className="text-base font-medium">
              Why does this person make sense for this ask?
            </label>

            <Textarea
              value={why}
              onChange={(event) => setWhy(event.target.value)}
              placeholder="What makes them a sensible person to approach?"
              className="min-h-[100px] text-base"
            />
          </div>
        </div>

        <Button
          type="button"
          disabled={!canPrepare}
          onClick={() => setStage('predict')}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (stage === 'predict') {
    return (
      <div className="w-full space-y-10">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-[#FF502F]">
            Before you go
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            What do you expect will happen?
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            There is no right answer. We want your honest prediction so you
            can compare it with what actually happens.
          </p>
        </div>

        <div className="rounded-2xl border bg-muted/20 p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Your ask
          </p>

          <p className="mt-3 text-lg leading-8">
            {intention}
          </p>
        </div>

        <Textarea
          value={prediction}
          onChange={(event) => setPrediction(event.target.value)}
          placeholder="I think they will..."
          className="min-h-[160px] text-base"
        />

        <Button
          type="button"
          disabled={!canPredict}
          onClick={() => setStage('go')}
        >
          I'm ready
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (stage === 'go') {
    return (
      <div className="w-full space-y-10">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-[#FF502F]">
            Your experiment
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Now go make the ask.
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            Close Urge. Find the person. Make the ask. Do not try to control
            the answer. Pay attention to what actually happens.
          </p>
        </div>

        <div className="space-y-6 rounded-2xl border p-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Who
            </p>
            <p className="mt-2 text-lg">{target}</p>
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              What you are asking
            </p>
            <p className="mt-2 text-lg">{intention}</p>
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              What you expect
            </p>
            <p className="mt-2 text-lg">{prediction}</p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setStage('return')}
        >
          I'm back
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-[#FF502F]">
          You are back
        </p>

        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          What actually happened?
        </h2>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Start with what happened. You can make sense of it after you have
          described it.
        </p>
      </div>

      <div className="space-y-8 border-t border-border pt-8">
        <div className="space-y-3">
          <label className="text-base font-medium">
            What did you actually do?
          </label>

          <Textarea
            value={actionTaken}
            onChange={(event) => setActionTaken(event.target.value)}
            placeholder="What did you say or do?"
            className="min-h-[120px] text-base"
          />
        </div>

        <div className="space-y-3">
          <label className="text-base font-medium">
            What happened?
          </label>

          <Textarea
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            placeholder="What did they say or do?"
            className="min-h-[140px] text-base"
          />
        </div>

        <div className="space-y-3">
          <label className="text-base font-medium">
            How did you react?
          </label>

          <Textarea
            value={reaction}
            onChange={(event) => setReaction(event.target.value)}
            placeholder="What happened inside you when you got their response?"
            className="min-h-[120px] text-base"
          />
        </div>

        <div className="space-y-3">
          <label className="text-base font-medium">
            What did you notice, especially compared with what you expected?
          </label>

          <Textarea
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            placeholder="What stands out to you now?"
            className="min-h-[160px] text-base"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="button"
        disabled={!canReflect || isSubmitting}
        onClick={handleComplete}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            Save what I learned
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}