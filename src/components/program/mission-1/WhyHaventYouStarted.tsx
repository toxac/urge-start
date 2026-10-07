'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import type { NodeComponentProps } from '@/components/program/componentRegistry';

import { M1_QUEST1_CONSTANTS } from '@/lib/constants/mission1-constants';
import { updateUserProgramContext } from '@/actions/user-context';

type BarrierReflection = {
  id: string;
  title: string;
  reflection: string;
};

export function WhyHaventYouStarted({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const options = M1_QUEST1_CONSTANTS.barriers.options;

  const saved = progress.payload ?? {};

  const savedBarriers = Array.isArray(saved.barriers)
    ? (saved.barriers as BarrierReflection[])
    : [];

  const [selectedIds, setSelectedIds] = useState<string[]>(
    savedBarriers.map((barrier) => barrier.id)
  );

  const [reflections, setReflections] = useState<
    Record<string, string>
  >(
    Object.fromEntries(
      savedBarriers.map((barrier) => [
        barrier.id,
        barrier.reflection,
      ])
    )
  );

  const [currentReflectionIndex, setCurrentReflectionIndex] =
    useState(
      savedBarriers.length > 0 ? 0 : -1
    );

  const [showReflection, setShowReflection] = useState(
    savedBarriers.length > 0
  );

  const [showComplete, setShowComplete] = useState(
    saved.completed === true
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOptions = useMemo(
    () =>
      options.filter((option) =>
        selectedIds.includes(option.id)
      ),
    [options, selectedIds]
  );

  const currentOption =
    selectedOptions[currentReflectionIndex] ?? null;

  const currentReflection =
    currentOption
      ? reflections[currentOption.id] ?? ''
      : '';

  const canContinueReflection =
    currentReflection.trim().length >= 10;

  function toggleSelection(id: string) {
    if (showReflection || showComplete) return;

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function startReflection() {
    if (selectedIds.length === 0) return;

    setCurrentReflectionIndex(0);
    setShowReflection(true);
    setError(null);
  }

  function updateReflection(value: string) {
    if (!currentOption) return;

    setReflections((current) => ({
      ...current,
      [currentOption.id]: value,
    }));
  }

  async function handleReflectionNext() {
    if (!currentOption || !canContinueReflection || isSubmitting) {
      return;
    }

    setError(null);

    if (currentReflectionIndex < selectedOptions.length - 1) {
      setCurrentReflectionIndex((current) => current + 1);
      return;
    }

    await saveInvestigation();
  }

  async function saveInvestigation() {
    setIsSubmitting(true);

    try {
      const barriers: BarrierReflection[] =
        selectedOptions.map((option) => ({
          id: option.id,
          title: option.title,
          reflection: (reflections[option.id] ?? '').trim(),
        }));

      const result = await updateUserProgramContext({
        perceived_barriers: {
          barriers,
        },
      });

      setShowComplete(true);

      await onComplete({
        barriers,
        completed: true,
      });

      console.log(
        '[WHY HAVEN’T YOU STARTED]',
        result.userContext
      );
    } catch (err) {
      console.error('[WHY HAVEN’T YOU STARTED]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your reflection.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;

    setIsSubmitting(true);
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
      console.error('[WHY HAVEN’T YOU STARTED COMPLETE]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong completing this step.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12">
      {!showReflection && !showComplete && (
        <>
          <div className="max-w-3xl space-y-5">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {node.title}
            </h1>

            <p className="text-lg leading-8 text-muted-foreground">
              There may be more than one thing keeping you
              from starting.
            </p>

            <p className="text-lg leading-8 text-muted-foreground">
              Read through these possibilities and select
              anything that feels like it might be part of
              your story. You can choose more than one.
            </p>
          </div>

          <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
            {options.map((option) => {
              const selected = selectedIds.includes(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleSelection(option.id)}
                  className={`group flex flex-col items-start rounded-2xl border p-6 text-left transition-all ${
                    selected
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
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border'
                      }`}
                    >
                      {selected && (
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
              onClick={startReflection}
              disabled={selectedIds.length === 0}
              className="h-12 gap-2 rounded-full px-8 text-base"
            >
              Reflect on these
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}

      {showReflection && !showComplete && currentOption && (
        <>
          <div className="max-w-3xl space-y-5">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              Possibility {currentReflectionIndex + 1} of{' '}
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
              How does this show up for you?
            </label>

            <Textarea
              value={currentReflection}
              onChange={(event) =>
                updateReflection(event.target.value)
              }
              placeholder="When I think about starting, this shows up as..."
              rows={7}
              autoFocus
              disabled={isSubmitting}
              className="resize-none text-base leading-7"
            />

            <p className="text-sm leading-6 text-muted-foreground">
              Don't try to give the perfect answer. Think of a
              real situation where you've noticed this.
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
                onClick={() => {
                  if (currentReflectionIndex === 0) {
                    setShowReflection(false);
                    return;
                  }

                  setCurrentReflectionIndex(
                    (current) => current - 1
                  );
                }}
                disabled={isSubmitting}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                onClick={handleReflectionNext}
                disabled={
                  !canContinueReflection || isSubmitting
                }
                className="h-12 gap-2 rounded-full px-8 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : currentReflectionIndex <
                  selectedOptions.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Finish reflection
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {showComplete && (
        <div className="max-w-3xl space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              What you found
            </p>

            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              You now have a clearer picture of what may be
              getting in your way.
            </h2>

            <p className="text-lg leading-8 text-muted-foreground">
              These aren't final answers. They're things worth
              paying attention to as we investigate further.
            </p>
          </div>

          <div className="space-y-4">
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

          <div className="flex justify-end">
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="h-12 gap-2 rounded-full px-8 text-base"
            >
              {isSubmitting ? (
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
        </div>
      )}
    </div>
  );
}