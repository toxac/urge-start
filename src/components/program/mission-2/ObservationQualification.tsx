
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import {
  updateProblemDetails,
  qualifyProblem,
} from '@/actions/observations';

import type { NodeComponentProps } from '@/components/program/componentRegistry';
import {
  $observations,
  observationsActions,
} from '@/lib/stores/observations';

import type {
  UserObservation,
  ProblemDetails,
  QualificationAnswer,
  QualificationAnswers,
} from '@/lib/types/observations';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const OPTIONS: { value: QualificationAnswer; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'not_sure', label: 'Not sure' },
  { value: 'no', label: 'No' },
];

type DetailDraft = {
  workaround: string;
  current_option: string;
  frequency: string;
  cost: string;
  why_unsolved: string;
  can_reach: '' | 'true' | 'false';
};

const EMPTY_DETAILS: DetailDraft = {
  workaround: '',
  current_option: '',
  frequency: '',
  cost: '',
  why_unsolved: '',
  can_reach: '',
};

const EMPTY_QUALIFICATION: QualificationAnswers = {
  understands: null,
  cares: null,
  can_solve: null,
};

function getDetails(observation: UserObservation): ProblemDetails {
  const details = observation.problem_details;

  if (
    details &&
    typeof details === 'object' &&
    !Array.isArray(details)
  ) {
    return details as ProblemDetails;
  }

  return {};
}

function getQualification(
  observation: UserObservation,
): QualificationAnswers | null {
  const details = getDetails(observation);

  const valid = (value: unknown) =>
    OPTIONS.some((option) => option.value === value);

  if (
    !valid(details.understands) ||
    !valid(details.cares) ||
    !valid(details.can_solve)
  ) {
    return null;
  }

  return {
    understands: details.understands as QualificationAnswer,
    cares: details.cares as QualificationAnswer,
    can_solve: details.can_solve as QualificationAnswer,
  };
}

function getSavedDetailDraft(observation: UserObservation): DetailDraft {
  const details = getDetails(observation);

  return {
    workaround: details.workaround ?? '',
    current_option: details.current_option ?? '',
    frequency: details.frequency ?? '',
    cost: details.cost ?? '',
    why_unsolved: details.why_unsolved ?? '',
    can_reach:
      details.can_reach === true
        ? 'true'
        : details.can_reach === false
          ? 'false'
          : '',
  };
}

function getSavedQualificationCount(observations: UserObservation[]) {
  return observations.filter(getQualification).length;
}

function TextField({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <Textarea
        id={id}
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function ObservationQualification({
  onComplete,
}: NodeComponentProps) {
  const state = useStore($observations);

  const observations = useMemo(
    () =>
      Object.values(state.byId)
        .filter(
          (item) =>
            item.type === 'observation' &&
            item.domain === 'problem',
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
  const [detailDraft, setDetailDraft] = useState<DetailDraft>(EMPTY_DETAILS);
  const [qualificationDraft, setQualificationDraft] =
    useState<QualificationAnswers>(EMPTY_QUALIFICATION);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const observation = observations[index];
  const savedQualification = observation
    ? getQualification(observation)
    : null;

  useEffect(() => {
    if (!observation) return;

    setDetailDraft(getSavedDetailDraft(observation));
    setQualificationDraft(
      getQualification(observation) ?? EMPTY_QUALIFICATION,
    );
    setError(null);
    setNotice(null);
  }, [observation?.id, observation?.updated_at]);

  const qualifiedCount = getSavedQualificationCount(observations);
  const allQualified =
    observations.length > 0 &&
    qualifiedCount === observations.length;

  function updateDetail<K extends keyof DetailDraft>(
    key: K,
    value: DetailDraft[K],
  ) {
    setDetailDraft((current) => ({ ...current, [key]: value }));
  }

  function updateQualification(
    key: keyof QualificationAnswers,
    value: QualificationAnswer,
  ) {
    setQualificationDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveAnswers() {
    if (!observation || isSaving || isCompleting) return;

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const detailsToSave: Partial<ProblemDetails> = {
        workaround: detailDraft.workaround.trim() || null,
        current_option: detailDraft.current_option.trim() || null,
        frequency: detailDraft.frequency.trim() || null,
        cost: detailDraft.cost.trim() || null,
        why_unsolved: detailDraft.why_unsolved.trim() || null,
        can_reach:
          detailDraft.can_reach === ''
            ? null
            : detailDraft.can_reach === 'true',
      };

      const detailsResult = await updateProblemDetails(
        observation.id,
        detailsToSave,
      );

      observationsActions.upsert(
        detailsResult.observation as UserObservation,
      );

      // Keep qualification judgements separate from descriptive details.
      const qualificationResult = await qualifyProblem(
        observation.id,
        qualificationDraft,
      );

      observationsActions.upsert(
        qualificationResult as UserObservation,
      );

      setNotice('Your problem details and qualification have been saved.');
    } catch (err) {
      console.error('[OBSERVATION QUALIFICATION] Save failed', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save your answers. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function continueNode() {
    if (!allQualified || isSaving || isCompleting) return;

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
    return (
      <p className="text-sm text-muted-foreground">
        Loading your observations…
      </p>
    );
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

  const details = observation ? getDetails(observation) : {};

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Observation {index + 1} of {observations.length}
          </p>
          <p className="text-sm text-muted-foreground">
            {qualifiedCount} of {observations.length} qualified
          </p>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${(qualifiedCount / observations.length) * 100}%`,
            }}
          />
        </div>
      </header>

      {observation && (
        <article className="space-y-8">
          <section className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              The observation
            </p>
            <h2 className="text-2xl font-semibold">
              {observation.title}
            </h2>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {observation.content}
            </p>

            {observation.context && (
              <p className="text-sm text-muted-foreground">
                {observation.context}
              </p>
            )}

            {(details.who || details.where || details.when) && (
              <div className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
                {details.who && <p><strong>Who:</strong> {details.who}</p>}
                {details.where && <p><strong>Where:</strong> {details.where}</p>}
                {details.when && <p><strong>When:</strong> {details.when}</p>}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                1. Do I understand the problem?
              </h3>
              <p className="text-sm text-muted-foreground">
                Think about what people experience and what they do about it today.
                It's okay if you don't know all the answers yet.
              </p>
            </div>

            <TextField
              id="workaround"
              label="How do people deal with this today?"
              value={detailDraft.workaround}
              onChange={(value) => updateDetail('workaround', value)}
              placeholder="Describe workarounds or what people do when the problem occurs."
            />

            <TextField
              id="current-option"
              label="What alternatives do they use?"
              value={detailDraft.current_option}
              onChange={(value) => updateDetail('current_option', value)}
              placeholder="Existing products, services, or other ways they handle it."
            />

            <TextField
              id="frequency"
              label="How often does it happen?"
              value={detailDraft.frequency}
              onChange={(value) => updateDetail('frequency', value)}
              placeholder="e.g. Every day, once a month, or only in certain situations."
            />

            <QualificationQuestion
              title="Do I understand this problem well enough?"
              helper="Consider what you know about who experiences it, when it happens, and how they deal with it."
              value={qualificationDraft.understands}
              onChange={(value) => updateQualification('understands', value)}
            />
          </section>

          <section className="space-y-5 border-t pt-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                2. Do people care about this problem?
              </h3>
              <p className="text-sm text-muted-foreground">
                Look for signs that this problem matters to the people experiencing it.
              </p>
            </div>

            <TextField
              id="cost"
              label="What does the problem cost people?"
              hint="Consider money, time, effort, lost opportunities, or frustration."
              value={detailDraft.cost}
              onChange={(value) => updateDetail('cost', value)}
              placeholder="What consequences does the problem create?"
            />

            <TextField
              id="why-unsolved"
              label="Why might existing solutions be inadequate?"
              value={detailDraft.why_unsolved}
              onChange={(value) => updateDetail('why_unsolved', value)}
              placeholder="What seems to be missing or not working well enough?"
            />

            <QualificationQuestion
              title="Do I have reason to believe people care?"
              helper="Separate what you have observed or heard from what you are assuming."
              value={qualificationDraft.cares}
              onChange={(value) => updateQualification('cares', value)}
            />
          </section>

          <section className="space-y-5 border-t pt-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                3. Could I do something about it?
              </h3>
              <p className="text-sm text-muted-foreground">
                You don't need a complete solution yet. Consider whether you can
                reach the people affected and imagine a useful way forward.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="can-reach">
                Can I reach the people experiencing this?
              </Label>
              <p className="text-sm text-muted-foreground">
                Choose “Not sure yet” if you haven't established access.
              </p>
              <select
                id="can-reach"
                value={detailDraft.can_reach}
                onChange={(event) =>
                  updateDetail(
                    'can_reach',
                    event.target.value as DetailDraft['can_reach'],
                  )
                }
                disabled={isSaving || isCompleting}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Not sure yet</option>
                <option value="true">Yes, I can reach them</option>
                <option value="false">No, not currently</option>
              </select>
            </div>

            <QualificationQuestion
              title="Do I see a plausible way to help?"
              helper="You can have an early idea, or know what you need to learn to find a solution. You don't need to have built it."
              value={qualificationDraft.can_solve}
              onChange={(value) => updateQualification('can_solve', value)}
            />
          </section>

          <footer className="space-y-4 border-t pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={index === 0 || isSaving || isCompleting}
                onClick={() => setIndex((current) => current - 1)}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                disabled={isSaving || isCompleting}
                onClick={saveAnswers}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {isSaving ? 'Saving…' : 'Save qualification'}
              </button>

              <button
                type="button"
                disabled={
                  index >= observations.length - 1 ||
                  isSaving ||
                  isCompleting
                }
                onClick={() => setIndex((current) => current + 1)}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>

            {savedQualification && (
              <p className="text-sm text-muted-foreground">
                Your qualification judgements are saved. Save again if you change them.
              </p>
            )}
          </footer>
        </article>
      )}

      {notice && (
        <p className="rounded-md bg-muted p-3 text-sm" role="status">
          {notice}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <section className="space-y-3 border-t pt-6">
        <p className="text-sm text-muted-foreground">
          {allQualified
            ? 'Every observation has saved qualification judgements.'
            : `${observations.length - qualifiedCount} observation(s) still need qualification judgements saved.`}
        </p>

        <button
          type="button"
          disabled={!allQualified || isSaving || isCompleting}
          onClick={continueNode}
          className="w-full rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isCompleting ? 'Saving progress…' : 'Continue'}
        </button>
      </section>
    </div>
  );
}

function QualificationQuestion({
  title,
  helper,
  value,
  onChange,
}: {
  title: string;
  helper: string;
  value: QualificationAnswer | null;
  onChange: (value: QualificationAnswer) => void;
}) {
  return (
    <section className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1">
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{helper}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => {
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
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
  );
}
