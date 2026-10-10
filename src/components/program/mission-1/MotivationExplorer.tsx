
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Loader2,
  Pencil,
  PlusCircle,
  X,
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
    placeholder: 'I want more control because...',
  },
  {
    id: 'frustration',
    title: 'I cannot let go of a problem that bothers me.',
    description:
      'Something feels broken, frustrating, inefficient, or unnecessary, and I keep thinking about how it could be different.',
    reflectionPrompt:
      'What is it about this problem that keeps coming back to you?',
    placeholder: 'This keeps bothering me because...',
  },
  {
    id: 'possibility',
    title: 'I keep seeing something that could exist.',
    description:
      'You have an idea, possibility, or way of doing something that you keep imagining.',
    reflectionPrompt:
      'What do you keep imagining could exist or be done differently?',
    placeholder: 'I keep thinking about...',
  },
  {
    id: 'lifestyle',
    title: 'I want a different way to live or work.',
    description:
      'The way your work or life is organised today does not feel like the way you want to live.',
    reflectionPrompt:
      'What would you want your life or work to feel more like?',
    placeholder: 'I want my life or work to be more...',
  },
  {
    id: 'impact',
    title: 'I want to make a difference for someone.',
    description:
      'There is a person, group, or problem you care about and you want to do something useful about it.',
    reflectionPrompt:
      'Who do you want to help, and why does that matter to you?',
    placeholder: 'I care about this because...',
  },
  {
    id: 'self_belief',
    title: 'I want to prove something to myself.',
    description:
      'Part of you wants to know whether you can actually take an idea and make something happen.',
    reflectionPrompt:
      'What would starting and following through prove to you?',
    placeholder: 'I think it would show me that I can...',
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

  const progressPayload = progress.payload ?? {};
  const hasInitialized = useRef(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reflections, setReflections] = useState<Record<string, string>>(
    {},
  );

  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeOption = motivationOptions.find(
    (option) => option.id === activeOptionId,
  );

  const selectedOptions = useMemo(
    () =>
      motivationOptions.filter((option) =>
        selectedIds.includes(option.id),
      ),
    [selectedIds],
  );

  const canSave = draft.trim().length >= 10;

  // Restore saved responses from context, falling back to node progress.
  useEffect(() => {
    if (!contextState.isHydrated || hasInitialized.current) return;

    const contextMotivations = savedContext?.motivations;
    const progressMotivations = Array.isArray(progressPayload.motivations)
      ? (progressPayload.motivations as MotivationReflection[])
      : [];

    const initialMotivations = Array.isArray(contextMotivations)
      ? contextMotivations
      : progressMotivations;

    setSelectedIds(
      initialMotivations.map((motivation) => motivation.id),
    );

    setReflections(
      Object.fromEntries(
        initialMotivations.map((motivation) => [
          motivation.id,
          motivation.reflection,
        ]),
      ),
    );

    hasInitialized.current = true;
  }, [
    contextState.isHydrated,
    savedContext,
    progressPayload,
  ]);

  // Allow Escape to close the dialog without losing the saved response.
  useEffect(() => {
    if (!activeOptionId) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) {
        setActiveOptionId(null);
        setError(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeOptionId, isSaving]);

  function openReflection(option: MotivationOption) {
    setError(null);
    setDraft(reflections[option.id] ?? '');
    setActiveOptionId(option.id);
  }

  function closeReflection() {
    if (isSaving) return;

    setActiveOptionId(null);
    setError(null);
  }

  function buildMotivations(
    ids: string[],
    values: Record<string, string>,
  ): MotivationReflection[] {
    return motivationOptions
      .filter((option) => ids.includes(option.id))
      .map((option) => ({
        id: option.id,
        title: option.title,
        reflection: (values[option.id] ?? '').trim(),
      }));
  }

  async function persistMotivations(
    ids: string[],
    values: Record<string, string>,
  ) {
    const motivations = buildMotivations(ids, values);

    const result = await updateUserProgramContext({
      motivations: { motivations },
    });

    userContextActions.updateContextLocally(result.userContext);

    return motivations;
  }

  async function saveReflection() {
    if (!activeOption || !canSave || isSaving) return;

    setIsSaving(true);
    setError(null);

    const nextIds = selectedIds.includes(activeOption.id)
      ? selectedIds
      : [...selectedIds, activeOption.id];

    const nextReflections = {
      ...reflections,
      [activeOption.id]: draft.trim(),
    };

    try {
      await persistMotivations(nextIds, nextReflections);

      setSelectedIds(nextIds);
      setReflections(nextReflections);
      setActiveOptionId(null);
    } catch (err) {
      console.error('[MOTIVATION EXPLORER SAVE]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your response.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeMotivation(id: string) {
    if (isRemoving || isSaving || isCompleting) return;

    const nextIds = selectedIds.filter((item) => item !== id);
    const nextReflections = { ...reflections };
    delete nextReflections[id];

    setIsRemoving(id);
    setError(null);

    try {
      await persistMotivations(nextIds, nextReflections);

      setSelectedIds(nextIds);
      setReflections(nextReflections);
    } catch (err) {
      console.error('[MOTIVATION EXPLORER REMOVE]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong removing this response.',
      );
    } finally {
      setIsRemoving(null);
    }
  }

  async function handleContinue() {
    if (selectedIds.length === 0 || isCompleting) return;

    setIsCompleting(true);
    setError(null);

    const motivations = buildMotivations(selectedIds, reflections);

    try {
      // Persist the final state before completing the node.
      await persistMotivations(selectedIds, reflections);

      await onComplete({
        motivations,
        completed: true,
      });
    } catch (err) {
      console.error('[MOTIVATION EXPLORER COMPLETE]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong completing this step.',
      );
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12">
      <div className="max-w-3xl space-y-5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h1>

        <p className="text-lg leading-8 text-muted-foreground">
          You have already looked at some of the things that get in your way.
        </p>

        <p className="text-lg leading-8 text-muted-foreground">
          Now look in the other direction. What keeps bringing you back
          to this? What makes you want to start, even when part of you
          wants to stay where you are?
        </p>

        <p className="text-base leading-7 text-muted-foreground">
          Choose any statements that feel familiar. When you select one,
          a window will open where you can reflect on what it means to
          you. Save your response to mark it as something you&apos;re
          exploring. You can edit or remove your responses at any time.
        </p>
      </div>

      <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
        {motivationOptions.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          const reflection = reflections[option.id] ?? '';
          const isRemovingThis = isRemoving === option.id;

          return (
            <div
              key={option.id}
              className={`relative self-start rounded-2xl border transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <button
                type="button"
                onClick={() => openReflection(option)}
                disabled={isSaving || Boolean(isRemoving) || isCompleting}
                aria-label={
                  isSelected
                    ? `Edit response: ${option.title}`
                    : `Reflect on: ${option.title}`
                }
                className="flex w-full flex-col items-start p-4 text-left sm:p-5"
              >
                <div className="flex w-full items-start gap-3">
                  <h3 className="font-heading text-xl font-medium leading-snug">
                    {option.title}
                  </h3>

                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {option.description}
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary">
                  {isSelected ? (
                    <>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit your response
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-3.5 w-3.5" />
                      Select to reflect
                    </>
                  )}
                </div>

                {isSelected && reflection && (
                  <p className="mt-4 line-clamp-3 w-full border-t border-border/70 pt-3 text-sm leading-6 text-muted-foreground">
                    {reflection}
                  </p>
                )}
              </button>

              {isSelected && (
                <button
                  type="button"
                  aria-label={`Remove ${option.title}`}
                  title="Remove this selection"
                  disabled={Boolean(isRemoving) || isSaving || isCompleting}
                  onClick={() => void removeMotivation(option.id)}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {isRemovingThis ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectedOptions.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedOptions.length}{' '}
          {selectedOptions.length === 1 ? 'response' : 'responses'} saved.
          You can still edit or remove them.
        </p>
      )}

      {error && (
        <p role="alert" className="max-w-4xl text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex max-w-4xl justify-end">
        <Button
          onClick={handleContinue}
          disabled={
            selectedIds.length === 0 ||
            isCompleting ||
            isSaving ||
            Boolean(isRemoving)
          }
          className="h-12 gap-2 rounded-full px-8 text-base"
        >
          {isCompleting ? (
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

      {activeOption && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReflection();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="motivation-dialog-title"
            className="my-auto w-full max-w-2xl rounded-2xl border border-border bg-background p-5 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Reflection
                </p>

                <h2
                  id="motivation-dialog-title"
                  className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
                >
                  {activeOption.title}
                </h2>

                <p className="leading-7 text-muted-foreground">
                  {activeOption.description}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReflection}
                disabled={isSaving}
                aria-label="Close reflection"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-7 space-y-4">
              <label
                htmlFor="motivation-reflection"
                className="block text-base font-medium leading-7"
              >
                {activeOption.reflectionPrompt}
              </label>

              <Textarea
                id="motivation-reflection"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={activeOption.placeholder}
                rows={6}
                autoFocus
                disabled={isSaving}
                className="resize-y text-base leading-7"
              />

              <p className="text-sm leading-6 text-muted-foreground">
                Stay with your own experience. There is no right answer
                here, and you don&apos;t need to get it perfect.
              </p>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={closeReflection}
                disabled={isSaving}
                className="h-11 rounded-full px-6"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={saveReflection}
                disabled={!canSave || isSaving}
                className="h-11 gap-2 rounded-full px-6"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save response
                  </>
                )}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
