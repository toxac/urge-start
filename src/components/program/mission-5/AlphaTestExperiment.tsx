'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  FlaskConical,
  Loader2,
  Plus,
  Quote,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import {
  $activeProject,
  $selectedOffer,
  projectsActions,
} from '@/lib/stores/projects';
import { userExperimentsActions } from '@/lib/stores/experiments';
import { fetchMission4ContextSummary } from '@/actions/projects';
import {
  createUserExperiments,
  fetchExperimentBlueprints,
  fetchUserExperiments,
  launchUserExperiment,
  logUserExperimentResults,
} from '@/actions/experiments';
import type {
  ExperimentQuoteEntry,
  ExperimentWarmLead,
  UserExperiment,
} from '@/lib/types/experiments';
import type { Mission4ContextSummary } from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

const ALPHA_TEST_EXPERIMENT_ID = '7c45d84e-c117-4d56-ba00-dd759625291f';
const ALPHA_TEST_EXPERIMENT_KEY = 'alpha_delivery_test';

export function AlphaTestExperiment({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [alphaExp, setAlphaExp] = useState<UserExperiment | null>(null);

  const [onboardedCount, setOnboardedCount] = useState<string>('0');
  const [outcomesCount, setOutcomesCount] = useState<string>('0');
  const [actualHoursPerBuyer, setActualHoursPerBuyer] = useState<string>('0');
  const [alphaTesters, setAlphaTesters] = useState<ExperimentWarmLead[]>([]);
  const [feedbackLog, setFeedbackLog] = useState<ExperimentQuoteEntry[]>([]);
  const [notes, setNotes] = useState<string>('');

  const [testerName, setTesterName] = useState('');
  const [testerContact, setTesterContact] = useState('');
  const [testerStatus, setTesterStatus] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackWho, setFeedbackWho] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const data = await fetchMission4ContextSummary();
        if (!alive) return;
        setContext(data);

        const proj = data.project ?? activeProject;
        const offer = data.selectedOffer ?? selectedOffer;
        if (proj) projectsActions.upsertProject(proj);
        if (offer) projectsActions.upsertOffer(offer);

        if (!proj) {
          setLoading(false);
          return;
        }

        const [bps, m5Runs] = await Promise.all([
          fetchExperimentBlueprints({ missionKey: 'mission-5' }),
          fetchUserExperiments({ missionKey: 'mission-5', projectId: proj.id }),
        ]);

        if (!alive) return;
        userExperimentsActions.hydrate(m5Runs);

        let run =
          m5Runs.find(
            (r) =>
              r.experiment_key === ALPHA_TEST_EXPERIMENT_KEY &&
              r.status !== 'parked' &&
              r.status !== 'iterated',
          ) ?? null;

        if (!run) {
          const bp = bps.find((b) => b.key === ALPHA_TEST_EXPERIMENT_KEY);
          const estHours = proj.metadata?.economics?.hoursPerUnit ?? 4;

          const [created] = await createUserExperiments([
            {
              experimentId: bp?.id ?? ALPHA_TEST_EXPERIMENT_ID,
              experimentKey: ALPHA_TEST_EXPERIMENT_KEY,
              projectId: proj.id,
              opportunityId: proj.opportunity_id,
              missionKey: 'mission-5',
              sourceNodeKey: nodeKey,
              title: bp?.name ?? 'Founding Alpha Delivery Test',
              setup: {
                pitch: {
                  direction: offer?.promise ?? proj.title,
                  ask: offer?.ask ?? '',
                },
              },
              threshold: {
                targets: {
                  alpha_users_onboarded: { target: 3, direction: 'at_least' },
                  outcomes_delivered: { target: 3, direction: 'at_least' },
                  actual_hours_per_customer: {
                    target: estHours,
                    direction: 'at_most',
                  },
                },
                timeframe_days: 7,
              },
              status: 'live',
            },
          ]);
          run = created;
          userExperimentsActions.upsert(created);
        } else if (run.status === 'draft' || run.status === 'ready') {
          run = await launchUserExperiment(run.id);
          userExperimentsActions.upsert(run);
        }

        setAlphaExp(run);
        setOnboardedCount(
          String(run.results?.values?.alpha_users_onboarded ?? 0),
        );
        setOutcomesCount(String(run.results?.values?.outcomes_delivered ?? 0));
        setActualHoursPerBuyer(
          String(run.results?.values?.actual_hours_per_customer ?? 0),
        );
        setAlphaTesters(run.results?.warm_leads ?? []);
        setFeedbackLog(run.results?.quotes ?? []);
        setNotes(run.results?.notes ?? '');
      } catch (err) {
        if (alive) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load Alpha test tracker.',
          );
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

  const project = context?.project ?? activeProject;
  const estHours = project?.metadata?.economics?.hoursPerUnit ?? 0;

  function handleAddTester() {
    if (!testerName.trim()) return;
    setAlphaTesters((prev) => [
      ...prev,
      {
        id: `alpha_${Date.now()}`,
        name: testerName.trim(),
        contact: testerContact.trim(),
        action_taken: testerStatus.trim() || 'Onboarded into Alpha v1',
        logged_at: new Date().toISOString(),
      },
    ]);
    setTesterName('');
    setTesterContact('');
    setTesterStatus('');
  }

  function handleAddFeedback() {
    if (!feedbackText.trim()) return;
    setFeedbackLog((prev) => [
      ...prev,
      {
        id: `fb_${Date.now()}`,
        quote: feedbackText.trim(),
        ...(feedbackWho.trim() ? { person_name: feedbackWho.trim() } : {}),
        logged_at: new Date().toISOString(),
      },
    ]);
    setFeedbackText('');
    setFeedbackWho('');
  }

  async function persistAlphaResults() {
    if (!alphaExp) return;
    const updated = await logUserExperimentResults(alphaExp.id, {
      values: {
        alpha_users_onboarded: Math.max(0, Number(onboardedCount) || 0),
        outcomes_delivered: Math.max(0, Number(outcomesCount) || 0),
        actual_hours_per_customer: Math.max(
          0,
          Number(actualHoursPerBuyer) || 0,
        ),
      },
      warm_leads: alphaTesters,
      quotes: feedbackLog,
      notes: notes.trim() || undefined,
    });
    userExperimentsActions.upsert(updated);
    setAlphaExp(updated);
  }

  async function handleSaveForNow() {
    if (savingDraft || submitting) return;
    setSavingDraft(true);
    setSavedBanner(false);
    setError(null);
    try {
      await persistAlphaResults();
      setSavedBanner(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save Alpha progress.',
      );
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleCompleteAlpha() {
    if (submitting || savingDraft) return;
    setSubmitting(true);
    setError(null);
    try {
      await persistAlphaResults();
      await onComplete({
        completed: true,
        alphaOnboarded: Number(onboardedCount) || 0,
        outcomesDelivered: Number(outcomesCount) || 0,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save Alpha results.',
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Preparing your Founding Alpha Test…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <FlaskConical className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Quest 2 · Founding Alpha Delivery Test
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Warm Leads Reminder */}
      {(context?.m3WarmLeads.length ?? 0) > 0 && (
        <div className="max-w-3xl space-y-2 rounded-2xl border border-border bg-muted/30 p-5 text-xs">
          <p className="font-bold text-foreground">
            Warm leads from earlier missions ready to invite (
            {context?.m3WarmLeads.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {context?.m3WarmLeads.map((lead) => (
              <span
                key={lead.id}
                className="rounded-full border border-border bg-background px-3 py-1 text-foreground"
              >
                {lead.name}
                {lead.contact ? ` (${lead.contact})` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 1. Core Alpha Delivery Metrics */}
      <div className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-bold text-foreground">
          1. Log real delivery numbers
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-foreground">
              Alpha buyers onboarded
            </label>
            <input
              type="number"
              min={0}
              value={onboardedCount}
              onChange={(e) => setOnboardedCount(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-base font-bold"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Target: 3–5 early buyers
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary">
              Got promised v1 outcome
            </label>
            <input
              type="number"
              min={0}
              value={outcomesCount}
              onChange={(e) => setOutcomesCount(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-primary/50 bg-background px-3.5 py-2 text-base font-bold"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Completed without major failure
            </p>
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Actual hours / buyer</span>
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={actualHoursPerBuyer}
              onChange={(e) => setActualHoursPerBuyer(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-base font-bold"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              M4 estimate: {estHours} hrs/buyer
            </p>
          </div>
        </div>
      </div>

      {/* 2. Alpha Buyers Log */}
      <div className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">
            2. Alpha buyers tested ({alphaTesters.length})
          </h2>
        </div>

        {alphaTesters.length > 0 && (
          <div className="space-y-2">
            {alphaTesters.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-2.5 text-sm"
              >
                <div>
                  <span className="font-semibold text-foreground">
                    {t.name}
                  </span>
                  {t.contact && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({t.contact})
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t.action_taken}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAlphaTesters((prev) => prev.filter((x) => x.id !== t.id))
                  }
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
            value={testerName}
            onChange={(e) => setTesterName(e.target.value)}
            placeholder="Buyer name"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={testerContact}
            onChange={(e) => setTesterContact(e.target.value)}
            placeholder="Contact"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={testerStatus}
              onChange={(e) => setTesterStatus(e.target.value)}
              placeholder="Outcome (e.g. Paid & completed)"
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddTester}
              disabled={!testerName.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Friction, Bugs & Quotes */}
      <div className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Quote className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">
            3. Where buyers got stuck, what broke, or what they loved
          </h2>
        </div>

        {feedbackLog.length > 0 && (
          <div className="space-y-2">
            {feedbackLog.map((q) => (
              <div
                key={q.id}
                className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 px-4 py-2.5 text-sm"
              >
                <div>
                  <p className="text-foreground">&ldquo;{q.quote}&rdquo;</p>
                  {q.person_name && (
                    <p className="text-xs text-muted-foreground">
                      — {q.person_name}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFeedbackLog((prev) => prev.filter((x) => x.id !== q.id))
                  }
                  className="text-muted-foreground hover:text-destructive"
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
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="e.g. 'Confused about where to upload their file on step 1'"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={feedbackWho}
            onChange={(e) => setFeedbackWho(e.target.value)}
            placeholder="Buyer name"
            className="sm:w-40 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddFeedback}
            disabled={!feedbackText.trim()}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>

        <SpeechTextarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Overall delivery notes, time bottlenecks, or surprises..."
          className="text-sm leading-6"
        />
      </div>

      {savedBanner && (
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
          <Check className="h-4 w-4" />
          Alpha progress saved. Come back as you onboard more testers.
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
          onClick={() => void handleSaveForNow()}
          disabled={savingDraft || submitting}
          className="h-12 rounded-full px-6 text-base"
        >
          {savingDraft ? 'Saving…' : 'Save progress for now'}
        </Button>

        <Button
          type="button"
          onClick={() => void handleCompleteAlpha()}
          disabled={submitting || savingDraft}
          className="h-12 rounded-full px-8 text-base"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reading results…
            </>
          ) : (
            <>
              Read what Alpha revealed
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}