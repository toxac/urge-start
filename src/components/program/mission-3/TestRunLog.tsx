'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Quote,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import {
  $experimentBlueprints,
  $userExperiments,
  experimentBlueprintsActions,
  userExperimentsActions,
} from '@/lib/stores/experiments';
import {
  fetchExperimentBlueprints,
  fetchUserExperiments,
  logUserExperimentResults,
  saveExperimentQuoteObservation,
} from '@/actions/experiments';
import {
  resolveExperimentMetrics,
  type ExperimentQuoteEntry,
  type ExperimentWarmLead,
  type MetricRecordedValue,
} from '@/lib/types/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type ExperimentLogDraft = {
  values: Record<string, string>;
  warmLeads: ExperimentWarmLead[];
  quotes: ExperimentQuoteEntry[];
  notes: string;
  // Draft inputs for adding a warm lead or quote
  newLeadName: string;
  newLeadContact: string;
  newLeadAction: string;
  newQuoteText: string;
  newQuotePerson: string;
};

export function TestRunLog({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const userExpState = useStore($userExperiments);
  const blueprints = useStore($experimentBlueprints);

  const [drafts, setDrafts] = useState<Record<string, ExperimentLogDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [loadedBps, loadedRuns] = await Promise.all([
          blueprints.length > 0
            ? Promise.resolve(blueprints)
            : fetchExperimentBlueprints({ category: 'demand' }),
          userExpState.hydrated
            ? Promise.resolve(
                userExpState.allIds.map((id) => userExpState.byId[id]),
              )
            : fetchUserExperiments({ missionKey: 'mission-3' }),
        ]);

        if (!alive) return;
        if (blueprints.length === 0 && loadedBps.length > 0) {
          experimentBlueprintsActions.hydrate(loadedBps);
        }
        if (!userExpState.hydrated && loadedRuns.length > 0) {
          userExperimentsActions.hydrate(loadedRuns);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const activeTests = useMemo(() => {
    const bpMap = new Map(blueprints.map((b) => [b.key, b]));
    return userExpState.allIds
      .map((id) => userExpState.byId[id])
      .filter(
        (exp) =>
          exp &&
          exp.mission_key === 'mission-3' &&
          exp.status !== 'parked' &&
          exp.status !== 'iterated',
      )
      .map((exp) => ({
        exp,
        blueprint: bpMap.get(exp.experiment_key) ?? null,
      }));
  }, [userExpState, blueprints]);

  useEffect(() => {
    if (activeTests.length === 0) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const { exp, blueprint } of activeTests) {
        if (next[exp.id]) continue;
        const metrics = resolveExperimentMetrics(exp, blueprint);
        const values: Record<string, string> = {};
        for (const m of metrics) {
          const existing = exp.results?.values?.[m.key];
          values[m.key] =
            existing !== undefined && existing !== null
              ? String(existing)
              : '';
        }

        next[exp.id] = {
          values,
          warmLeads: Array.isArray(exp.results?.warm_leads)
            ? exp.results.warm_leads
            : [],
          quotes: Array.isArray(exp.results?.quotes) ? exp.results.quotes : [],
          notes: exp.results?.notes ?? '',
          newLeadName: '',
          newLeadContact: '',
          newLeadAction: '',
          newQuoteText: '',
          newQuotePerson: '',
        };
      }
      return next;
    });
  }, [activeTests]);

  function addWarmLead(expId: string) {
    const draft = drafts[expId];
    if (!draft || !draft.newLeadName.trim()) return;

    const entry: ExperimentWarmLead = {
      id: `lead_${Date.now()}`,
      name: draft.newLeadName.trim(),
      contact: draft.newLeadContact.trim(),
      action_taken: draft.newLeadAction.trim() || 'Raised their hand',
      logged_at: new Date().toISOString(),
    };

    setDrafts((prev) => ({
      ...prev,
      [expId]: {
        ...prev[expId],
        warmLeads: [...prev[expId].warmLeads, entry],
        newLeadName: '',
        newLeadContact: '',
        newLeadAction: '',
      },
    }));
  }

  function removeWarmLead(expId: string, leadId: string) {
    setDrafts((prev) => ({
      ...prev,
      [expId]: {
        ...prev[expId],
        warmLeads: prev[expId].warmLeads.filter((l) => l.id !== leadId),
      },
    }));
  }

  async function addQuote(expId: string, expTitle: string) {
    const draft = drafts[expId];
    if (!draft || !draft.newQuoteText.trim()) return;

    const quoteText = draft.newQuoteText.trim();
    const personName = draft.newQuotePerson.trim();

    const entry: ExperimentQuoteEntry = {
      id: `quote_${Date.now()}`,
      quote: quoteText,
      ...(personName ? { person_name: personName } : {}),
      logged_at: new Date().toISOString(),
    };

    setDrafts((prev) => ({
      ...prev,
      [expId]: {
        ...prev[expId],
        quotes: [...prev[expId].quotes, entry],
        newQuoteText: '',
        newQuotePerson: '',
      },
    }));

    // Also persist as an experiment observation in user_observations
    try {
      await saveExperimentQuoteObservation({
        title: personName
          ? `${expTitle} — ${personName}`
          : `${expTitle} — Response`,
        content: quoteText,
        sourceNodeKey: nodeKey,
      });
    } catch {
      // Non-blocking: quote is already stored in user_experiments.results
    }
  }

  function removeQuote(expId: string, quoteId: string) {
    setDrafts((prev) => ({
      ...prev,
      [expId]: {
        ...prev[expId],
        quotes: prev[expId].quotes.filter((q) => q.id !== quoteId),
      },
    }));
  }

  async function persistAllLogs() {
    const updatedRuns = await Promise.all(
      activeTests.map(async ({ exp, blueprint }) => {
        const draft = drafts[exp.id];
        const metrics = resolveExperimentMetrics(exp, blueprint);
        const values: Record<string, MetricRecordedValue> = {};

        for (const m of metrics) {
          const raw = draft?.values?.[m.key];
          if (raw === undefined || raw === '') {
            values[m.key] = 0;
          } else if (m.type === 'text') {
            values[m.key] = raw;
          } else {
            const num = Number(raw);
            values[m.key] = Number.isNaN(num) ? 0 : num;
          }
        }

        return logUserExperimentResults(exp.id, {
          values,
          warm_leads: draft?.warmLeads ?? [],
          quotes: draft?.quotes ?? [],
          notes: draft?.notes?.trim() || undefined,
        });
      }),
    );

    userExperimentsActions.upsertMany(updatedRuns);
    return updatedRuns;
  }

  async function handleSaveProgress() {
    if (savingDraft || submitting) return;
    setSavingDraft(true);
    setError(null);
    setSavedBanner(false);
    try {
      await persistAllLogs();
      setSavedBanner(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your progress.',
      );
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleCompleteAndRead() {
    if (submitting || savingDraft) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await persistAllLogs();
      await onComplete({
        completed: true,
        loggedExperimentIds: updated.map((r) => r.id),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your results.',
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your test log…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      <div className="max-w-3xl space-y-8">
        {activeTests.map(({ exp, blueprint }) => {
          const metrics = resolveExperimentMetrics(exp, blueprint);
          const draft = drafts[exp.id];
          if (!draft) return null;

          return (
            <div
              key={exp.id}
              className="space-y-6 rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {exp.title}
                  </h2>
                  {exp.setup?.where && (
                    <p className="text-xs text-muted-foreground">
                      Where: {exp.setup.where}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground">
                  Pass {exp.pass_number}
                </span>
              </div>

              {/* 1. Metric Numbers */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  1. Numbers that came back
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {metrics.map((m) => {
                    const targetSpec = exp.threshold?.targets?.[m.key];
                    return (
                      <div
                        key={m.key}
                        className={`space-y-1.5 rounded-xl border p-4 ${
                          m.is_primary
                            ? 'border-primary/40 bg-primary/[0.03]'
                            : 'border-border bg-muted/20'
                        }`}
                      >
                        <label className="block text-xs font-semibold text-foreground">
                          {m.label}
                        </label>
                        {targetSpec && (
                          <p className="text-[11px] text-muted-foreground">
                            Your bar:{' '}
                            {targetSpec.direction === 'at_most'
                              ? 'at most'
                              : 'at least'}{' '}
                            {String(targetSpec.target)}
                          </p>
                        )}
                        <input
                          type={m.type === 'text' ? 'text' : 'number'}
                          min={0}
                          value={draft.values[m.key] ?? ''}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [exp.id]: {
                                ...prev[exp.id],
                                values: {
                                  ...prev[exp.id].values,
                                  [m.key]: e.target.value,
                                },
                              },
                            }))
                          }
                          placeholder={m.placeholder ?? '0'}
                          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-semibold"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Warm List (People who took a real step) */}
              <div className="space-y-3 border-t border-border/60 pt-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <UserPlus className="h-3.5 w-3.5 text-primary" />
                  <span>
                    2. People who raised their hand (your warm list)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add anyone who signed up, replied asking when it&apos;s ready,
                  or claimed an early spot so you can go back to them in
                  Mission 4.
                </p>

                {draft.warmLeads.length > 0 && (
                  <div className="space-y-2">
                    {draft.warmLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-2.5 text-sm"
                      >
                        <div>
                          <span className="font-semibold text-foreground">
                            {lead.name}
                          </span>
                          {lead.contact && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({lead.contact})
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {lead.action_taken}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeWarmLead(exp.id, lead.id)}
                          aria-label="Remove person"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-3">
                  <input
                    type="text"
                    value={draft.newLeadName}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [exp.id]: {
                          ...prev[exp.id],
                          newLeadName: e.target.value,
                        },
                      }))
                    }
                    placeholder="Name"
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={draft.newLeadContact}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [exp.id]: {
                          ...prev[exp.id],
                          newLeadContact: e.target.value,
                        },
                      }))
                    }
                    placeholder="Email, phone, or handle"
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={draft.newLeadAction}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [exp.id]: {
                            ...prev[exp.id],
                            newLeadAction: e.target.value,
                          },
                        }))
                      }
                      placeholder="What they did (e.g. Joined waitlist)"
                      className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => addWarmLead(exp.id)}
                      disabled={!draft.newLeadName.trim()}
                      title="Add to warm list"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 3. Quotes & What They Revealed */}
              <div className="space-y-3 border-t border-border/60 pt-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Quote className="h-3.5 w-3.5 text-primary" />
                  <span>3. Notable things people said</span>
                </div>

                {draft.quotes.length > 0 && (
                  <div className="space-y-2">
                    {draft.quotes.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 px-4 py-2.5 text-sm"
                      >
                        <div>
                          <p className="text-foreground">
                            &ldquo;{q.quote}&rdquo;
                          </p>
                          {q.person_name && (
                            <p className="text-xs text-muted-foreground">
                              — {q.person_name}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuote(exp.id, q.id)}
                          aria-label="Remove quote"
                          className="mt-0.5 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={draft.newQuoteText}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [exp.id]: {
                          ...prev[exp.id],
                          newQuoteText: e.target.value,
                        },
                      }))
                    }
                    placeholder="Exact words or reaction someone shared..."
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={draft.newQuotePerson}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [exp.id]: {
                          ...prev[exp.id],
                          newQuotePerson: e.target.value,
                        },
                      }))
                    }
                    placeholder="Who (optional)"
                    className="sm:w-36 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void addQuote(exp.id, exp.title)}
                    disabled={!draft.newQuoteText.trim()}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add quote
                  </Button>
                </div>
              </div>

              {/* 4. Freeform Observation Notes */}
              <div className="space-y-1.5 border-t border-border/60 pt-5">
                <label className="block text-xs font-semibold text-foreground">
                  4. Anything else you noticed while running this?
                </label>
                <SpeechTextarea
                  rows={2}
                  value={draft.notes}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [exp.id]: { ...prev[exp.id], notes: e.target.value },
                    }))
                  }
                  placeholder="e.g. Most replies came from one specific thread; people asked whether it works on mobile..."
                  className="text-sm leading-6"
                />
              </div>
            </div>
          );
        })}
      </div>

      {savedBanner && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm font-medium text-emerald-600"
        >
          <Check className="h-4 w-4" />
          Progress saved. Come back anytime over the next few days to add more
          responses.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <div className="flex max-w-3xl flex-wrap items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleSaveProgress()}
          disabled={savingDraft || submitting}
          className="h-12 rounded-full px-6 text-base"
        >
          {savingDraft ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save progress for now'
          )}
        </Button>

        <Button
          type="button"
          onClick={() => void handleCompleteAndRead()}
          disabled={submitting || savingDraft}
          className="h-12 rounded-full px-8 text-base"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Read what the signals show
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}