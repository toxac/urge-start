
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

import { getNodeAILogs } from '@/actions/ai-logs';
import { generateObservationPatterns } from '@/actions/responses/mission2';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $observations } from '@/lib/stores/observations';
import { $userContext } from '@/lib/stores/user-context';
import type {
  ObservationPatternsInput,
  ObservationPatternsResult,
} from '@/lib/types/ai';
import type {
  ProblemDetails,
  UserObservation,
} from '@/lib/types/observations';

const NODE_KEY = 'm2-q1-reveal';
const MAX_OBSERVATIONS = 50;

type SavedLog = Awaited<ReturnType<typeof getNodeAILogs>>[number];
type UserProgramContext = NonNullable<
  ReturnType<typeof $userContext.get>['userContext']
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function getProblemDetails(observation: UserObservation): ProblemDetails {
  const details = parseJson(observation.problem_details);
  return isRecord(details) ? (details as ProblemDetails) : {};
}

function isQualified(details: ProblemDetails): boolean {
  const isValidAnswer = (answer: unknown) =>
    answer === 'yes' || answer === 'not_sure' || answer === 'no';

  return (
    isValidAnswer(details.understands) &&
    isValidAnswer(details.can_solve) &&
    isValidAnswer(details.cares)
  );
}

function toJson(
  value: unknown,
): ObservationPatternsInput['userContext']['capabilities'] {
  return (parseJson(value) ?? {}) as ObservationPatternsInput['userContext']['capabilities'];
}

function buildInput(
  records: UserObservation[],
  context: UserProgramContext,
): ObservationPatternsInput {
  const observations = records
    .filter(
      (item) => item.type === 'observation' && item.domain === 'problem',
    )
    .sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime(),
    );

  if (observations.length === 0) {
    throw new Error(
      'Add at least one problem observation before exploring patterns.',
    );
  }

  // Check every problem observation, not only the first 50.
  // A newly added, unqualified observation must block progression.
  const unqualified = observations.filter(
    (item) => !isQualified(getProblemDetails(item)),
  );

  if (unqualified.length > 0) {
    throw new Error(
      `${unqualified.length} problem observation(s) still need qualification. Return to the previous step and answer all three questions first.`,
    );
  }

  return {
    observations: observations.slice(0, MAX_OBSERVATIONS).map((item) => {
      const problemDetails = getProblemDetails(item);

      return {
        id: item.id,
        title: item.title,
        content: item.content,
        context: item.context,
        focus: item.focus,
        problemDetails,
      };
    }),
    userContext: {
      capabilities: toJson(context.capabilities),
      experience: toJson(context.experience),
      motivations: toJson(context.motivations),
      resources: toJson(context.resources),
      desiredFuture: toJson(context.desired_future),
      networkContext: toJson(context.network_context),
    },
  };
}

function parseSavedResult(
  log: SavedLog,
): ObservationPatternsResult | null {
  if (log.purpose !== 'observation_patterns') return null;

  const response = parseJson(log.response);
  if (!isRecord(response)) return null;

  // The AI logger stores responses as { content: "<JSON string>" }.
  const candidate = parseJson(response.content ?? response);

  if (
    !isRecord(candidate) ||
    typeof candidate.overallReflection !== 'string' ||
    !Array.isArray(candidate.patterns) ||
    !Array.isArray(candidate.experienceConnections) ||
    !Array.isArray(candidate.tensions) ||
    !Array.isArray(candidate.questions)
  ) {
    return null;
  }

  return candidate as unknown as ObservationPatternsResult;
}

function Evidence({
  ids,
  observations,
}: {
  ids: string[];
  observations: Record<string, UserObservation>;
}) {
  const items = ids
    .map((id) => observations[id])
    .filter((item): item is UserObservation => Boolean(item));

  if (items.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.id}
          title={item.content}
          className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
        >
          “{item.title}”
        </span>
      ))}
    </div>
  );
}

export function ObservationPatternsReveal({
  onComplete,
}: NodeComponentProps) {
  const observationState = useStore($observations);
  const contextState = useStore($userContext);

  const records = useMemo(
    () => Object.values(observationState.byId),
    [observationState.byId],
  );

  // Keep the latest hydrated data available to stable callbacks.
  // This prevents the initial-load effect from being cancelled and
  // restarted whenever the observations store changes.
  const recordsRef = useRef(records);
  const contextRef = useRef(contextState.userContext);

  recordsRef.current = records;
  contextRef.current = contextState.userContext;

  const started = useRef(false);

  const [result, setResult] = useState<ObservationPatternsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const generate = useCallback(async (isRegeneration: boolean) => {
    const context = contextRef.current;

    if (!context) {
      setError(
        'Your program context is not available yet. Please try again.',
      );
      setLoading(false);
      setRegenerating(false);
      return;
    }

    setError(null);
    setNotice(null);

    if (isRegeneration) {
      setRegenerating(true);
    } else {
      setLoading(true);
    }

    try {
      const input = buildInput(recordsRef.current, context);
      const freshResult = await generateObservationPatterns(input, NODE_KEY);

      setResult(freshResult);

      if (isRegeneration) {
        setNotice('Your reflection has been refreshed.');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'We could not prepare your reflection. Please try again.',
      );
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, []);

  // Load the latest saved reflection once the required stores are hydrated.
  // The stable generate callback and one-time guard prevent store updates
  // from cancelling the initial load or triggering duplicate generations.
  useEffect(() => {
    if (
      started.current ||
      !observationState.isHydrated ||
      !contextState.isHydrated
    ) {
      return;
    }

    started.current = true;

    async function loadSavedOrGenerate() {
      setLoading(true);
      setError(null);

      try {
        const logs = await getNodeAILogs(NODE_KEY);

        const saved = logs.find(
          (log) =>
            log.purpose === 'observation_patterns' &&
            parseSavedResult(log) !== null,
        );

        const savedResult = saved ? parseSavedResult(saved) : null;

        if (savedResult) {
          setResult(savedResult);
          setLoading(false);
          return;
        }

        await generate(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'We could not load your saved reflection. Please try again.',
        );
        setLoading(false);
      }
    }

    void loadSavedOrGenerate();
  }, [
    observationState.isHydrated,
    contextState.isHydrated,
    generate,
  ]);

  async function continueNode() {
    if (completing || regenerating || !result) return;

    setCompleting(true);
    setError(null);

    try {
      await onComplete({
        completed: true,
        source: 'observation_patterns',
      });
    } catch {
      setError(
        'We could not save your progress. Please try continuing again.',
      );
    } finally {
      setCompleting(false);
    }
  }

  const hasMore = Boolean(
    result &&
      (result.patterns.length > 1 ||
        result.experienceConnections.length > 0 ||
        result.tensions.length > 0 ||
        result.questions.length > 0),
  );

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="mt-1 rounded-xl bg-primary/10 p-2.5 text-primary">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>

        <div>
          <p className="text-sm font-medium text-primary">
            A moment to reflect
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            What keeps showing up?
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            These are possibilities to explore, not conclusions. Keep what
            feels grounded in your experience, and question anything that
            does not.
          </p>
        </div>
      </header>

      {loading ? (
        <div
          className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-border bg-muted/20 px-6 py-10 text-center"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-7 w-7 animate-spin text-primary" />

          <p className="mt-4 font-medium">
            Looking across your observations…
          </p>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            We’re looking for useful connections without forcing a pattern.
          </p>
        </div>
      ) : error && !result ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />

            <div>
              <p className="font-medium">
                We couldn’t prepare your reflection
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {error}
              </p>

              <button
                type="button"
                onClick={() => void generate(false)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          </div>
        </div>
      ) : result ? (
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              One thing to sit with
            </p>

            <p className="mt-3 text-lg leading-8">
              {result.overallReflection}
            </p>
          </section>

          {result.patterns[0] && (
            <section className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-5 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                A possible pattern
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                {result.patterns[0].title}
              </h3>

              <p className="mt-2 leading-7 text-muted-foreground">
                {result.patterns[0].description}
              </p>

              <Evidence
                ids={result.patterns[0].evidenceObservationIds}
                observations={observationState.byId}
              />
            </section>
          )}

          {hasMore && (
            <section className="overflow-hidden rounded-2xl border border-border">
              <button
                type="button"
                onClick={() => setShowMore((value) => !value)}
                aria-expanded={showMore}
                className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/30 sm:p-5"
              >
                <span>
                  <span className="block font-medium">
                    Explore further
                  </span>

                  <span className="mt-1 block text-sm text-muted-foreground">
                    Other connections, tensions, and questions
                  </span>
                </span>

                <ChevronDown
                  className={`h-5 w-5 shrink-0 transition-transform ${
                    showMore ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showMore && (
                <div className="space-y-6 border-t border-border p-4 sm:p-5">
                  {result.patterns.slice(1).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Other possible patterns
                      </h3>

                      {result.patterns.slice(1).map((item, index) => (
                        <article key={`${item.title}-${index}`}>
                          <h4 className="font-medium">{item.title}</h4>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.description}
                          </p>

                          <Evidence
                            ids={item.evidenceObservationIds}
                            observations={observationState.byId}
                          />
                        </article>
                      ))}
                    </div>
                  )}

                  {result.experienceConnections.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Where your experience connects
                      </h3>

                      {result.experienceConnections.map((item, index) => (
                        <article key={`${item.title}-${index}`}>
                          <h4 className="font-medium">{item.title}</h4>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.description}
                          </p>

                          <p className="mt-2 text-sm">
                            <span className="font-medium">
                              Your context:{' '}
                            </span>

                            <span className="text-muted-foreground">
                              {item.contextEvidence}
                            </span>
                          </p>

                          <Evidence
                            ids={item.evidenceObservationIds}
                            observations={observationState.byId}
                          />
                        </article>
                      ))}
                    </div>
                  )}

                  {result.tensions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Tensions and blind spots
                      </h3>

                      {result.tensions.map((item, index) => (
                        <article key={`${item.title}-${index}`}>
                          <h4 className="font-medium">{item.title}</h4>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.description}
                          </p>

                          <Evidence
                            ids={item.evidenceObservationIds}
                            observations={observationState.byId}
                          />
                        </article>
                      ))}
                    </div>
                  )}

                  {result.questions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Questions to carry forward
                      </h3>

                      {result.questions.map((item, index) => (
                        <article key={`${item.question}-${index}`}>
                          <p className="font-medium">{item.question}</p>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.rationale}
                          </p>

                          <Evidence
                            ids={item.evidenceObservationIds}
                            observations={observationState.byId}
                          />
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {notice && (
            <p className="text-sm text-muted-foreground" role="status">
              {notice}
            </p>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <footer className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={loading || regenerating || completing}
              onClick={() => void generate(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted/40 disabled:opacity-50"
            >
              {regenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Regenerate
            </button>

            <button
              type="button"
              disabled={completing || regenerating}
              onClick={() => void continueNode()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {completing && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </footer>
        </div>
      ) : (
        <div className="rounded-2xl border border-border p-5">
          <p className="text-sm text-muted-foreground">
            There isn’t enough saved information to show a reflection yet.
          </p>

          {error && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void generate(false)}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
