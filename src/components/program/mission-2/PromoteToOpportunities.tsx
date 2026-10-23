
'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  Check,
  CircleHelp,
  Loader2,
  Lightbulb,
} from 'lucide-react';

import { promoteObservationsToOpportunities } from '@/actions/opportunities';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $observations } from '@/lib/stores/observations';
import type {
  ProblemDetails,
  UserObservation,
} from '@/lib/types/observations';

const MAX_SELECTIONS = 3;

type QualificationAnswer = 'yes' | 'not_sure' | 'no';

function getProblemDetails(
  observation: UserObservation,
): ProblemDetails {
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

function isQualified(
  details: ProblemDetails,
): boolean {
  const valid = (answer: unknown) =>
    answer === 'yes' ||
    answer === 'not_sure' ||
    answer === 'no';

  return (
    valid(details.understands) &&
    valid(details.can_solve) &&
    valid(details.cares)
  );
}

function isExistingIdea(
  observation: UserObservation,
): boolean {
  return getProblemDetails(observation).is_existing === true;
}

function yesCount(details: ProblemDetails): number {
  return [
    details.understands,
    details.can_solve,
    details.cares,
  ].filter((answer) => answer === 'yes').length;
}

function hasNoAnswer(details: ProblemDetails): boolean {
  return (
    details.can_solve === 'no' ||
    details.cares === 'no'
  );
}

function QualificationIndicator({
  label,
  answer,
}: {
  label: string;
  answer: QualificationAnswer;
}) {
  const appearance = {
    yes: {
      symbol: '●',
      className: 'text-primary',
      description: 'Yes',
    },
    not_sure: {
      symbol: '◐',
      className: 'text-muted-foreground',
      description: 'Not sure',
    },
    no: {
      symbol: '○',
      className: 'text-muted-foreground',
      description: 'No',
    },
  }[answer];

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      title={`${label}: ${appearance.description}`}
      aria-label={`${label}: ${appearance.description}`}
    >
      <span
        aria-hidden="true"
        className={`text-base leading-none ${appearance.className}`}
      >
        {appearance.symbol}
      </span>
      {label}
    </span>
  );
}

function ObservationCard({
  observation,
  selected,
  disabled,
  onToggle,
}: {
  observation: UserObservation;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const details = getProblemDetails(observation);

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      className={[
        'w-full rounded-xl border p-4 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/[0.05]'
          : 'border-border hover:border-primary/50',
        disabled ? 'cursor-not-allowed opacity-50' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={[
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
            selected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border',
          ].join(' ')}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{observation.title}</span>

            {isExistingIdea(observation) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <Lightbulb className="h-3 w-3" />
                Your idea
              </span>
            )}
          </span>

          <span className="mt-2 block whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {observation.content}
          </span>

          {observation.context && (
            <span className="mt-2 block text-xs leading-5 text-muted-foreground">
              {observation.context}
            </span>
          )}

          <span className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <QualificationIndicator
              label="Understand"
              answer={details.understands as QualificationAnswer}
            />
            <QualificationIndicator
              label="Can solve"
              answer={details.can_solve as QualificationAnswer}
            />
            <QualificationIndicator
              label="Care"
              answer={details.cares as QualificationAnswer}
            />
          </span>
        </span>
      </div>
    </button>
  );
}

export function PromoteToOpportunities({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const observationState = useStore($observations);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmedNoIds, setConfirmedNoIds] = useState<string[]>([]);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the result if progress persistence fails, so a retry can
  // retry completion without inserting the same opportunities again
  // during this mounted session.
  const [createdOpportunityIds, setCreatedOpportunityIds] =
    useState<string[] | null>(null);

  const observations = useMemo(
    () => Object.values(observationState.byId),
    [observationState.byId],
  );

  const alreadyCompletedIds = useMemo(
    () =>
      Array.isArray(progress.payload?.opportunity_ids)
        ? (progress.payload.opportunity_ids as string[])
        : [],
    [progress.payload],
  );

  const { qualified, skipped } = useMemo(() => {
    const problemObservations = observations.filter(
      (item) =>
        item.type === 'observation' &&
        item.domain === 'problem',
    );

    const qualifiedItems = problemObservations
      .filter((item) => isQualified(getProblemDetails(item)))
      .sort((a, b) => {
        const aDetails = getProblemDetails(a);
        const bDetails = getProblemDetails(b);

        // Prioritise more "yes" answers, then whether the user cares.
        const scoreDifference =
          yesCount(bDetails) - yesCount(aDetails);

        if (scoreDifference !== 0) return scoreDifference;

        if (aDetails.cares !== bDetails.cares) {
          if (aDetails.cares === 'yes') return -1;
          if (bDetails.cares === 'yes') return 1;
        }

        return (
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
        );
      });

    return {
      qualified: qualifiedItems,
      skipped: problemObservations.filter(
        (item) => !isQualified(getProblemDetails(item)),
      ),
    };
  }, [observations]);

  const [showSkipped, setShowSkipped] = useState(false);

  const selectedObservations = selectedIds
    .map((id) => observationState.byId[id])
    .filter(
      (item): item is UserObservation => Boolean(item),
    );

  const pendingConfirmation = selectedObservations.find(
    (item) =>
      hasNoAnswer(getProblemDetails(item)) &&
      !confirmedNoIds.includes(item.id),
  );

  function toggleObservation(id: string) {
    if (completing || createdOpportunityIds) return;

    setError(null);

    setSelectedIds((current) => {
      if (current.includes(id)) {
        setConfirmedNoIds((confirmed) =>
          confirmed.filter((confirmedId) => confirmedId !== id),
        );

        return current.filter((selectedId) => selectedId !== id);
      }

      if (current.length >= MAX_SELECTIONS) return current;

      return [...current, id];
    });
  }

  function confirmKeepingObservation(id: string) {
    setConfirmedNoIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  }

  function swapObservation(id: string) {
    setConfirmedNoIds((current) =>
      current.filter((confirmedId) => confirmedId !== id),
    );

    setSelectedIds((current) =>
      current.filter((selectedId) => selectedId !== id),
    );
  }

  async function handleContinue() {
    if (completing) return;

    if (selectedIds.length !== MAX_SELECTIONS) {
      setError('Choose exactly three observations to continue.');
      return;
    }

    if (pendingConfirmation) {
      setError('Please confirm your selection before continuing.');
      return;
    }

    setCompleting(true);
    setError(null);

    try {
      let opportunityIds = createdOpportunityIds;

      if (!opportunityIds) {
        const result =
          await promoteObservationsToOpportunities(selectedIds);

        if (
          !result.success ||
          result.opportunities.length !== MAX_SELECTIONS
        ) {
          throw new Error(
            'We could not confirm that all three opportunities were created. Please try again.',
          );
        }

        opportunityIds = result.opportunities.map(
          (opportunity) => opportunity.id,
        );

        setCreatedOpportunityIds(opportunityIds);
      }

      await onComplete({
        completed: true,
        opportunity_ids: opportunityIds,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'We could not save your choices. Please try again.',
      );
    } finally {
      setCompleting(false);
    }
  }

  if (!observationState.isHydrated) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your observations…
      </div>
    );
  }

  const selectionComplete = selectedIds.length === MAX_SELECTIONS;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-7">
      <header className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">
          {node.title}
        </h2>

        {node.description && (
          <p className="whitespace-pre-wrap text-base leading-7 text-muted-foreground">
            {node.description}
          </p>
        )}

        {node.prompt && (
          <p className="text-base leading-7">{node.prompt}</p>
        )}
      </header>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4">
        <div>
          <p className="font-medium">
            Choose three problems to investigate
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            These are candidates worth exploring, not commitments to build a business.
          </p>
        </div>

        <span
          className={[
            'shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums',
            selectionComplete
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground',
          ].join(' ')}
          aria-live="polite"
        >
          {selectedIds.length} of {MAX_SELECTIONS}
        </span>
      </div>

      {qualified.length === 0 ? (
        <section className="rounded-xl border border-border p-5">
          <p className="font-medium">
            No qualified observations yet
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Go back to the qualification step and answer all three questions for your problem observations. Once they are qualified, you can choose three to take forward.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">
              Your problem observations
            </h3>
            <span className="text-xs text-muted-foreground">
              Sorted by your answers
            </span>
          </div>

          {qualified.map((observation) => {
            const selected = selectedIds.includes(observation.id);
            const selectionLimitReached =
              selectedIds.length >= MAX_SELECTIONS;

            return (
              <ObservationCard
                key={observation.id}
                observation={observation}
                selected={selected}
                disabled={
                  completing ||
                  Boolean(createdOpportunityIds) ||
                  (!selected && selectionLimitReached)
                }
                onToggle={() => toggleObservation(observation.id)}
              />
            );
          })}

          {selectedIds.length === MAX_SELECTIONS && (
            <p className="text-sm text-muted-foreground">
              Three is plenty. Unselect one to swap your selection.
            </p>
          )}
        </section>
      )}

      {skipped.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setShowSkipped((value) => !value)}
            aria-expanded={showSkipped}
            className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/30"
          >
            <span>
              <span className="block font-medium">
                Skipped or unfinished
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {skipped.length} observation{skipped.length === 1 ? '' : 's'} still need{skipped.length === 1 ? 's' : ''} all three answers
              </span>
            </span>
            <CircleHelp className="h-5 w-5 shrink-0 text-muted-foreground" />
          </button>

          {showSkipped && (
            <div className="space-y-3 border-t border-border p-4">
              {skipped.map((observation) => (
                <div key={observation.id} className="rounded-lg bg-muted/20 p-3">
                  <p className="font-medium">{observation.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {observation.content}
                  </p>
                </div>
              ))}
              <p className="text-sm leading-6 text-muted-foreground">
                These stay as observations. You can qualify them before choosing which problems to investigate.
              </p>
            </div>
          )}
        </section>
      )}

      <p className="text-sm leading-6 text-muted-foreground">
        The rest stay as observations. You can return to them later.
      </p>

      {pendingConfirmation && (
        <section className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="space-y-2">
              <p className="font-medium">
                You said you {getProblemDetails(pendingConfirmation).cares === 'no' ? "don't care about" : "may not be able to solve"} this problem. Still want to look into it?
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Your answers are a guide, not a rule. You can keep it if you have a reason to explore it.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => confirmKeepingObservation(pendingConfirmation.id)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Yes, keep it
                </button>
                <button
                  type="button"
                  onClick={() => swapObservation(pendingConfirmation.id)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40"
                >
                  Swap it
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p>{error}</p>
        </div>
      )}

      <footer className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
        <p className="mr-auto text-sm text-muted-foreground">
          {selectionComplete
            ? 'Ready to take these three forward.'
            : `Select ${MAX_SELECTIONS - selectedIds.length} more to continue.`}
        </p>

        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={
            completing ||
            !selectionComplete ||
            Boolean(pendingConfirmation) ||
            qualified.length < MAX_SELECTIONS
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {completing && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {completing ? 'Saving…' : 'Create opportunities and continue'}
        </button>
      </footer>
    </div>
  );
}
