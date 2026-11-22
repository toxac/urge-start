'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  $experimentBlueprints,
  $userExperiments,
  experimentBlueprintsActions,
  userExperimentsActions,
} from '@/lib/stores/experiments';
import {
  fetchExperimentBlueprints,
  fetchUserExperiments,
  saveUserExperimentReflection,
} from '@/actions/experiments';
import {
  evaluateMetricThreshold,
  resolveExperimentMetrics,
  type SignalSituation,
} from '@/lib/types/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

const SITUATION_OPTIONS: Array<{
  key: SignalSituation;
  title: string;
  description: string;
}> = [
  {
    key: 'wanted_and_acting',
    title: 'People want this solved, and they are acting on it',
    description:
      'Your bar was met (or close), and real people left contacts, replied with details, or reserved spots.',
  },
  {
    key: 'wanted_no_action',
    title: 'People recognize the problem, but few took action yet',
    description:
      'People nodded along or viewed what you shared, but rarely took the concrete step you asked for.',
  },
  {
    key: 'acting_vague_problem',
    title: 'People responded, but the problem itself is still vague',
    description:
      'You got clicks or sign-ups, yet people have not shared concrete examples of what hurts or why.',
  },
  {
    key: 'neither_yet',
    title: 'Thin signal so far—neither clear urgency nor action yet',
    description:
      'Very few people stopped or acted, so you do not have strong evidence yet.',
  },
];

export function SignalReadingReveal({
  node,
  onComplete,
}: NodeComponentProps) {
  const userExpState = useStore($userExperiments);
  const blueprints = useStore($experimentBlueprints);

  const [selectedSituation, setSelectedSituation] =
    useState<SignalSituation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const evaluatedTests = useMemo(() => {
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
      .map((exp) => {
        const bp = bpMap.get(exp.experiment_key) ?? null;
        const metrics = resolveExperimentMetrics(exp, bp);
        const primaryMetric =
          metrics.find((m) => m.is_primary) ?? metrics[0] ?? null;

        const actualVal = primaryMetric
          ? exp.results?.values?.[primaryMetric.key]
          : undefined;
        const targetSpec = primaryMetric
          ? exp.threshold?.targets?.[primaryMetric.key]
          : undefined;

        const met = evaluateMetricThreshold(actualVal, targetSpec);
        const warmCount = exp.results?.warm_leads?.length ?? 0;
        const quoteCount = exp.results?.quotes?.length ?? 0;

        return {
          exp,
          primaryMetric,
          actualVal,
          targetSpec,
          met,
          warmCount,
          quoteCount,
        };
      });
  }, [userExpState, blueprints]);

  const suggestedSituation = useMemo<SignalSituation>(() => {
    const anyMet = evaluatedTests.some((t) => t.met === true);
    const anyAction = evaluatedTests.some(
      (t) => t.warmCount > 0 || Number(t.actualVal ?? 0) > 0,
    );
    const anyQuotes = evaluatedTests.some((t) => t.quoteCount > 0);

    if (anyMet && (anyQuotes || anyAction)) return 'wanted_and_acting';
    if (anyAction && !anyQuotes) return 'acting_vague_problem';
    if (anyQuotes && !anyMet) return 'wanted_no_action';
    return 'neither_yet';
  }, [evaluatedTests]);

  useEffect(() => {
    if (selectedSituation !== null || evaluatedTests.length === 0) return;
    const savedSit = evaluatedTests.find((t) => t.exp.reflection?.situation)
      ?.exp.reflection?.situation;
    setSelectedSituation(savedSit ?? suggestedSituation);
  }, [evaluatedTests, suggestedSituation, selectedSituation]);

  const activeSituation = selectedSituation ?? suggestedSituation;

  async function handleConfirm() {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await Promise.all(
        evaluatedTests.map(({ exp }) =>
          saveUserExperimentReflection(exp.id, {
            ...exp.reflection,
            situation: activeSituation,
          }),
        ),
      );
      userExperimentsActions.upsertMany(updated);
      await onComplete({
        completed: true,
        situation: activeSituation,
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Assembling your honest read…
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

      {/* Results vs Locked Bar */}
      <div className="max-w-3xl space-y-3 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          How your results compared to the bar you set
        </p>
        <div className="space-y-3">
          {evaluatedTests.map(
            ({
              exp,
              primaryMetric,
              actualVal,
              targetSpec,
              met,
              warmCount,
              quoteCount,
            }) => (
              <div
                key={exp.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-4"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{exp.title}</p>
                  {primaryMetric && (
                    <p className="text-sm text-muted-foreground">
                      {primaryMetric.label}:{' '}
                      <span className="font-bold text-foreground">
                        {actualVal ?? 0}
                      </span>
                      {targetSpec && (
                        <span> (your bar: {String(targetSpec.target)})</span>
                      )}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {warmCount} warm lead{warmCount === 1 ? '' : 's'} ·{' '}
                    {quoteCount} quote{quoteCount === 1 ? '' : 's'} logged
                  </p>
                </div>

                <div>
                  {met === true ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Met your bar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Below your bar
                    </span>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Four Honest Situations */}
      <div className="max-w-3xl space-y-4">
        <h2 className="text-lg font-bold">
          Confirm which statement best describes where you stand
        </h2>
        <div className="space-y-3">
          {SITUATION_OPTIONS.map((opt) => {
            const isSelected = activeSituation === opt.key;
            const isSuggested = suggestedSituation === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedSituation(opt.key)}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  isSelected
                    ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-foreground">{opt.title}</p>
                      {isSuggested && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                          Suggested from your log
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                  <div
                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
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
      </div>

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={saving}
          className="h-12 rounded-full px-8 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Decide your next move
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}