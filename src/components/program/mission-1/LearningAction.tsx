'use client';

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $progress } from '@/lib/stores/progress';
import { saveUserTasks } from '@/actions/tasks';

type OutcomeType =
  | 'decision'
  | 'commitment'
  | 'task'
  | 'nothing';

type ActionPayload = {
  outcomeType?: OutcomeType;
  outcome?: string;
  taskId?: string;
  completed?: boolean;
};

const OUTCOME_OPTIONS: {
  type: OutcomeType;
  title: string;
  description: string;
}[] = [
  {
    type: 'decision',
    title: 'I want to keep doing this.',
    description:
      'I learned something useful and want to keep approaching people instead of retreating into my own head.',
  },
  {
    type: 'commitment',
    title: 'I want to change how I approach this.',
    description:
      'I want to carry something from this experience into the next time I hesitate.',
  },
  {
    type: 'task',
    title: 'I want to make another ask.',
    description:
      'Turn what you learned into another real-world action.',
  },
  {
    type: 'nothing',
    title: 'Nothing yet.',
    description:
      'I want to let this experience sit before deciding what to do next.',
  },
];

export function LearningAction({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);

  /*
   * The reveal is the immediate source of learning for this action.
   */
  const reveal = progressState.payloads['m1-q3-reveal'] ?? {};

  const difference =
    typeof reveal.difference === 'string'
      ? reveal.difference
      : '';

  /*
   * This node's own saved outcome.
   */
  const saved = (progress.payload ?? {}) as ActionPayload;

  const [outcomeType, setOutcomeType] = useState<OutcomeType | null>(
    saved.outcomeType ?? null
  );

  const [outcome, setOutcome] = useState(
    typeof saved.outcome === 'string'
      ? saved.outcome
      : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = OUTCOME_OPTIONS.find(
    (option) => option.type === outcomeType
  );

  const requiresText =
    outcomeType === 'decision' ||
    outcomeType === 'commitment' ||
    outcomeType === 'task';

  const canContinue =
    outcomeType === 'nothing' ||
    (requiresText && outcome.trim().length > 0);

  function handleSelect(type: OutcomeType) {
    setOutcomeType(type);
    setError(null);

    if (type === 'nothing') {
      setOutcome('');
    }
  }

  async function handleComplete() {
    if (!outcomeType || !canContinue || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let taskId: string | undefined;

      /*
       * A task is only created when the founder explicitly
       * chooses the task outcome.
       */
      if (outcomeType === 'task') {
        const result = await saveUserTasks([
          {
            title: outcome.trim(),
            description:
              difference ||
              'Follow-up action from the Q3 real-world asking experiment.',
            task_type: 'practice',
            source_node_key: nodeKey,
            metadata: {
              outcome_type: 'task',
              source_experiment_node: 'm1-q3-ask',
              source_reveal_node: 'm1-q3-reveal',
            },
          },
        ]);

        taskId = result.tasks?.[0]?.id;
      }

      await onComplete({
        outcomeType,
        outcome: outcome.trim(),
        ...(taskId ? { taskId } : {}),
        completed: true,
      });
    } catch (err) {
      console.error('[LEARNING ACTION ERROR]', err);
      setError(
        'Something went wrong while saving this. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
   * Revisit state.
   */
  if (progress.completed || saved.completed === true) {
    return (
      <div className="w-full max-w-4xl space-y-10">
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You decided what to do with the experience.
          </p>
        </div>

        {difference && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you noticed
            </p>

            <p className="text-lg leading-8">
              {difference}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your outcome
          </p>

          <div className="flex items-start gap-3">
            <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />

            <div>
              <p className="text-lg font-semibold">
                {selectedOption?.title}
              </p>

              {outcome && (
                <p className="mt-2 max-w-3xl text-lg leading-8">
                  {outcome}
                </p>
              )}
            </div>
          </div>
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
          You now know what happened. The question is not what Urge
          thinks you should do. What do you want to do with what you
          learned?
        </p>
      </div>

      {difference && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What you noticed
          </p>

          <p className="text-lg leading-8">
            {difference}
          </p>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-semibold">
            What do you want to do with this?
          </h3>

          <p className="mt-2 text-muted-foreground">
            There is no right answer. Choose what feels true.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {OUTCOME_OPTIONS.map((option) => {
            const selected = outcomeType === option.type;

            return (
              <button
                key={option.type}
                type="button"
                onClick={() => handleSelect(option.type)}
                disabled={isSubmitting}
                className={[
                  'rounded-2xl border p-6 text-left transition-colors',
                  'hover:border-foreground/40',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">
                      {option.title}
                    </p>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {option.description}
                    </p>
                  </div>

                  {selected && (
                    <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {outcomeType && outcomeType !== 'nothing' && (
        <div className="max-w-3xl space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {outcomeType === 'task'
                ? 'What will you do?'
                : outcomeType === 'commitment'
                  ? 'What are you committing to?'
                  : 'What is your decision?'}
            </h3>

            <p className="text-muted-foreground">
              {outcomeType === 'task'
                ? 'Make it specific enough that you could actually do it.'
                : outcomeType === 'commitment'
                  ? 'Put the behaviour you want to carry forward into your own words.'
                  : 'State what you have decided based on the experience.'}
            </p>
          </div>

          <Textarea
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            placeholder={
              outcomeType === 'task'
                ? 'I will...'
                : outcomeType === 'commitment'
                  ? 'When I hesitate, I will...'
                  : 'I have decided to...'
            }
            className="min-h-[150px] resize-none text-lg leading-8"
            disabled={isSubmitting}
          />
        </div>
      )}

      {outcomeType === 'nothing' && (
        <div className="max-w-3xl rounded-2xl border border-border bg-card p-6">
          <p className="text-lg leading-8">
            You do not have to turn every experience into an immediate
            task. Sometimes noticing what happened is enough for now.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

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
              {outcomeType === 'nothing'
                ? 'Continue'
                : 'Lock it in'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}