
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
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
    placeholder: 'I have held back because I thought I needed...',
  },
  {
    id: 'time',
    title: "I don't have enough time.",
    description:
      'My current life already feels full, and starting something feels impossible to fit in.',
    reflectionPrompt:
      'What do you actually find yourself waiting for before you make time to start?',
    placeholder: 'I keep telling myself I will start when...',
  },
  {
    id: 'knowledge',
    title: 'I feel like I need to know more.',
    description:
      'I feel I need more knowledge, skills, experience, or preparation before I can begin.',
    reflectionPrompt:
      'What do you believe you need to know or be able to do before you can start?',
    placeholder: 'I think I need to learn or figure out...',
  },
  {
    id: 'clarity',
    title: "I don't know where to start.",
    description:
      'There are too many possibilities, so I keep thinking about starting instead of taking a first step.',
    reflectionPrompt:
      'When you think about starting, where does the uncertainty actually stop you?',
    placeholder: "I get stuck because I don't know...",
  },
  {
    id: 'judgment',
    title: "I'm worried about what people will think.",
    description:
      'Being seen trying, failing, or looking inexperienced makes starting uncomfortable.',
    reflectionPrompt:
      'What are you afraid people might see, say, or think if you try?',
    placeholder: 'I imagine people might...',
  },
  {
    id: 'failure',
    title: "I'm afraid it won't work.",
    description:
      'Starting makes the possibility of failure real, and staying in the idea feels safer.',
    reflectionPrompt:
      'What would failure mean to you if you actually tried?',
    placeholder: "If I tried and it didn't work, I worry that...",
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

  const activeOption = barrierOptions.find(
    (option) => option.id === activeOptionId,
  );

  const selectedOptions = useMemo(
    () =>
      barrierOptions.filter((option) => selectedIds.includes(option.id)),
    [selectedIds],
  );

  const activeReflection = activeOption
    ? reflections[activeOption.id] ?? ''
    : '';

  const canSave = draft.trim().length >= 10;

  // Restore saved responses from context, falling back to node progress.
  useEffect(() => {
    if (!contextState.isHydrated || hasInitialized.current) return;

    const contextBarriers = savedContext?.barriers;
    const progressBarriers = Array.isArray(progressPayload.barriers)
      ? (progressPayload.barriers as BarrierReflection[])
      : [];

    const initialBarriers = Array.isArray(contextBarriers)
      ? contextBarriers
      : progressBarriers;

    setSelectedIds(initialBarriers.map((barrier) => barrier.id));
    setReflections(
      Object.fromEntries(
        initialBarriers.map((barrier) => [
          barrier.id,
          barrier.reflection,
        ]),
      ),
    );

    hasInitialized.current = true;
  }, [
    contextState.isHydrated,
    savedContext,
    progressPayload,
  ]);

  // Allow Escape to close the dialog.
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

  function openReflection(option: BarrierOption) {
    setError(null);
    setDraft(reflections[option.id] ?? '');
    setActiveOptionId(option.id);
  }

  function closeReflection() {
    if (isSaving) return;

    setActiveOptionId(null);
    setError(null);
  }

  function buildBarriers(
    ids: string[],
    values: Record<string, string>,
  ): BarrierReflection[] {
    return barrierOptions
      .filter((option) => ids.includes(option.id))
      .map((option) => ({
        id: option.id,
        title: option.title,
        reflection: (values[option.id] ?? '').trim(),
      }));
  }

  async function persistBarriers(
    ids: string[],
    values: Record<string, string>,
  ) {
    const barriers = buildBarriers(ids, values);

    await updateUserProgramContext({
      perceived_barriers: { barriers },
    });

    return barriers;
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
      await persistBarriers(nextIds, nextReflections);

      setSelectedIds(nextIds);
      setReflections(nextReflections);
      setActiveOptionId(null);
    } catch (err) {
      console.error('[WHY HAVEN’T YOU STARTED SAVE]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your response.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeBarrier(id: string) {
    if (isRemoving || isSaving || isCompleting) return;

    const nextIds = selectedIds.filter((item) => item !== id);
    const nextReflections = { ...reflections };
    delete nextReflections[id];

    setIsRemoving(id);
    setError(null);

    try {
      await persistBarriers(nextIds, nextReflections);

      setSelectedIds(nextIds);
      setReflections(nextReflections);
    } catch (err) {
      console.error('[WHY HAVEN’T YOU STARTED REMOVE]', err);

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

    const barriers = buildBarriers(selectedIds, reflections);

    try {
      // Ensure the final state is saved before completing the node.
      await updateUserProgramContext({
        perceived_barriers: { barriers },
      });

      await onComplete({
        barriers,
        completed: true,
      });
    } catch (err) {
      console.error('[WHY HAVEN’T YOU STARTED COMPLETE]', err);

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
          You probably have a few reasons for not starting. Some may be
          practical. Others may be harder to admit.
        </p>

        <p className="text-lg leading-8 text-muted-foreground">
          Choose any statements that feel familiar. When you select one,
          a window will open where you can reflect on how it shows up in
          your life. Save your response to mark it as something you&apos;re
          exploring. You can revisit your answers, edit them, or remove
          a statement at any time.
        </p>
      </div>

      <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
        {barrierOptions.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          const reflection = reflections[option.id] ?? '';
          const isRemovingThis = isRemoving === option.id;

          return (
            <div
              key={option.id}
              className={`relative rounded-2xl border transition-all ${isSelected
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

                  {isSelected && (
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  )}
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
                  onClick={() => void removeBarrier(option.id)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
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
            aria-labelledby="barrier-dialog-title"
            className="my-auto w-full max-w-2xl rounded-2xl border border-border bg-background p-5 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Reflection
                </p>

                <h2
                  id="barrier-dialog-title"
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
                htmlFor="barrier-reflection"
                className="block text-base font-medium leading-7"
              >
                {activeOption.reflectionPrompt}
              </label>

              <Textarea
                id="barrier-reflection"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={activeOption.placeholder}
                rows={6}
                autoFocus
                disabled={isSaving}
                className="resize-y text-base leading-7"
              />

              <p className="text-sm leading-6 text-muted-foreground">
                Think about what actually happens when this gets in your
                way. You don&apos;t need to get the answer perfect.
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
