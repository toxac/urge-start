'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { AlertCircle, ArrowRight, Loader2, Lock } from 'lucide-react';
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
  lockUserExperimentThreshold,
} from '@/actions/experiments';
import {
  resolveExperimentMetrics,
  type MetricThresholdTarget,
} from '@/lib/types/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type DraftThresholdForm = {
  targets: Record<string, string>;
  timeframeDays: string;
  strongSignalNote: string;
  weakSignalNote: string;
};

export function TestThresholds({ node, onComplete }: NodeComponentProps) {
  const userExpState = useStore($userExperiments);
  const blueprints = useStore($experimentBlueprints);

  const [forms, setForms] = useState<Record<string, DraftThresholdForm>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    setForms((prev) => {
      const next = { ...prev };
      for (const { exp, blueprint } of activeTests) {
        if (next[exp.id]) continue;
        const metrics = resolveExperimentMetrics(exp, blueprint);
        const targets: Record<string, string> = {};
        for (const m of metrics) {
          const existing = exp.threshold?.targets?.[m.key]?.target;
          const fallback = m.default_target ?? '';
          targets[m.key] =
            existing !== undefined && existing !== null
              ? String(existing)
              : String(fallback);
        }

        next[exp.id] = {
          targets,
          timeframeDays: String(
            exp.threshold?.timeframe_days ??
              blueprint?.matching_rules?.default_timeframe_days ??
              5,
          ),
          strongSignalNote:
            exp.threshold?.strong_signal_note ??
            blueprint?.strong_signal_guide ??
            '',
          weakSignalNote:
            exp.threshold?.weak_signal_note ??
            blueprint?.weak_signal_guide ??
            '',
        };
      }
      return next;
    });
  }, [activeTests]);

  async function handleLockThresholds() {
    if (saving || activeTests.length === 0) return;
    setSaving(true);
    setError(null);

    try {
      const updatedRuns = await Promise.all(
        activeTests.map(async ({ exp, blueprint }) => {
          const form = forms[exp.id];
          const metrics = resolveExperimentMetrics(exp, blueprint);
          const targets: Record<string, MetricThresholdTarget> = {};

          for (const m of metrics) {
            const rawVal = form?.targets?.[m.key];
            if (rawVal !== undefined && rawVal !== '') {
              const numVal = Number(rawVal);
              targets[m.key] = {
                target: Number.isNaN(numVal) ? rawVal : numVal,
                direction: m.direction ?? 'at_least',
              };
            }
          }

          return lockUserExperimentThreshold(exp.id, {
            targets,
            timeframe_days: Number(form?.timeframeDays) || 5,
            strong_signal_note: form?.strongSignalNote?.trim() || undefined,
            weak_signal_note: form?.weakSignalNote?.trim() || undefined,
          });
        }),
      );

      userExperimentsActions.upsertMany(updatedRuns);

      await onComplete({
        completed: true,
        lockedExperimentIds: updatedRuns.map((r) => r.id),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your thresholds.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your tests…
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

      <div className="max-w-3xl space-y-6">
        {activeTests.map(({ exp, blueprint }) => {
          const metrics = resolveExperimentMetrics(exp, blueprint);
          const form = forms[exp.id];
          if (!form) return null;

          return (
            <div
              key={exp.id}
              className="space-y-5 rounded-2xl border border-border bg-card p-6"
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
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Lock className="h-3 w-3" />
                  Set before launch
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {metrics.map((m) => (
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
                      {m.is_primary && (
                        <span className="ml-1.5 text-[11px] font-medium text-primary">
                          (Main signal)
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {m.direction === 'at_most' ? 'At most' : 'At least'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={form.targets[m.key] ?? ''}
                        onChange={(e) =>
                          setForms((prev) => ({
                            ...prev,
                            [exp.id]: {
                              ...prev[exp.id],
                              targets: {
                                ...prev[exp.id].targets,
                                [m.key]: e.target.value,
                              },
                            },
                          }))
                        }
                        disabled={saving}
                        className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-semibold"
                      />
                    </div>
                  </div>
                ))}

                <div className="space-y-1.5 rounded-xl border border-border bg-muted/20 p-4">
                  <label className="block text-xs font-semibold text-foreground">
                    Run window (days)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={form.timeframeDays}
                      onChange={(e) =>
                        setForms((prev) => ({
                          ...prev,
                          [exp.id]: {
                            ...prev[exp.id],
                            timeframeDays: e.target.value,
                          },
                        }))
                      }
                      disabled={saving}
                      className="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-semibold"
                    />
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 pt-1 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-emerald-700">
                    What a clear &ldquo;yes&rdquo; looks like
                  </label>
                  <textarea
                    rows={2}
                    value={form.strongSignalNote}
                    onChange={(e) =>
                      setForms((prev) => ({
                        ...prev,
                        [exp.id]: {
                          ...prev[exp.id],
                          strongSignalNote: e.target.value,
                        },
                      }))
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-5"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground">
                    What a weak response looks like
                  </label>
                  <textarea
                    rows={2}
                    value={form.weakSignalNote}
                    onChange={(e) =>
                      setForms((prev) => ({
                        ...prev,
                        [exp.id]: {
                          ...prev[exp.id],
                          weakSignalNote: e.target.value,
                        },
                      }))
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-5"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleLockThresholds()}
          disabled={saving || activeTests.length === 0}
          className="h-12 rounded-full px-8 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Locking in…
            </>
          ) : (
            <>
              Lock in bar &amp; prepare your tests
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}