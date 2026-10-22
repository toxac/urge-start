
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';

import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { ObservedProblemExtractionForm } from '@/components/program/common/ObservedProblemExtractionForm';
import {
  observationsActions,
  $observations,
} from '@/lib/stores/observations';
import type { UserObservation } from '@/lib/types/observations';

type Choice = 'yes' | 'no' | null;
type Stage = 'intro' | 'capture' | 'summary' | 'no-idea';

function isExistingIdea(observation: UserObservation): boolean {
  const details = observation.problem_details;

  return (
    details !== null &&
    typeof details === 'object' &&
    !Array.isArray(details) &&
    details.is_existing === true
  );
}

export function OpportunitySetup({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const observations = useStore($observations);

  const [choice, setChoice] = useState<Choice>(null);
  const [stage, setStage] = useState<Stage>('intro');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [savedObservation, setSavedObservation] =
    useState<UserObservation | null>(null);
  const [hasRestored, setHasRestored] = useState(false);

  const existingObservation = useMemo(() => {
    const ids = observations.idsByNode[nodeKey] ?? [];

    return (
      ids
        .map((id) => observations.byId[id])
        .find(
          (item): item is UserObservation =>
            Boolean(
              item &&
                item.domain === 'problem' &&
                isExistingIdea(item),
            ),
        ) ?? null
    );
  }, [observations.byId, observations.idsByNode, nodeKey]);

  const savedNoIdea = progress.payload?.hasExistingIdea === false;

  // Restore the user's saved choice when revisiting this node.
  // This does not run extraction.
  useEffect(() => {
    if (hasRestored) return;

    if (existingObservation) {
      setSavedObservation(existingObservation);
      setChoice('yes');
      setStage('summary');
      setHasRestored(true);
      return;
    }

    if (savedNoIdea) {
      setChoice('no');
      setStage('no-idea');
      setHasRestored(true);
      return;
    }

    setHasRestored(true);
  }, [existingObservation, savedNoIdea, hasRestored]);

  function choose(next: Exclude<Choice, null>) {
    setChoice(next);
    setError(null);

    if (next === 'no') {
      setStage('no-idea');
      return;
    }

    if (existingObservation) {
      setSavedObservation(existingObservation);
      setStage('summary');
      return;
    }

    setStage('capture');
  }

  async function handleContinueWithoutIdea() {
    setIsSaving(true);
    setError(null);

    try {
      await onComplete({
        completed: true,
        hasExistingIdea: false,
      });
    } catch {
      setError(
        'We could not save your progress. Please try continuing again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleObservationSaved(
    observation: UserObservation,
    failedToExtract = false,
  ) {
    // The original observation has already been saved by the shared form.
    // Keep the local store in sync and preserve the original title/content.
    observationsActions.upsert(observation);
    setSavedObservation(observation);
    setChoice('yes');
    setExtractionFailed(failedToExtract);
    setError(null);

    try {
      await onComplete({
        completed: true,
        hasExistingIdea: true,
        observationId: observation.id,
      });
    } catch {
      setError(
        'Your idea is saved, but we could not continue. You can try continuing again.',
      );
      setStage('summary');
    }
  }

  async function handleContinueWithSavedIdea() {
    if (!savedObservation) {
      setError(
        'We could not find your saved idea. Please go back and try again.',
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onComplete({
        completed: true,
        hasExistingIdea: true,
        observationId: savedObservation.id,
      });
    } catch {
      setError(
        'Your idea is saved, but we could not continue. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!hasRestored) {
    return (
      <div className="py-8 text-sm text-muted-foreground" role="status">
        Loading your progress…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">
          {node.title}
        </h2>

        {node.description && (
          <p className="text-base leading-7 text-muted-foreground">
            {node.description}
          </p>
        )}

        {node.prompt && (
          <p className="text-base leading-7">{node.prompt}</p>
        )}
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          {error}
        </div>
      )}

      {stage === 'intro' && (
        <section className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Do you already have an idea?
            </h3>
            <p className="leading-7 text-muted-foreground">
              You might have noticed a problem you want to solve, or have
              an idea for something you would like to build. You can start
              with that idea, or begin by exploring problems around you.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => choose('yes')}
              className="rounded-xl border p-5 text-left transition-colors hover:border-primary"
            >
              <span className="block font-semibold">
                Yes, I have an idea
              </span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                I have something in mind that I would like to explore.
              </span>
            </button>

            <button
              type="button"
              onClick={() => choose('no')}
              className="rounded-xl border p-5 text-left transition-colors hover:border-primary"
            >
              <span className="block font-semibold">
                No, not yet
              </span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                I want to discover problems and opportunities first.
              </span>
            </button>
          </div>
        </section>
      )}

      {stage === 'capture' && (
        <section className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Tell us about your idea
            </h3>
            <p className="leading-7 text-muted-foreground">
              Describe it in your own words. It does not need to be
              polished or fully thought through. We will keep your original
              description as you write it.
            </p>
          </div>

          <ObservedProblemExtractionForm
            sourceNodeKey={nodeKey}
            focus="personal"
            isExistingIdea
            onSaved={handleObservationSaved}
            onCancel={() => {
              setError(null);
              setStage('intro');
            }}
          />
        </section>
      )}

      {stage === 'summary' && savedObservation && (
        <section className="space-y-6">
          <div className="rounded-xl border p-5 sm:p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                YOUR STARTING IDEA
              </p>
              <h3 className="text-xl font-semibold">
                {savedObservation.title}
              </h3>
              <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
                {savedObservation.content}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Your idea is saved</h4>

            <p className="text-base leading-7 text-muted-foreground">
              During this mission, you will learn to notice problems
              around you and evaluate which ones are worth working on —
              including this idea.
            </p>

            <p className="text-sm leading-6 text-muted-foreground">
              You will explore the details of your idea during the
              observation stage.
            </p>

            {extractionFailed && (
              <p
                role="status"
                className="text-sm leading-6 text-muted-foreground"
              >
                We could not organise the details automatically this time.
                Your idea is safe, and you can explore and add those details
                during the observation stage.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStage('intro');
              }}
              disabled={isSaving}
              className="rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleContinueWithSavedIdea}
              disabled={isSaving}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Continuing…' : 'Continue'}
            </button>
          </div>
        </section>
      )}

      {stage === 'no-idea' && (
        <section className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              That is absolutely fine
            </h3>
            <p className="leading-7 text-muted-foreground">
              You do not need to arrive with a business idea. We will
              start by paying attention to problems people experience in
              everyday life and work. An opportunity can emerge from
              something you notice.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStage('intro');
              }}
              disabled={isSaving}
              className="rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Change my answer
            </button>

            <button
              type="button"
              onClick={handleContinueWithoutIdea}
              disabled={isSaving}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Continuing…' : 'Continue'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
