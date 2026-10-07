'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { updateUserProgramContext } from '@/actions/user-context';
import { userContextActions, $userContext } from '@/lib/stores/user-context';

type ExperienceEntry = {
  id: string;
  title: string;
  evidence: string;
};

type ExperienceContext = {
  items: ExperienceEntry[];
};

const EXPERIENCES = [
  {
    id: 'industry',
    title: 'Worked in an industry',
    description: 'You have spent enough time around an industry to understand how some part of it actually works.',
  },
  {
    id: 'customers',
    title: 'Dealt with a particular kind of customer',
    description: 'You have spent time understanding, serving, helping, or selling to a particular kind of person.',
  },
  {
    id: 'repeated_problem',
    title: 'Solved a problem repeatedly',
    description: 'You have encountered the same kind of problem often enough to learn something about it.',
  },
  {
    id: 'built_from_scratch',
    title: 'Built something from scratch',
    description: 'You have started with very little and figured out how to create something that worked.',
  },
  {
    id: 'run_project',
    title: 'Run an event or project',
    description: 'You have had to coordinate people, resources, deadlines, or moving parts to make something happen.',
  },
  {
    id: 'managed_resources',
    title: 'Managed money or limited resources',
    description: 'You have had to make decisions when money, time, people, or other resources were limited.',
  },
  {
    id: 'failure',
    title: 'Dealt with failure or a setback',
    description: 'Something did not work out, and you had to figure out what to do next.',
  },
  {
    id: 'community',
    title: 'Been part of a community',
    description: 'You have been closely involved with a group of people who share an interest, identity, profession, or place.',
  },
  {
    id: 'seen_business',
    title: 'Seen how a business or industry works',
    description: 'You have had a close enough view to notice how people buy, sell, deliver, compete, or make decisions.',
  },
  {
    id: 'lived_problem',
    title: 'Personally experienced a problem',
    description: 'You have experienced a problem yourself rather than only hearing about it from someone else.',
  },
  {
    id: 'constraints',
    title: 'Worked around constraints',
    description: 'You have had to get something done despite limited money, time, information, access, or other resources.',
  },
  {
    id: 'figure_it_out',
    title: 'Figured something out without much help',
    description: 'You have had to navigate something unfamiliar and find your own way through it.',
  },
];

function getSavedExperiences(
  progress: NodeComponentProps['progress']
): ExperienceEntry[] {
  const context = $userContext.get().userContext?.experience as
    | ExperienceContext
    | null
    | undefined;

  if (context && Array.isArray(context.items)) {
    return context.items;
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
  const savedExperiences = getSavedExperiences(progress);

  const [items, setItems] = useState<ExperienceEntry[]>(savedExperiences);

  const [selectedIds, setSelectedIds] = useState<string[]>(
    savedExperiences.map((item) => item.id)
  );

  const [isCommitted, setIsCommitted] = useState(
    savedExperiences.length > 0 || progress.payload?.completed === true
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSelection = (id: string) => {
    if (isCommitted && !isEditing) return;

    setSelectedIds((current) => {
      if (current.includes(id)) {
        setItems((existing) => existing.filter((item) => item.id !== id));
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  };

  const getExperience = (id: string) =>
    EXPERIENCES.find((experience) => experience.id === id);

  const getEvidence = (id: string) =>
    items.find((item) => item.id === id)?.evidence ?? '';

  const updateEvidence = (id: string, evidence: string) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === id);
      const experience = getExperience(id);

      if (!experience) return current;

      if (existing) {
        return current.map((item) =>
          item.id === id ? { ...item, evidence } : item
        );
      }

      return [
        ...current,
        {
          id,
          title: experience.title,
          evidence,
        },
      ];
    });
  };

  const validItems = selectedIds
    .map((id) => {
      const experience = getExperience(id);
      const evidence = getEvidence(id).trim();

      if (!experience || evidence.length < 10) return null;

      return {
        id: experience.id,
        title: experience.title,
        evidence,
      };
    })
    .filter((item): item is ExperienceEntry => item !== null);

  const canSave =
    selectedIds.length > 0 &&
    selectedIds.every((id) => getEvidence(id).trim().length >= 10);

  async function handleSave() {
    if (!canSave || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const experience: ExperienceContext = {
        items: validItems,
      };

      const result = await updateUserProgramContext({
        experience,
      });

      userContextActions.updateContextLocally(result.userContext);

      setItems(validItems);
      setSelectedIds(validItems.map((item) => item.id));
      setIsCommitted(true);
      setIsEditing(false);
    } catch (err) {
      console.error('[EXPERIENCE MINER]', err);
      setError('Something went wrong saving your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onComplete({
        experience: {
          items,
        },
        completed: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit() {
    setIsEditing(true);
    setIsCommitted(false);
  }

  return (
    <div className="w-full space-y-10">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'What have you already figured out?'}
        </h2>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          You may not have started a business before. But you have lived through
          things, solved problems, worked with people, and figured things out.
          Some of that experience may matter more than you realise.
        </p>
      </div>

      {isCommitted && !isEditing ? (
        <div className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-medium">
              These are things you have already lived through.
            </h3>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-heading text-xl font-medium">
                        {item.title}
                      </h4>

                      <p className="text-base leading-7 text-muted-foreground">
                        {item.evidence}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You don&apos;t need to call this business experience. It is simply
            what you already know because you have lived it.
          </p>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleEdit}
              disabled={isSubmitting}
              className="h-12 gap-2 rounded-full px-6 text-base"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>

            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="h-12 gap-2 rounded-full px-8 text-base"
            >
              {isSubmitting ? 'Moving forward...' : 'Continue'}
              {!isSubmitting && <ArrowRight className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <h3 className="text-xl font-medium">
              What have you already lived through or figured out?
            </h3>

            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Choose the experiences that genuinely apply to you. You don&apos;t
              need to choose everything.
            </p>
          </div>

          <div className="grid max-w-5xl gap-4 sm:grid-cols-2">
            {EXPERIENCES.map((option) => {
              const isSelected = selectedIds.includes(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleSelection(option.id)}
                  disabled={isSubmitting}
                  className={`group relative flex items-start rounded-2xl border p-6 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h4 className="font-heading text-xl font-medium">
                        {option.title}
                      </h4>

                      <p className="text-sm leading-6 text-muted-foreground">
                        {option.description}
                      </p>
                    </div>

                    <div
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedIds.length > 0 && (
            <div className="max-w-4xl space-y-8">
              <div className="space-y-3">
                <h3 className="text-xl font-medium">
                  Now tell us what you learned from it.
                </h3>

                <p className="text-base leading-7 text-muted-foreground">
                  Describe what happened and what you figured out, noticed, or
                  learned through the experience.
                </p>
              </div>

              <div className="space-y-8">
                {selectedIds.map((id) => {
                  const experience = getExperience(id);

                  if (!experience) return null;

                  return (
                    <div
                      key={id}
                      className="space-y-4 rounded-2xl border border-border bg-card p-6"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </div>

                        <div>
                          <h4 className="font-heading text-xl font-medium">
                            {experience.title}
                          </h4>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {experience.description}
                          </p>
                        </div>
                      </div>

                      <Textarea
                        value={getEvidence(id)}
                        onChange={(event) =>
                          updateEvidence(id, event.target.value)
                        }
                        placeholder="What happened? What did you figure out, notice, or learn?"
                        className="min-h-[140px] resize-none text-base leading-7"
                        disabled={isSubmitting}
                      />
                    </div>
                  );
                })}
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSave}
                  disabled={!canSave || isSubmitting}
                  className="h-12 rounded-full px-8 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save this'
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}