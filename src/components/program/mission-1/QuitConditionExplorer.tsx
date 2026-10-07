'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

import { updateUserProgramContext } from '@/actions/user-context';
import {
  $userContext,
  userContextActions,
} from '@/lib/stores/user-context';

type QuitOption = {
  id: string;
  title: string;
  description: string;
  reflectionPrompt: string;
  placeholder: string;
};

type QuitCondition = {
  id: string;
  title: string;
  reflection: string;
};

type QuitConditionsContext = {
  conditions?: QuitCondition[];
};

const quitOptions: QuitOption[] = [
  {
    id: 'money',
    title: 'I run out of money or resources.',
    description:
      'The cost of continuing starts to feel greater than what I can afford.',
    reflectionPrompt:
      'What would “this is costing me too much” look like for you?',
    placeholder:
      'I would start thinking about stopping if...',
  },
  {
    id: 'rejection',
    title: 'People keep saying no.',
    description:
      'Repeated rejection or lack of response could make you question whether it is worth continuing.',
    reflectionPrompt:
      'How might repeated rejection affect your willingness to keep going?',
    placeholder:
      'If people kept saying no, I might...',
  },
  {
    id: 'slow_progress',
    title: 'Nothing seems to be happening.',
    description:
      'You keep putting in effort but do not see enough progress to believe it is working.',
    reflectionPrompt:
      'How long could you keep going without seeing meaningful progress?',
    placeholder:
      'If I kept working but saw no progress...',
  },
  {
    id: 'loss_of_interest',
    title: 'I stop believing in the idea.',
    description:
      'The excitement fades, the problem no longer feels important, or something else starts to matter more.',
    reflectionPrompt:
      'What might make you genuinely lose interest in continuing?',
    placeholder:
      'I might stop caring about it if...',
  },
  {
    id: 'life',
    title: 'Life gets in the way.',
    description:
      'Family, work, health, relationships, or other responsibilities become harder to balance.',
    reflectionPrompt:
      'What could happen in your life that would make continuing difficult?',
    placeholder:
      'If life became difficult because...',
  },
  {
    id: 'self_doubt',
    title: 'I start doubting whether I can do it.',
    description:
      'Setbacks could turn into a belief that you are not capable of making this work.',
    reflectionPrompt:
      'What kind of setback could make you start doubting yourself?',
    placeholder:
      'I might start thinking I cannot do this if...',
  },
];

export function QuitConditionExplorer({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);

  const savedContext =
    contextState.userContext?.quit_conditions as
      | QuitConditionsContext
      | null
      | undefined;

  const savedConditions = Array.isArray(
    savedContext?.conditions
  )
    ? savedContext.conditions
    : [];

  const progressPayload = progress.payload ?? {};

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reflections, setReflections] = useState<
    Record<string, string>
  >({});

  const [mode, setMode] = useState<
    'select' | 'reflect' | 'review'
  >('select');

  const [currentIndex, setCurrentIndex] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contextState.isHydrated) return;

    if (savedConditions.length > 0) {
      setSelectedIds(
        savedConditions.map((condition) => condition.id)
      );

      setReflections(
        Object.fromEntries(
          savedConditions.map((condition) => [
            condition.id,
            condition.reflection,
          ])
        )
      );

      setMode('review');
      return;
    }

    const progressConditions = Array.isArray(
      progressPayload.conditions
    )
      ? (progressPayload.conditions as QuitCondition[])
      : [];

    if (progressConditions.length > 0) {
      setSelectedIds(
        progressConditions.map((condition) => condition.id)
      );

      setReflections(
        Object.fromEntries(
          progressConditions.map((condition) => [
            condition.id,
            condition.reflection,
          ])
        )
      );
    }
  }, [
    contextState.isHydrated,
    contextState.userContext?.quit_conditions,
  ]);

  const selectedOptions = useMemo(
    () =>
      quitOptions.filter((option) =>
        selectedIds.includes(option.id)
      ),
    [selectedIds]
  );

  const currentOption =
    selectedOptions[currentIndex] ?? null;

  const currentReflection = currentOption
    ? reflections[currentOption.id] ?? ''
    : '';

  const canContinue =
    currentReflection.trim().length >= 10;

  function toggleSelection(id: string) {
    if (mode !== 'select') return;

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function beginReflection() {
    if (selectedIds.length === 0) return;

    setCurrentIndex(0);
    setMode('reflect');
    setError(null);
  }

  function updateReflection(value: string) {
    if (!currentOption) return;

    setReflections((current) => ({
      ...current,
      [currentOption.id]: value,
    }));
  }

  function goBackInReflection() {
    if (currentIndex === 0) {
      setMode('select');
      setError(null);
      return;
    }

    setCurrentIndex((current) => current - 1);
  }

  async function saveInvestigation() {
    const conditions: QuitCondition[] =
      selectedOptions.map((option) => ({
        id: option.id,
        title: option.title,
        reflection: (reflections[option.id] ?? '').trim(),
      }));

    setIsSaving(true);
    setError(null);

    try {
      const result = await updateUserProgramContext({
        quit_conditions: {
          conditions,
        },
      });

      userContextActions.updateContextLocally(
        result.userContext
      );

      setMode('review');

      await onComplete({
        conditions,
        completed: true,
      });
    } catch (err) {
      console.error('[QUIT CONDITION EXPLORER]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your reflection.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function nextReflection() {
    if (!currentOption || !canContinue || isSaving) {
      return;
    }

    if (currentIndex < selectedOptions.length - 1) {
      setCurrentIndex((current) => current + 1);
      return;
    }

    await saveInvestigation();
  }

  async function handleContinue() {
    if (isCompleting) return;

    setIsCompleting(true);
    setError(null);

    try {
      await onComplete({
        conditions: selectedOptions.map((option) => ({
          id: option.id,
          title: option.title,
          reflection: (reflections[option.id] ?? '').trim(),
        })),
        completed: true,
      });
    } catch (err) {
      console.error(
        '[QUIT CONDITION EXPLORER COMPLETE]',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong completing this step.'
      );
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12">
      {mode === 'select' && (
        <>
          <div className="max-w-3xl space-y-5">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {node.title}
            </h1>

            <p className="text-lg leading-8 text-muted-foreground">
              Starting is only part of the journey. Things
              will get difficult at some point.
            </p>

            <p className="text-lg leading-8 text-muted-foreground">
              Before you move on, think honestly about what
              could make you walk away.
            </p>

            <p className="text-base leading-7 text-muted-foreground">
              Choose the things that feel like realistic risks
              for you. You can choose more than one.
            </p>
          </div>

          <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
            {quitOptions.map((option) => {
              const isSelected = selectedIds.includes(
                option.id
              );

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    toggleSelection(option.id)
                  }
                  className={`group flex flex-col items-start rounded-2xl border p-6 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="font-heading text-xl font-medium">
                        {option.title}
                      </h3>

                      <p className="text-sm leading-6 text-muted-foreground">
                        {option.description}
                      </p>
                    </div>

                    <div
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border'
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex max-w-4xl justify-end">
            <Button
              onClick={beginReflection}
              disabled={selectedIds.length === 0}
              className="h-12 gap-2 rounded-full px-8 text-base"
            >
              Look closer
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}

      {mode === 'reflect' && currentOption && (
        <>
          <div className="max-w-3xl space-y-5">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              Possibility {currentIndex + 1} of{' '}
              {selectedOptions.length}
            </p>

            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {currentOption.title}
            </h1>

            <p className="text-lg leading-8 text-muted-foreground">
              {currentOption.description}
            </p>
          </div>

          <div className="max-w-3xl space-y-5">
            <label className="text-lg font-medium text-foreground">
              {currentOption.reflectionPrompt}
            </label>

            <Textarea
              value={currentReflection}
              onChange={(event) =>
                updateReflection(event.target.value)
              }
              placeholder={currentOption.placeholder}
              rows={7}
              autoFocus
              disabled={isSaving}
              className="resize-none text-base leading-7"
            />

            <p className="text-sm leading-6 text-muted-foreground">
              Be realistic, not dramatic. You are not
              predicting the future. You are noticing what
              could make you stop.
            </p>

            {error && (
              <p className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={goBackInReflection}
                disabled={isSaving}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                onClick={nextReflection}
                disabled={!canContinue || isSaving}
                className="h-12 gap-2 rounded-full px-8 text-base"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : currentIndex <
                  selectedOptions.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Finish
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {mode === 'review' && (
        <>
          <div className="max-w-3xl space-y-5">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              What could make you stop
            </p>

            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              You know some of the risks that could pull you
              off course.
            </h1>

            <p className="text-lg leading-8 text-muted-foreground">
              You don't need to solve them now. Just keep them
              visible as you move forward.
            </p>
          </div>

          <div className="max-w-3xl space-y-4">
            {selectedOptions.map((option) => (
              <div
                key={option.id}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="font-heading text-lg font-medium">
                  {option.title}
                </h3>

                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {reflections[option.id]}
                </p>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex max-w-3xl items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode('select')}
              disabled={isCompleting}
            >
              Edit
            </Button>

            <Button
              onClick={handleContinue}
              disabled={isCompleting}
              className="h-12 gap-2 rounded-full px-8 text-base"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Continuing...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}