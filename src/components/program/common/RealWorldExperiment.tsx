'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveObservation } from '@/actions/observations';
import { useStore } from '@nanostores/react';
import { $progress } from '@/lib/stores/progress';

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

const WARMUP_OPTIONS = [
  {
    id: 'small_discount',
    title: 'Ask for a small discount',
    description:
      'Ask for a small discount on something you are buying, simply because you can ask.',
  },
  {
    id: 'small_favor',
    title: 'Ask for a small favor',
    description:
      'Ask someone for a small favor that they could easily say no to.',
  },
  {
    id: 'small_request',
    title: 'Make a harmless request',
    description:
      'Ask for something unusual but harmless where “no” is a perfectly acceptable answer.',
  },
];

export function RealWorldExperiment({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);

  const saved = (progress.payload ?? {}) as Partial<ExperimentPayload>;

  const isWarmup = nodeKey === 'm1-q4-warmup';
  const isStretch = nodeKey === 'm1-q4-stretch';

  const fear = progressState.payloads['m1-q4-setup'] ?? {};

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

  function selectWarmup(id: string) {
    const option = WARMUP_OPTIONS.find((item) => item.id === id);

    if (!option) return;

    setTarget('A person I can approach safely');
    setIntention(option.title);
    setWhy(option.description);
  }

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
        title: isWarmup
          ? 'Q4 warmup asking experiment'
          : isStretch
            ? 'Q4 stretch asking experiment'
            : 'Real-world asking experiment',
        content: payload.reflection,
        context: [
          `Who I approached: ${payload.target}`,
          `What I asked for: ${payload.intention}`,
          `Why I chose this: ${payload.why}`,
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
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (saved.completed === true || progress.completed) {
    return (
      <div className="w-full max-w-4xl space-y-10">
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You did it. Now you have an experience instead of a prediction.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you expected
            </p>

            <p className="text-lg leading-8">
              {prediction}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What happened
            </p>

            <p className="text-lg leading-8">
              {outcome}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What you noticed
          </p>

          <p className="text-lg leading-8">
            {reflection}
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
          {isWarmup
            ? 'Before we go after the scary one, make a small ask. The goal is not getting a yes. The goal is experiencing that a no is possible and survivable.'
            : isStretch
              ? 'Now make the ask you actually want to avoid. Pick something that matters to you, but that you can safely try.'
              : 'Choose something real, make the ask, and come back to tell us what happened.'}
        </p>
      </div>

      {isWarmup && stage === 'prepare' && (
        <div className="grid gap-4 md:grid-cols-3">
          {WARMUP_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => selectWarmup(option.id)}
              className="rounded-2xl border border-border bg-card p-6 text-left transition-colors hover:border-foreground/40"
            >
              <h3 className="text-lg font-semibold">
                {option.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      )}

      {stage === 'prepare' && (
        <div className="max-w-3xl space-y-6">
          {!isWarmup && isStretch && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What you told us
              </p>

              <p className="text-lg leading-8">
                You are afraid that{' '}
                <strong>
                  {fear.fearedOutcome || 'something will go wrong'}
                </strong>
                .
              </p>

              {fear.meaning && (
                <p className="mt-4 text-lg leading-8">
                  If that happened, it would mean{' '}
                  <strong>{fear.meaning}</strong>.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Who are you going to approach?
            </label>

            <Textarea
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="Who..."
              className="min-h-[100px] resize-none text-lg"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              What are you going to ask for?
            </label>

            <Textarea
              value={intention}
              onChange={(event) => setIntention(event.target.value)}
              placeholder="I am going to ask..."
              className="min-h-[100px] resize-none text-lg"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Why this person?
            </label>

            <Textarea
              value={why}
              onChange={(event) => setWhy(event.target.value)}
              placeholder="I chose them because..."
              className="min-h-[100px] resize-none text-lg"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setStage('predict')}
              disabled={!canPrepare || isSubmitting}
              className="h-12 gap-2 rounded-full px-8"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {stage === 'predict' && (
        <div className="max-w-3xl space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              You are asking:
            </p>

            <p className="mt-2 text-xl leading-8">
              {intention}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">
              What do you think will happen?
            </h3>

            <p className="text-muted-foreground">
              Make a prediction before reality gets a vote.
            </p>

            <Textarea
              value={prediction}
              onChange={(event) => setPrediction(event.target.value)}
              placeholder="I think..."
              className="min-h-[160px] resize-none text-lg leading-8"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setStage('go')}
              disabled={!canPredict || isSubmitting}
              className="h-12 gap-2 rounded-full px-8"
            >
              I'm ready
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {stage === 'go' && (
        <div className="max-w-3xl space-y-8">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Now go do it.
            </p>

            <p className="mt-4 text-2xl leading-10">
              Ask <strong>{target}</strong> for{' '}
              <strong>{intention}</strong>.
            </p>

            <p className="mt-6 text-muted-foreground">
              You already made your prediction. You do not need to
              control what happens next.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setStage('return')}
              className="h-12 gap-2 rounded-full px-8"
            >
              I'm back
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {stage === 'return' && (
        <div className="max-w-3xl space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              What did you actually do?
            </h3>

            <Textarea
              value={actionTaken}
              onChange={(event) => setActionTaken(event.target.value)}
              placeholder="I..."
              className="min-h-[100px] resize-none text-lg"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              What happened?
            </h3>

            <Textarea
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              placeholder="They..."
              className="min-h-[120px] resize-none text-lg"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              How did you react?
            </h3>

            <Textarea
              value={reaction}
              onChange={(event) => setReaction(event.target.value)}
              placeholder="I felt..."
              className="min-h-[120px] resize-none text-lg"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              What did you notice?
            </h3>

            <Textarea
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              placeholder="What stands out..."
              className="min-h-[160px] resize-none text-lg leading-8"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleComplete}
              disabled={!canReflect || isSubmitting}
              className="h-12 gap-2 rounded-full px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save what happened
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}