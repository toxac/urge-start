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
import { $userContext } from '@/lib/stores/user-context';

type BarrierOption = {
  id: string;
  title: string;
  description: string;
  reflectionPrompt: string;
  placeholder: string;
};

type BarrierReflection = {
  id: string;
  title: string;
  reflection: string;
};

type PerceivedBarriers = {
  barriers?: BarrierReflection[];
};

const barrierOptions: BarrierOption[] = [
  {
    id: 'money',
    title: 'I think I need more money.',
    description:
      'I keep thinking I need more financial security or resources before I can begin.',
    reflectionPrompt:
      'When has needing more money stopped you from taking a step?',
    placeholder:
      'I have held back because I thought I needed...',
  },
  {
    id: 'time',
    title: "I don't have enough time.",
    description:
      'My current life already feels full, and starting something feels impossible to fit in.',
    reflectionPrompt:
      'What do you actually find yourself waiting for before you make time to start?',
    placeholder:
      'I keep telling myself I will start when...',
  },
  {
    id: 'knowledge',
    title: 'I feel like I need to know more.',
    description:
      'I feel I need more knowledge, skills, experience, or preparation before I can begin.',
    reflectionPrompt:
      'What do you believe you need to know or be able to do before you can start?',
    placeholder:
      'I think I need to learn or figure out...',
  },
  {
    id: 'clarity',
    title: "I don't know where to start.",
    description:
      'There are too many possibilities, so I keep thinking about starting instead of taking a first step.',
    reflectionPrompt:
      'When you think about starting, where does the uncertainty actually stop you?',
    placeholder:
      "I get stuck because I don't know...",
  },
  {
    id: 'judgment',
    title: "I'm worried about what people will think.",
    description:
      'Being seen trying, failing, or looking inexperienced makes starting uncomfortable.',
    reflectionPrompt:
      'What are you afraid people might see, say, or think if you try?',
    placeholder:
      'I imagine people might...',
  },
  {
    id: 'failure',
    title: "I'm afraid it won't work.",
    description:
      'Starting makes the possibility of failure real, and staying in the idea feels safer.',
    reflectionPrompt:
      'What would failure mean to you if you actually tried?',
    placeholder:
      "If I tried and it didn't work, I worry that...",
  },
];

export function WhyHaventYouStarted({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);

  const savedContext =
    contextState.userContext?.perceived_barriers as
      | PerceivedBarriers
      | null
      | undefined;

  const savedBarriers = Array.isArray(savedContext?.barriers)
    ? savedContext.barriers
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

  /*
   * user_program_context is the durable source of truth.
   *
   * Progress is only used as a fallback when the context has
   * not yet been populated.
   */
  useEffect(() => {
    if (!contextState.isHydrated) return;

    if (savedBarriers.length > 0) {
      setSelectedIds(
        savedBarriers.map((barrier) => barrier.id)
      );

      setReflections(
        Object.fromEntries(
          savedBarriers.map((barrier) => [
            barrier.id,
            barrier.reflection,
          ])
        )
      );

      setMode('review');
      return;
    }

    const progressBarriers = Array.isArray(
      progressPayload.barriers
    )
      ? (progressPayload.barriers as BarrierReflection[])
      : [];

    if (progressBarriers.length > 0) {
      setSelectedIds(
        progressBarriers.map((barrier) => barrier.id)
      );

      setReflections(
        Object.fromEntries(
          progressBarriers.map((barrier) => [
            barrier.id,
            barrier.reflection,
          ])
        )
      );
    }
  }, [
    contextState.isHydrated,
    contextState.userContext?.perceived_barriers,
  ]);

  const selectedOptions = useMemo(
    () =>
      barrierOptions.filter((option) =>
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
    const barriers: BarrierReflection[] =
      selectedOptions.map((option) => ({
        id: option.id,
        title: option.title,
        reflection: (reflections[option.id] ?? '').trim(),
      }));

    setIsSaving(true);
    setError(null);

    try {
      await updateUserProgramContext({
        perceived_barriers: {
          barriers,
        },
      });

      setMode('review');

      await onComplete({
        barriers,
        completed: true,
      });
    } catch (err) {
      console.error('[WHY HAVEN’T YOU STARTED]', err);

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
        barriers: selectedOptions.map((option) => ({
          id: option.id,
          title: option.title,
          reflection: (reflections[option.id] ?? '').trim(),
        })),
        completed: true,
      });
    } catch (err) {
      console.error(
        '[WHY HAVEN’T YOU STARTED COMPLETE]',
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
              You probably have a few reasons for not
              starting. Some may be practical. Others may be
              harder to admit.
            </p>

            <p className="text-lg leading-8 text-muted-foreground">
              Don't try to find the <em>right</em> answer.
              Select anything that feels like it may be
              getting in your way. You can choose as many as
              you need.
            </p>
          </div>

          <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
            {barrierOptions.map((option) => {
              const isSelected = selectedIds.includes(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleSelection(option.id)}
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
              Think about what actually happens when this gets
              in your way. Don't worry about getting the answer
              perfect.
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
              What you've uncovered
            </p>

            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              You can see some of what has been keeping you
              still.
            </h1>

            <p className="text-lg leading-8 text-muted-foreground">
              You don't have to fix any of this yet. The point
              was to stop treating “I haven't started” as one
              big, mysterious problem.
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