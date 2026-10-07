'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $progress } from '@/lib/stores/progress';
import { saveUserTasks } from '@/actions/tasks';
import {
  generateLearningActions,
  getQuest3Reflections,
} from '@/actions/responses/mission1';

type LearningActionOption = {
  id: string;
  title: string;
  description: string;
};

type LearningActionPayload = {
  selectedOption?: LearningActionOption;
  customResponse?: string;
  taskId?: string;
  completed?: boolean;
};

type RevealPayload = {
  synthesis?: {
    headline?: string;
    interpretation?: string;
    confirmed?: boolean;
  };
  completed?: boolean;
};

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
  const reveal = (progressState.payloads['m1-q3-reveal'] ??
    {}) as RevealPayload;

  const headline =
    typeof reveal.synthesis?.headline === 'string'
      ? reveal.synthesis.headline
      : '';

  const interpretation =
    typeof reveal.synthesis?.interpretation === 'string'
      ? reveal.synthesis.interpretation
      : '';

  /*
   * This node's saved response.
   */
  const saved = (progress.payload ?? {}) as LearningActionPayload;

  const [options, setOptions] = useState<LearningActionOption[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(
    saved.selectedOption?.id ?? null
  );

  const [customResponse, setCustomResponse] = useState(
    typeof saved.customResponse === 'string'
      ? saved.customResponse
      : ''
  );

  const [isWritingOwn, setIsWritingOwn] = useState(
    Boolean(saved.customResponse)
  );

  const [isGenerating, setIsGenerating] = useState(
    !saved.completed
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasGeneratedRef = useRef(false);

  /*
   * Generate specific behavioural responses from the Q3 experience.
   *
   * This is deliberately separate from the reveal.
   * The reveal tells the founder what the experience may mean.
   * This step turns that learning into possible behaviour.
   */
  useEffect(() => {
    if (saved.completed) return;
    if (hasGeneratedRef.current) return;

    if (!headline || !interpretation) {
      setIsGenerating(false);
      setError(
        'We could not find the learning from the previous step. Please go back and complete it first.'
      );
      return;
    }

    hasGeneratedRef.current = true;
    setIsGenerating(true);
    setError(null);

    async function generate() {
      try {
        const reflections = await getQuest3Reflections();

        const result = await generateLearningActions(
          {
            headline,
            interpretation,
          },
          reflections,
          nodeKey
        );

        setOptions(result.options);
      } catch (err) {
        console.error('[LEARNING ACTION GENERATION ERROR]', err);

        hasGeneratedRef.current = false;

        setError(
          'We could not generate the next choices. Please try again.'
        );
      } finally {
        setIsGenerating(false);
      }
    }

    generate();
  }, [headline, interpretation, nodeKey, saved.completed]);

  const selectedOption = options.find(
    (option) => option.id === selectedId
  );

  const canContinue =
    Boolean(selectedOption) ||
    (isWritingOwn && customResponse.trim().length > 0);

  function handleSelect(option: LearningActionOption) {
    setSelectedId(option.id);
    setIsWritingOwn(false);
    setCustomResponse('');
    setError(null);
  }

  function handleWriteOwn() {
    setSelectedId(null);
    setIsWritingOwn(true);
    setError(null);
  }

  async function handleComplete() {
    if (!canContinue || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let taskId: string | undefined;

      const response = selectedOption
        ? selectedOption.title
        : customResponse.trim();

      const description = selectedOption
        ? selectedOption.description
        : 'A behavioural response chosen from the Q3 real-world asking experiment.';

      /*
       * The chosen response becomes a practice task.
       *
       * We do not save the AI-generated options themselves.
       * Only the founder's choice becomes durable data.
       */
      const result = await saveUserTasks([
        {
          title: response,
          description,
          task_type: 'practice',
          source_node_key: nodeKey,
          metadata: {
            source_experiment_node: 'm1-q3-ask',
            source_reveal_node: 'm1-q3-reveal',
            response_type: selectedOption
              ? 'suggested'
              : 'custom',
            learning_headline: headline,
          },
        },
      ]);

      taskId = result.tasks?.[0]?.id;

      await onComplete({
        ...(selectedOption
          ? { selectedOption }
          : { customResponse: customResponse.trim() }),
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
   *
   * We deliberately show the founder's chosen response rather than
   * regenerating the AI options.
   */
  if (progress.completed || saved.completed === true) {
    const savedResponse =
      saved.selectedOption?.title ||
      saved.customResponse ||
      '';

    const savedDescription =
      saved.selectedOption?.description || '';

    return (
      <div className="w-full max-w-4xl space-y-10">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Carry the learning forward
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>
        </div>

        {headline && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What this experience showed you
            </p>

            <p className="text-xl font-semibold leading-8">
              {headline}
            </p>

            {interpretation && (
              <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
                {interpretation}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What you will carry forward
          </p>

          <div className="flex items-start gap-3">
            <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />

            <div>
              <p className="text-lg font-semibold">
                {savedResponse}
              </p>

              {savedDescription && (
                <p className="mt-2 max-w-3xl text-lg leading-8 text-muted-foreground">
                  {savedDescription}
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

  /*
   * Loading state.
   */
  if (isGenerating) {
    return (
      <div className="w-full max-w-4xl space-y-12">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Carry the learning forward
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You have seen what this experience revealed. Now we are
            turning that learning into a few specific ways you could
            respond differently next time.
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />

          <p className="text-lg text-muted-foreground">
            Looking for the behaviours that fit this experience...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Error state.
   */
  if (error && options.length === 0) {
    return (
      <div className="w-full max-w-4xl space-y-10">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Carry the learning forward
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-destructive">
            {error}
          </p>
        </div>

        <Button
          onClick={() => {
            hasGeneratedRef.current = false;
            setError(null);
            setIsGenerating(true);

            /*
             * Trigger the effect again by changing nothing would not
             * be reliable, so reload the current generation explicitly.
             */
            void (async () => {
              try {
                const reflections = await getQuest3Reflections();

                const result = await generateLearningActions(
                  {
                    headline,
                    interpretation,
                  },
                  reflections,
                  nodeKey
                );

                setOptions(result.options);
              } catch (err) {
                console.error(
                  '[LEARNING ACTION RETRY ERROR]',
                  err
                );

                setError(
                  'We could not generate the choices. Please try again.'
                );
              } finally {
                setIsGenerating(false);
              }
            })();
          }}
          className="h-12 rounded-full px-8 text-base"
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-12">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Carry the learning forward
        </p>

        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          You expected one thing. Reality gave you something else.
          Now decide what you want to do differently the next time
          you are in a similar situation.
        </p>
      </div>

      {headline && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What this experience showed you
          </p>

          <p className="text-xl font-semibold leading-8">
            {headline}
          </p>

          {interpretation && (
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
              {interpretation}
            </p>
          )}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-semibold">
            What will you do differently next time?
          </h3>

          <p className="mt-2 text-muted-foreground">
            Choose the behaviour you want to carry into a similar
            situation.
          </p>
        </div>

        <div className="space-y-3">
          {options.map((option) => {
            const selected = selectedId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={isSubmitting}
                className={[
                  'w-full rounded-2xl border p-6 text-left transition-colors',
                  'hover:border-foreground/40',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-5">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">
                      {option.title}
                    </p>

                    <p className="max-w-3xl text-base leading-7 text-muted-foreground">
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

          <button
            type="button"
            onClick={handleWriteOwn}
            disabled={isSubmitting}
            className={[
              'w-full rounded-2xl border p-6 text-left transition-colors',
              'hover:border-foreground/40',
              isWritingOwn
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-5">
              <div className="space-y-2">
                <p className="text-lg font-semibold">
                  I want to write my own
                </p>

                <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                  There is something specific from this experience
                  that I want to carry forward.
                </p>
              </div>

              {isWritingOwn && (
                <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
              )}
            </div>
          </button>
        </div>
      </div>

      {isWritingOwn && (
        <div className="max-w-3xl space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              What will you do differently?
            </h3>

            <p className="text-muted-foreground">
              Make it specific enough that you would recognize
              yourself doing it.
            </p>
          </div>

          <Textarea
            value={customResponse}
            onChange={(event) => setCustomResponse(event.target.value)}
            placeholder="Next time, I will..."
            className="min-h-[150px] resize-none text-lg leading-8"
            disabled={isSubmitting}
          />
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
              Carry this forward
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}