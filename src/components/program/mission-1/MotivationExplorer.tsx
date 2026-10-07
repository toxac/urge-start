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

type MotivationOption = {
  id: string;
  title: string;
  description: string;
  reflectionPrompt: string;
  placeholder: string;
};

type MotivationReflection = {
  id: string;
  title: string;
  reflection: string;
};

type MotivationsContext = {
  motivations?: MotivationReflection[];
};

const motivationOptions: MotivationOption[] = [
  {
    id: 'independence',
    title: 'I want more control over my work.',
    description:
      'I want more say in what I work on, how I work, or who I work with.',
    reflectionPrompt:
      'What is it about having more control that matters to you?',
    placeholder:
      'I want more control because...',
  },
  {
    id: 'frustration',
    title: 'I cannot let go of a problem that bothers me.',
    description:
      'Something feels broken, frustrating, inefficient, or unnecessary, and I keep thinking about how it could be different.',
    reflectionPrompt:
      'What is it about this problem that keeps coming back to you?',
    placeholder:
      'This keeps bothering me because...',
  },
  {
    id: 'possibility',
    title: 'I keep seeing something that could exist.',
    description:
      'You have an idea, possibility, or way of doing something that you keep imagining.',
    reflectionPrompt:
      'What do you keep imagining could exist or be done differently?',
    placeholder:
      'I keep thinking about...',
  },
  {
    id: 'lifestyle',
    title: 'I want a different way to live or work.',
    description:
      'The way your work or life is organised today does not feel like the way you want to live.',
    reflectionPrompt:
      'What would you want your life or work to feel more like?',
    placeholder:
      'I want my life or work to be more...',
  },
  {
    id: 'impact',
    title: 'I want to make a difference for someone.',
    description:
      'There is a person, group, or problem you care about and you want to do something useful about it.',
    reflectionPrompt:
      'Who do you want to help, and why does that matter to you?',
    placeholder:
      'I care about this because...',
  },
  {
    id: 'self_belief',
    title: 'I want to prove something to myself.',
    description:
      'Part of you wants to know whether you can actually take an idea and make something happen.',
    reflectionPrompt:
      'What would starting and following through prove to you?',
    placeholder:
      'I think it would show me that I can...',
  },
];

export function MotivationExplorer({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);

  const savedContext =
    contextState.userContext?.motivations as
      | MotivationsContext
      | null
      | undefined;

  const savedMotivations = Array.isArray(
    savedContext?.motivations
  )
    ? savedContext.motivations
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
   * Progress is only used as a fallback when the context
   * has not yet been populated.
   */
  useEffect(() => {
    if (!contextState.isHydrated) return;

    if (savedMotivations.length > 0) {
      setSelectedIds(
        savedMotivations.map((motivation) => motivation.id)
      );

      setReflections(
        Object.fromEntries(
          savedMotivations.map((motivation) => [
            motivation.id,
            motivation.reflection,
          ])
        )
      );

      setMode('review');
      return;
    }

    const progressMotivations = Array.isArray(
      progressPayload.motivations
    )
      ? (progressPayload.motivations as MotivationReflection[])
      : [];

    if (progressMotivations.length > 0) {
      setSelectedIds(
        progressMotivations.map(
          (motivation) => motivation.id
        )
      );

      setReflections(
        Object.fromEntries(
          progressMotivations.map((motivation) => [
            motivation.id,
            motivation.reflection,
          ])
        )
      );
    }
  }, [
    contextState.isHydrated,
    contextState.userContext?.motivations,
  ]);

  const selectedOptions = useMemo(
    () =>
      motivationOptions.filter((option) =>
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
    const motivations: MotivationReflection[] =
      selectedOptions.map((option) => ({
        id: option.id,
        title: option.title,
        reflection: (reflections[option.id] ?? '').trim(),
      }));

    setIsSaving(true);
    setError(null);

    try {
      const result = await updateUserProgramContext({
        motivations: {
          motivations,
        },
      });

      userContextActions.updateContextLocally(
        result.userContext
      );

      setMode('review');

      await onComplete({
        motivations,
        completed: true,
      });
    } catch (err) {
      console.error('[MOTIVATION EXPLORER]', err);

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
        motivations: selectedOptions.map((option) => ({
          id: option.id,
          title: option.title,
          reflection: (reflections[option.id] ?? '').trim(),
        })),
        completed: true,
      });
    } catch (err) {
      console.error(
        '[MOTIVATION EXPLORER COMPLETE]',
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
              You have already looked at some of the things
              that get in your way.
            </p>

            <p className="text-lg leading-8 text-muted-foreground">
              Now look in the other direction. What keeps
              bringing you back to this? What makes you want
              to start, even when part of you wants to stay
              where you are?
            </p>

            <p className="text-base leading-7 text-muted-foreground">
              Choose everything that feels like it has
              something to do with your pull to start.
            </p>
          </div>

          <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
            {motivationOptions.map((option) => {
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
              What keeps bringing you back?
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
              Stay with your own experience. There is no
              right answer here.
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
              What keeps bringing you back
            </p>

            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              These are some of the things that matter to you.
            </h1>

            <p className="text-lg leading-8 text-muted-foreground">
              Take a moment to look at what you wrote. You
              don't need to explain it further or decide what
              it means yet.
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