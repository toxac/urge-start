
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
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

type ExperienceOption = {
  id: string;
  title: string;
  description: string;
  reflectionPrompt: string;
  placeholder: string;
};

type ExperienceEntry = {
  id: string;
  title: string;
  evidence: string;
};

type ExperienceContext = {
  items: ExperienceEntry[];
};

const experiences: ExperienceOption[] = [
  {
    id: 'industry',
    title: 'Worked in an industry',
    description:
      'You have spent enough time around an industry to understand how some part of it actually works.',
    reflectionPrompt:
      'What did you learn about how this industry works?',
    placeholder:
      'I learned how this industry works by...',
  },
  {
    id: 'customers',
    title: 'Dealt with a particular kind of customer',
    description:
      'You have spent time understanding, serving, helping, or selling to a particular kind of person.',
    reflectionPrompt:
      'What did you learn about these people, their needs, or how they make decisions?',
    placeholder:
      'From working with these people, I noticed...',
  },
  {
    id: 'repeated_problem',
    title: 'Solved a problem repeatedly',
    description:
      'You have encountered the same kind of problem often enough to learn something about it.',
    reflectionPrompt:
      'What kept going wrong, and what did you learn from dealing with it?',
    placeholder:
      'I kept encountering this problem, and I learned...',
  },
  {
    id: 'built_from_scratch',
    title: 'Built something from scratch',
    description:
      'You have started with very little and figured out how to create something that worked.',
    reflectionPrompt:
      'What were you trying to build, and how did you make it happen?',
    placeholder:
      'I started with..., figured out..., and managed to...',
  },
  {
    id: 'run_project',
    title: 'Run an event or project',
    description:
      'You have had to coordinate people, resources, deadlines, or moving parts to make something happen.',
    reflectionPrompt:
      'What did you have to coordinate, and what did the experience teach you?',
    placeholder:
      'I had to bring together..., and I learned...',
  },
  {
    id: 'managed_resources',
    title: 'Managed money or limited resources',
    description:
      'You have had to make decisions when money, time, people, or other resources were limited.',
    reflectionPrompt:
      'What choices did you have to make with limited resources?',
    placeholder:
      'I had limited..., so I decided to...',
  },
  {
    id: 'failure',
    title: 'Dealt with failure or a setback',
    description:
      'Something did not work out, and you had to figure out what to do next.',
    reflectionPrompt:
      'What happened, how did you respond, and what do you understand now that you did not understand before?',
    placeholder:
      'Things did not go as planned when..., so I...',
  },
  {
    id: 'community',
    title: 'Been part of a community',
    description:
      'You have been closely involved with a group of people who share an interest, identity, profession, or place.',
    reflectionPrompt:
      'What did being part of this community help you understand about its people?',
    placeholder:
      'Being part of this community helped me notice...',
  },
  {
    id: 'seen_business',
    title: 'Seen how a business or industry works',
    description:
      'You have had a close enough view to notice how people buy, sell, deliver, compete, or make decisions.',
    reflectionPrompt:
      'What did you notice about how the business operates or makes money?',
    placeholder:
      'I noticed that the business...',
  },
  {
    id: 'lived_problem',
    title: 'Personally experienced a problem',
    description:
      'You have experienced a problem yourself rather than only hearing about it from someone else.',
    reflectionPrompt:
      'What was difficult about this problem, and what do you wish had been different?',
    placeholder:
      'When I experienced this, I struggled with...',
  },
  {
    id: 'constraints',
    title: 'Worked around constraints',
    description:
      'You have had to get something done despite limited money, time, information, access, or other resources.',
    reflectionPrompt:
      'What was getting in your way, and how did you work around it?',
    placeholder:
      'I could not..., so I found a way to...',
  },
  {
    id: 'figure_it_out',
    title: 'Figured something out without much help',
    description:
      'You have had to navigate something unfamiliar and find your own way through it.',
    reflectionPrompt:
      'What did you have to figure out, and how did you find your way forward?',
    placeholder:
      'I did not know how to..., so I...',
  },
];

function getSavedExperiences(
  progress: NodeComponentProps['progress'],
): ExperienceEntry[] {
  const savedContext = $userContext.get().userContext?.experience as
    | ExperienceContext
    | null
    | undefined;

  if (savedContext && Array.isArray(savedContext.items)) {
    return savedContext.items;
  }

  const saved = progress.payload?.experience;

  if (
    saved &&
    typeof saved === 'object' &&
    Array.isArray((saved as ExperienceContext).items)
  ) {
    return (saved as ExperienceContext).items;
  }

  return [];
}

export function ExperienceMiner({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);

  const savedContext = contextState.userContext?.experience as
    | ExperienceContext
    | null
    | undefined;

  const hasInitialized = useRef(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<Record<string, string>>({});

  const [activeExperienceId, setActiveExperienceId] = useState<string | null>(
    null,
  );
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeExperience = experiences.find(
    (experience) => experience.id === activeExperienceId,
  );

  const selectedExperiences = useMemo(
    () => experiences.filter((experience) => selectedIds.includes(experience.id)),
    [selectedIds],
  );

  const canSave = draft.trim().length >= 10;

  // Restore saved entries after user context has hydrated.
  useEffect(() => {
    if (!contextState.isHydrated || hasInitialized.current) return;

    const contextItems = savedContext?.items;
    const progressItems = getSavedExperiences(progress);

    const initialItems = Array.isArray(contextItems)
      ? contextItems
      : progressItems;

    setSelectedIds(initialItems.map((item) => item.id));
    setEvidence(
      Object.fromEntries(
        initialItems.map((item) => [item.id, item.evidence]),
      ),
    );

    hasInitialized.current = true;
  }, [contextState.isHydrated, savedContext, progress]);

  // Close the dialog with Escape without changing saved responses.
  useEffect(() => {
    if (!activeExperienceId) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) {
        setActiveExperienceId(null);
        setError(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeExperienceId, isSaving]);

  function openReflection(experience: ExperienceOption) {
    setError(null);
    setDraft(evidence[experience.id] ?? '');
    setActiveExperienceId(experience.id);
  }

  function closeReflection() {
    if (isSaving) return;

    setActiveExperienceId(null);
    setError(null);
  }

  function buildEntries(
    ids: string[],
    values: Record<string, string>,
  ): ExperienceEntry[] {
    return experiences
      .filter((experience) => ids.includes(experience.id))
      .map((experience) => ({
        id: experience.id,
        title: experience.title,
        evidence: (values[experience.id] ?? '').trim(),
      }));
  }

  async function persistExperiences(
    ids: string[],
    values: Record<string, string>,
  ) {
    const items = buildEntries(ids, values);

    const result = await updateUserProgramContext({
      experience: { items },
    });

    userContextActions.updateContextLocally(result.userContext);

    return items;
  }

  async function saveReflection() {
    if (!activeExperience || !canSave || isSaving) return;

    setIsSaving(true);
    setError(null);

    const nextIds = selectedIds.includes(activeExperience.id)
      ? selectedIds
      : [...selectedIds, activeExperience.id];

    const nextEvidence = {
      ...evidence,
      [activeExperience.id]: draft.trim(),
    };

    try {
      await persistExperiences(nextIds, nextEvidence);

      setSelectedIds(nextIds);
      setEvidence(nextEvidence);
      setActiveExperienceId(null);
    } catch (err) {
      console.error('[EXPERIENCE MINER SAVE]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your response. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeExperience(id: string) {
    if (isRemoving || isSaving || isCompleting) return;

    const nextIds = selectedIds.filter((item) => item !== id);
    const nextEvidence = { ...evidence };
    delete nextEvidence[id];

    setIsRemoving(id);
    setError(null);

    try {
      await persistExperiences(nextIds, nextEvidence);

      setSelectedIds(nextIds);
      setEvidence(nextEvidence);
    } catch (err) {
      console.error('[EXPERIENCE MINER REMOVE]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong removing this response. Please try again.',
      );
    } finally {
      setIsRemoving(null);
    }
  }

  async function handleContinue() {
    if (selectedIds.length === 0 || isCompleting) return;

    setIsCompleting(true);
    setError(null);

    const items = buildEntries(selectedIds, evidence);

    try {
      await persistExperiences(selectedIds, evidence);

      await onComplete({
        experience: { items },
        completed: true,
      });
    } catch (err) {
      console.error('[EXPERIENCE MINER COMPLETE]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong completing this step. Please try again.',
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

        {node.description && (
          <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
            {node.description}
          </p>
        )}

        <p className="text-base leading-7 text-muted-foreground">
          Choose experiences that genuinely apply to you. When you select one,
          a window will open where you can describe what happened and what you
          learned. Save each response to add it to your list. You can edit or
          remove your responses at any time.
        </p>
      </div>

      <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
        {experiences.map((experience) => {
          const isSelected = selectedIds.includes(experience.id);
          const response = evidence[experience.id] ?? '';
          const isRemovingThis = isRemoving === experience.id;

          return (
            <div
              key={experience.id}
              className={`relative self-start rounded-2xl border transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <button
                type="button"
                onClick={() => openReflection(experience)}
                disabled={isSaving || Boolean(isRemoving) || isCompleting}
                aria-label={
                  isSelected
                    ? `Edit response: ${experience.title}`
                    : `Reflect on: ${experience.title}`
                }
                className="flex w-full flex-col items-start p-4 text-left sm:p-5"
              >
                <h3 className="font-heading text-xl font-medium leading-snug">
                  {experience.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {experience.description}
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
                      Add an example
                    </>
                  )}
                </div>

                {isSelected && response && (
                  <p className="mt-4 line-clamp-3 w-full border-t border-border/70 pt-3 text-sm leading-6 text-muted-foreground">
                    {response}
                  </p>
                )}
              </button>

              {isSelected && (
                <button
                  type="button"
                  aria-label={`Remove ${experience.title}`}
                  title="Remove this experience"
                  disabled={Boolean(isRemoving) || isSaving || isCompleting}
                  onClick={() => void removeExperience(experience.id)}
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

      {selectedExperiences.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedExperiences.length}{' '}
          {selectedExperiences.length === 1 ? 'experience' : 'experiences'}{' '}
          saved. You can still edit or remove them.
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

      {activeExperience && (
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
            aria-labelledby="experience-dialog-title"
            className="my-auto w-full max-w-2xl rounded-2xl border border-border bg-background p-5 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Your experience
                </p>

                <h2
                  id="experience-dialog-title"
                  className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
                >
                  {activeExperience.title}
                </h2>

                <p className="leading-7 text-muted-foreground">
                  {activeExperience.description}
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
                htmlFor="experience-evidence"
                className="block text-base font-medium leading-7"
              >
                {activeExperience.reflectionPrompt}
              </label>

              <Textarea
                id="experience-evidence"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={activeExperience.placeholder}
                className="min-h-[160px] resize-y text-base leading-7"
                disabled={isSaving}
                autoFocus
              />

              <p className="text-sm leading-6 text-muted-foreground">
                It does not need to be a big achievement. A specific example
                of something you experienced, did, or learned is enough.
              </p>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={saveReflection}
                  disabled={!canSave || isSaving}
                  className="h-12 gap-2 rounded-full px-8 text-base"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save experience
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
