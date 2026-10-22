
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import {
  saveObservationQualification,
  
} from '@/actions/observations';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $observations, observationsActions } from '@/lib/stores/observations';
import type { UserObservation, QualificationAnswer,
  QualificationAnswers, } from '@/lib/types/observations';

const QUESTIONS: {
  key: keyof QualificationAnswers;
  title: string;
  helper: string;
}[] = [
  {
    key: 'understand',
    title: 'Do I understand this problem?',
    helper:
      'Have you seen it up close? Could you say who has it and what they do about it now?',
  },
  {
    key: 'can_solve',
    title: 'Could I do something about it?',
    helper:
      "Do you know how you'd go about solving it, or how you'd find out?",
  },
  {
    key: 'care',
    title: 'Do I care?',
    helper:
      'Would you still want to think about this if no one paid you?',
  },
];

const OPTIONS: { value: QualificationAnswer; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'not_sure', label: 'Not sure' },
  { value: 'no', label: 'No' },
];

function getQualification(
  observation: UserObservation,
): QualificationAnswers | null {
  const metadata = observation.metadata;

  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const qualification = (metadata as Record<string, unknown>).qualification;

  if (!qualification || typeof qualification !== 'object') {
    return null;
  }

  const value = qualification as Record<string, unknown>;

  if (
    !OPTIONS.some((option) => option.value === value.understand) ||
    !OPTIONS.some((option) => option.value === value.can_solve) ||
    !OPTIONS.some((option) => option.value === value.care)
  ) {
    return null;
  }

  return {
    understand: value.understand as QualificationAnswer,
    can_solve: value.can_solve as QualificationAnswer,
    care: value.care as QualificationAnswer,
  };
}

function getSavedQualificationCount(observations: UserObservation[]) {
  return observations.filter(getQualification).length;
}

export function ObservationQualification({
  node,
  onComplete,
}: NodeComponentProps) {
  const state = useStore($observations);

  const observations = useMemo(
    () =>
      Object.values(state.byId)
        .filter(
          (item) =>
            item.type === 'observation' && item.domain === 'problem',
        )
        .sort((a, b) => {
          const aDone = getQualification(a) !== null;
          const bDone = getQualification(b) !== null;

          if (aDone !== bDone) return aDone ? 1 : -1;

          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          );
        }),
    [state.byId],
  );

  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<QualificationAnswers>({
    understand: 'not_sure',
    can_solve: 'not_sure',
    care: 'not_sure',
  });
  const [selected, setSelected] = useState<Partial<QualificationAnswers>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const observation = observations[index];
  const saved = observation ? getQualification(observation) : null;

  useEffect(() => {
    if (!observation) return;

    const answers = getQualification(observation) ?? {
      understand: null,
      can_solve: null,
      care: null,
    };

    setSelected(answers);
    setDraft({
      understand: answers.understand ?? 'not_sure',
      can_solve: answers.can_solve ?? 'not_sure',
      care: answers.care ?? 'not_sure',
    });
    setError(null);
  }, [observation?.id, observation?.updated_at]);

  const qualifiedCount = getSavedQualificationCount(observations);
  const allQualified =
    observations.length > 0 && qualifiedCount === observations.length;

  async function saveAnswers() {
    if (!observation) return;

    setIsSaving(true);
    setError(null);

    try {
      const savedObservation = await saveObservationQualification(
        observation.id,
        draft,
      );

      observationsActions.upsert(savedObservation);
      setSelected(draft);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your answers.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function continueNode() {
    if (!allQualified) return;

    setIsCompleting(true);
    setError(null);

    try {
      await onComplete({
        completed: true,
        qualifiedObservationCount: qualifiedCount,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save your progress. Please try again.',
      );
    } finally {
      setIsCompleting(false);
    }
  }

  if (!state.isHydrated) {
    return <p className="text-sm text-muted-foreground">Loading your observations…</p>;
  }

  if (observations.length === 0) {
    return (
      <div className="space-y-4">
        <p>You don't have any problem observations to qualify yet.</p>
        <p className="text-sm text-muted-foreground">
          Add observations first, then come back to decide which are worth exploring.
        </p>
      </div>
    );
  }

  const isDraftComplete = QUESTIONS.every(
    (question) => selected[question.key] !== undefined &&
      selected[question.key] !== null,
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Observation {index + 1} of {observations.length}
          {' · '}
          {qualifiedCount} qualified
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${(qualifiedCount / observations.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {observation && (
        <article className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">{observation.title}</h2>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {observation.content}
            </p>

            {(() => {
              const details = observation.problem_details;

              if (!details || typeof details !== 'object' || Array.isArray(details)) {
                return null;
              }

              const values = details as Record<string, unknown>;

              return (
                <div className="space-y-2 text-sm">
                  {typeof values.who === 'string' && values.who && (
                    <p><strong>Who:</strong> {values.who}</p>
                  )}
                  {typeof values.workaround === 'string' && values.workaround && (
                    <p><strong>What they do today:</strong> {values.workaround}</p>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="space-y-6">
            {QUESTIONS.map((question, questionIndex) => (
              <section key={question.key} className="space-y-3">
                <div>
                  <h3 className="font-medium">
                    {questionIndex + 1}. {question.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {question.helper}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {OPTIONS.map((option) => {
                    const active = draft[question.key] === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isSaving}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            [question.key]: option.value,
                          }))
                        }
                        aria-pressed={active}
                        className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                          active
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <button
              type="button"
              disabled={index === 0 || isSaving}
              onClick={() => setIndex((current) => current - 1)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={saveAnswers}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Save answers
            </button>

            <button
              type="button"
              disabled={index >= observations.length - 1 || isSaving}
              onClick={() => setIndex((current) => current + 1)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>

          {saved && (
            <p className="text-sm text-muted-foreground">
              Your saved answers are loaded. Save again if you make changes.
            </p>
          )}
        </article>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-3 border-t pt-6">
        <p className="text-sm text-muted-foreground">
          {allQualified
            ? 'Every observation has been qualified. You can continue.'
            : `${observations.length - qualifiedCount} observation(s) still need answers saved.`}
        </p>

        <button
          type="button"
          disabled={!allQualified || isSaving || isCompleting}
          onClick={continueNode}
          className="w-full rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isCompleting ? 'Saving progress…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
