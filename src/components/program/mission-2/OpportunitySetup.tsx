
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';

import { inferObservationDetails } from '@/actions/responses/mission2';
import { saveObservation } from '@/actions/observations';
import { observationsActions, $observations } from '@/lib/stores/observations';
import type {
  UserObservation,
  ProblemDetails,
} from '@/lib/types/observations';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type Choice = 'yes' | 'no' | null;
type Stage = 'intro' | 'describe' | 'review' | 'summary' | 'no-idea';

type IdeaDraft = {
  title: string;
  problem_details: ProblemDetails;
};

const DETAIL_FIELDS: {
  key: keyof ProblemDetails;
  label: string;
  placeholder: string;
}[] = [
  {
    key: 'who',
    label: 'Who experiences this problem?',
    placeholder: 'Who is affected or could benefit?',
  },
  {
    key: 'where',
    label: 'Where does it happen?',
    placeholder: 'A place, workplace, community, or online...',
  },
  {
    key: 'when',
    label: 'When does it happen?',
    placeholder: 'What situations bring it up?',
  },
  {
    key: 'workaround',
    label: 'What do people do about it today?',
    placeholder: 'Current workarounds, habits, or alternatives...',
  },
  {
    key: 'why_unsolved',
    label: 'Why might this problem remain unsolved?',
    placeholder: 'Only if your description gives us a clue...',
  },
  {
    key: 'current_option',
    label: 'What options already exist?',
    placeholder: 'Products, services, or other ways people handle it...',
  },
];

function getDetails(observation: UserObservation): ProblemDetails {
  const value = observation.problem_details;

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as ProblemDetails;
  }

  return {};
}

function titleFromText(text: string): string {
  const compact = text.trim().replace(/\s+/g, ' ');
  return compact.length > 80 ? `${compact.slice(0, 77)}...` : compact;
}

function makeDraft(
  title: string,
  details: ProblemDetails,
): IdeaDraft {
  return {
    title,
    problem_details: {
      ...details,
      is_existing: true,
    },
  };
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
  const [description, setDescription] = useState('');
  const [draft, setDraft] = useState<IdeaDraft | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionNotice, setExtractionNotice] = useState<string | null>(null);

  const existingObservation = useMemo(() => {
    const ids = observations.idsByNode[nodeKey] ?? [];

    return ids
      .map((id) => observations.byId[id])
      .find(
        (item): item is UserObservation =>
          Boolean(
            item &&
              item.domain === 'problem' &&
              getDetails(item).is_existing === true,
          ),
      );
  }, [observations.byId, observations.idsByNode, nodeKey]);

  const savedNoIdea = progress.payload?.hasExistingIdea === false;

  // Restore the saved idea or the previous "no idea" choice.
  // Neither path calls AI.
  useEffect(() => {
    if (isDirty) return;

    if (existingObservation) {
      setChoice('yes');
      setDescription(existingObservation.content ?? '');
      setDraft(
        makeDraft(
          existingObservation.title ?? '',
          getDetails(existingObservation),
        ),
      );
      setStage('summary');
      return;
    }

    if (savedNoIdea) {
      setChoice('no');
      setStage('no-idea');
    }
  }, [existingObservation, savedNoIdea, isDirty]);

  function choose(next: Exclude<Choice, null>) {
    setChoice(next);
    setError(null);
    setExtractionNotice(null);

    if (next === 'no') {
      setStage('no-idea');
      return;
    }

    setStage('describe');

    if (existingObservation && !isDirty) {
      setDescription(existingObservation.content ?? '');
      setDraft(
        makeDraft(
          existingObservation.title ?? '',
          getDetails(existingObservation),
        ),
      );
    } else if (!existingObservation) {
      setDescription('');
      setDraft(null);
    }
  }

  function editSavedIdea() {
    setChoice('yes');
    setDescription(existingObservation?.content ?? description);
    setError(null);
    setExtractionNotice(null);
    setStage('describe');
  }

  async function extractDetails() {
    const text = description.trim();

    if (!text) {
      setError('Tell us about your idea before continuing.');
      return;
    }

    setError(null);
    setExtractionNotice(null);

    const savedText = existingObservation?.content?.trim() ?? '';
    const isUnchanged = Boolean(existingObservation) && text === savedText;

    // If the description hasn't changed, reuse the saved extraction.
    if (isUnchanged && existingObservation) {
      setDraft(
        makeDraft(
          existingObservation.title ?? '',
          getDetails(existingObservation),
        ),
      );
      setStage('review');
      return;
    }

    setIsExtracting(true);

    const existingDetails = existingObservation
      ? getDetails(existingObservation)
      : {};

    const fallback = makeDraft(
      existingObservation?.title || titleFromText(text),
      existingDetails,
    );

    try {
      const result = await inferObservationDetails(text, nodeKey);

      const response = result as
        | {
            title?: string | null;
            problem_details?: ProblemDetails;
            data?: {
              title?: string | null;
              problem_details?: ProblemDetails;
            };
          }
        | null;

      const extracted =
        response?.data?.problem_details
          ? response.data
          : response;

      if (!extracted?.problem_details) {
        throw new Error('The extracted details were not in the expected format.');
      }

      setDraft({
        title: extracted.title?.trim() || fallback.title,
        problem_details: {
          ...existingDetails,
          ...extracted.problem_details,
          // This flag is the user's decision, not an AI inference.
          is_existing: true,
        },
      });
      setStage('review');
    } catch {
      // AI failure should not block the user from reviewing and saving.
      setDraft(fallback);
      setStage('review');
      setExtractionNotice(
        'We could not organise the details automatically. Review and edit the fields below before saving.',
      );
    } finally {
      setIsExtracting(false);
    }
  }

  function updateDetail(key: keyof ProblemDetails, value: string) {
    setDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        problem_details: {
          ...current.problem_details,
          [key]: value.trim() ? value : null,
          is_existing: true,
        },
      };
    });
  }

  async function handleContinueWithoutIdea() {
    setError(null);
    setIsSaving(true);

    try {
      await onComplete({
        completed: true,
        hasExistingIdea: false,
      });
    } catch {
      setError('Could not continue. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAndContinue() {
    setError(null);

    if (!draft || !description.trim()) {
      setError('Your idea description cannot be empty.');
      return;
    }

    if (!draft.title.trim()) {
      setError('Give your idea a short title.');
      return;
    }

    setIsSaving(true);

    try {
      const result = await saveObservation({
        ...(existingObservation
          ? { observation_id: existingObservation.id }
          : {}),
        title: draft.title.trim(),
        content: description.trim(),
        type: 'observation',
        domain: 'problem',
        focus: 'personal',
        source_node_key: nodeKey,
        problem_details: {
          ...draft.problem_details,
          is_existing: true,
        },
      });

      if (!result?.observation) {
        throw new Error('The idea was not returned after saving.');
      }

      observationsActions.upsert(result.observation as UserObservation);
      setIsDirty(false);

      await onComplete({
        completed: true,
        hasExistingIdea: true,
        observationId: result.observation.id,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not save your idea. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const visibleDetails = draft?.problem_details;

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          {node.title}
        </h2>

        {node.description && (
          <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
            {node.description}
          </p>
        )}

        {stage === 'intro' && node.prompt && (
          <p className="text-xl font-medium leading-8">{node.prompt}</p>
        )}
      </header>

      {stage === 'intro' && (
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => choose('yes')}
            className="w-full rounded-xl border border-border p-4 text-left transition hover:border-[#FF502F]"
          >
            <span className="block font-medium">Yes, I have an idea in mind</span>
            <span className="mt-1 block text-sm leading-6 text-muted-foreground">
              It can be rough, incomplete, or still taking shape.
            </span>
          </button>

          <button
            type="button"
            onClick={() => choose('no')}
            className="w-full rounded-xl border border-border p-4 text-left transition hover:border-[#FF502F]"
          >
            <span className="block font-medium">No, not yet</span>
            <span className="mt-1 block text-sm leading-6 text-muted-foreground">
              That's fine. You can discover ideas by noticing problems during
              this mission.
            </span>
          </button>
        </section>
      )}

      {stage === 'summary' && existingObservation && draft && (
        <section className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FF502F]/10 text-[#FF502F]">
              <span aria-hidden="true" className="text-xl">✦</span>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your starting idea
              </p>
              <h3 className="text-xl font-semibold leading-7">
                {existingObservation.title}
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">The idea</h4>
            <p className="whitespace-pre-line text-base leading-7">
              {existingObservation.content}
            </p>
          </div>

          {[
            { key: 'who', title: 'Who experiences this problem?' },
            { key: 'where', title: 'Where does it happen?' },
            { key: 'when', title: 'When does it happen?' },
            { key: 'workaround', title: 'What do people do about it today?' },
            { key: 'why_unsolved', title: 'Why might it remain unsolved?' },
            { key: 'current_option', title: 'What options already exist?' },
          ].map((section) => {
            const value = visibleDetails?.[
              section.key as keyof ProblemDetails
            ];

            if (typeof value !== 'string' || !value.trim()) return null;

            return (
              <div key={section.key} className="space-y-1">
                <h4 className="font-semibold">{section.title}</h4>
                <p className="whitespace-pre-line text-base leading-7 text-muted-foreground">
                  {value}
                </p>
              </div>
            );
          })}

          <p className="text-sm leading-6 text-muted-foreground">
            This is your starting point, not a final decision. You'll
            investigate this idea alongside the other problems you discover.
          </p>

          <div className="flex justify-end border-t border-border pt-5">
            <button
              type="button"
              onClick={editSavedIdea}
              className="min-h-11 rounded-lg border border-border px-5 py-3 font-medium transition hover:bg-muted"
            >
              Edit idea
            </button>
          </div>
        </section>
      )}

      {stage === 'no-idea' && (
        <section className="space-y-5">
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-base leading-7">
              That's fine. You don't need an idea to begin. Pay attention to
              the problems around you and see what you discover.
            </p>
          </div>

          <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => {
                setChoice(null);
                setStage('intro');
                setError(null);
              }}
              className="min-h-11 rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-muted"
            >
              Change answer
            </button>
            <button
              type="button"
              onClick={handleContinueWithoutIdea}
              disabled={isSaving}
              className="min-h-11 rounded-lg bg-[#FF502F] px-5 py-3 font-medium text-white disabled:opacity-60"
            >
              {isSaving ? 'Continuing…' : 'Continue'}
            </button>
          </div>
        </section>
      )}

      {stage === 'describe' && (
        <section className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="idea-description" className="block text-lg font-medium">
              Tell us about your idea in as much detail as you can.
            </label>
            <p className="text-base leading-7 text-muted-foreground">
              Use your own words. Describe what you want to make possible,
              who it affects, where and when it happens, and what people do
              about it today. Examples from your experience are helpful.
              You do not need all the answers yet.
            </p>
          </div>

          <textarea
            id="idea-description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setIsDirty(true);
              setError(null);
            }}
            rows={8}
            maxLength={10000}
            placeholder="Describe your idea and the problem behind it..."
            className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-base leading-7 outline-none focus-visible:ring-2 focus-visible:ring-[#FF502F]"
          />

          <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStage(existingObservation ? 'summary' : 'intro');
              }}
              className="min-h-11 rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-muted"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={extractDetails}
              disabled={isExtracting}
              className="min-h-11 rounded-lg bg-[#FF502F] px-5 py-3 font-medium text-white disabled:opacity-60"
            >
              {isExtracting
                ? 'Organising your description…'
                : existingObservation &&
                    description.trim() === existingObservation.content?.trim()
                  ? 'Review saved details'
                  : 'Extract details'}
            </button>
          </div>
        </section>
      )}

      {stage === 'review' && draft && (
        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Review what we understood</h3>
            <p className="text-base leading-7 text-muted-foreground">
              We have organised details from your description. Edit anything
              that is inaccurate, add what is missing, and leave anything
              uncertain blank.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="idea-title" className="block font-medium">
              Short title
            </label>
            <input
              id="idea-title"
              value={draft.title}
              maxLength={120}
              onChange={(event) => {
                setDraft({ ...draft, title: event.target.value });
                setIsDirty(true);
              }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#FF502F]"
            />
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Your original description</h4>
            <p className="whitespace-pre-line rounded-lg bg-muted/40 p-3 text-base leading-7">
              {description}
            </p>
            <button
              type="button"
              onClick={() => {
                setStage('describe');
                setError(null);
              }}
              className="text-sm font-medium text-[#FF502F] hover:underline"
            >
              Edit description
            </button>
          </div>

          <div className="space-y-5">
            {DETAIL_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <label
                  htmlFor={`detail-${field.key}`}
                  className="block font-medium"
                >
                  {field.label}
                </label>
                <textarea
                  id={`detail-${field.key}`}
                  rows={2}
                  value={String(draft.problem_details[field.key] ?? '')}
                  onChange={(event) => {
                    updateDetail(field.key, event.target.value);
                    setIsDirty(true);
                  }}
                  placeholder={field.placeholder}
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 leading-7 outline-none focus-visible:ring-2 focus-visible:ring-[#FF502F]"
                />
              </div>
            ))}
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            We have not judged whether this is a good business idea. Questions
            about whether you understand the problem, can reach people, or can
            solve it will be explored later.
          </p>

          {extractionNotice && (
            <p role="status" className="text-sm leading-6 text-muted-foreground">
              {extractionNotice}
            </p>
          )}

          <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => {
                setStage('describe');
                setError(null);
              }}
              disabled={isSaving}
              className="min-h-11 rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-muted disabled:opacity-60"
            >
              Back
            </button>

            <button
              type="button"
              onClick={saveAndContinue}
              disabled={isSaving}
              className="min-h-11 rounded-lg bg-[#FF502F] px-5 py-3 font-medium text-white disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save and continue'}
            </button>
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
