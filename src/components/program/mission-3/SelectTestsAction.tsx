'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $progress } from '@/lib/stores/progress';
import {
  $experimentBlueprints,
  $userExperiments,
  experimentBlueprintsActions,
  userExperimentsActions,
} from '@/lib/stores/experiments';
import {
  createUserExperiments,
  fetchExperimentBlueprints,
  fetchMission3ContextSummary,
  fetchUserExperiments,
  type Mission3ContextSummary,
} from '@/actions/experiments';
import {
  recommendExperimentsForFounder,
  type ExperimentBlueprint,
  type ExperimentPitchSetup,
  type FounderAccessProfile,
  type MetricThresholdTarget,
} from '@/lib/types/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function SelectTestsAction({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);
  const storeBlueprints = useStore($experimentBlueprints);
  const userExpState = useStore($userExperiments);

  const accessPayload = isRecord(progressState.payloads['m3-q1-access'])
    ? progressState.payloads['m3-q1-access']
    : {};
  const pitchPayload = isRecord(progressState.payloads['m3-q1-pitch'])
    ? progressState.payloads['m3-q1-pitch']
    : {};
  const revealPayload = isRecord(progressState.payloads['m3-q1-reveal'])
    ? progressState.payloads['m3-q1-reveal']
    : {};

  const accessProfile = (accessPayload.accessProfile ??
    {}) as FounderAccessProfile;
  const basePitch = (pitchPayload.pitch ?? {}) as ExperimentPitchSetup;
  const selectedOneLiner =
    typeof revealPayload.selectedOneLiner === 'string'
      ? revealPayload.selectedOneLiner
      : undefined;

  const [blueprints, setBlueprints] =
    useState<ExperimentBlueprint[]>(storeBlueprints);
  const [context, setContext] = useState<Mission3ContextSummary | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [channelNotes, setChannelNotes] = useState<Record<string, string>>({});
  const [showAllBlueprints, setShowAllBlueprints] = useState(false);

  // Optional custom experiment state
  const [includeCustom, setIncludeCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customMetricLabel, setCustomMetricLabel] = useState('');
  const [customTarget, setCustomTarget] = useState('5');
  const [customWhere, setCustomWhere] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingMission3Runs = useMemo(() => {
    return userExpState.allIds
      .map((id) => userExpState.byId[id])
      .filter((exp) => exp && exp.mission_key === 'mission-3');
  }, [userExpState]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [ctx, loadedBlueprints, existingRuns] = await Promise.all([
          fetchMission3ContextSummary(),
          storeBlueprints.length > 0
            ? Promise.resolve(storeBlueprints)
            : fetchExperimentBlueprints({ category: 'demand' }),
          existingMission3Runs.length > 0
            ? Promise.resolve(existingMission3Runs)
            : fetchUserExperiments({ missionKey: 'mission-3' }),
        ]);

        if (!alive) return;
        setContext(ctx);
        setBlueprints(loadedBlueprints);

        if (storeBlueprints.length === 0 && loadedBlueprints.length > 0) {
          experimentBlueprintsActions.hydrate(loadedBlueprints);
        }
        if (existingMission3Runs.length === 0 && existingRuns.length > 0) {
          userExperimentsActions.hydrate(existingRuns);
        }

        const activeExisting = existingRuns.filter(
          (r) => r.status !== 'parked' && r.status !== 'iterated',
        );
        if (activeExisting.length > 0) {
          setSelectedKeys(
            activeExisting
              .map((r) => r.experiment_key)
              .filter((k) => k !== 'custom'),
          );
          const prefillWhere: Record<string, string> = {};
          for (const run of activeExisting) {
            if (run.setup?.where) {
              prefillWhere[run.experiment_key] = run.setup.where;
            }
          }
          setChannelNotes(prefillWhere);
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

  const recommended = useMemo(() => {
    const approach = context?.opportunity?.metadata?.approach;
    const approachType =
      isRecord(approach) && typeof approach.type === 'string'
        ? approach.type
        : null;
    return recommendExperimentsForFounder(blueprints, {
      ...accessProfile,
      approachType,
    }).slice(0, 3);
  }, [blueprints, accessProfile, context]);

  const displayedBlueprints = showAllBlueprints ? blueprints : recommended;

  function toggleBlueprint(key: string) {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
    setError(null);
  }

  async function handleCommitTests() {
    if (submitting) return;

    const totalSelected =
      selectedKeys.length + (includeCustom && customTitle.trim() ? 1 : 0);
    if (totalSelected === 0) {
      setError('Pick at least one test to run.');
      return;
    }

    if (includeCustom && (!customTitle.trim() || !customMetricLabel.trim())) {
      setError(
        'Please give your custom test a title and the main number you will count.',
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const pitchWithSelection: ExperimentPitchSetup = {
        ...basePitch,
        ...(selectedOneLiner ? { one_liner: selectedOneLiner } : {}),
      };

      const existingActive = existingMission3Runs.filter(
        (r) => r.status !== 'parked' && r.status !== 'iterated',
      );
      const existingKeys = new Set(
        existingActive.map((r) => r.experiment_key),
      );

      const toCreate = selectedKeys
        .filter((key) => !existingKeys.has(key))
        .map((key) => {
          const bp = blueprints.find((b) => b.key === key)!;
          const initialTargets: Record<string, MetricThresholdTarget> = {};
          for (const m of bp.metrics) {
            if (m.default_target !== undefined) {
              initialTargets[m.key] = {
                target: m.default_target,
                direction: m.direction ?? 'at_least',
              };
            }
          }

          return {
            experimentId: bp.id,
            experimentKey: bp.key,
            projectId: context?.project?.id ?? null,
            opportunityId: context?.opportunity?.id ?? null,
            missionKey: 'mission-3',
            sourceNodeKey: nodeKey,
            title: bp.name,
            setup: {
              pitch: pitchWithSelection,
              where: channelNotes[key]?.trim() || undefined,
            },
            threshold: {
              targets: initialTargets,
              timeframe_days: bp.matching_rules?.default_timeframe_days ?? 5,
              strong_signal_note: bp.strong_signal_guide,
              weak_signal_note: bp.weak_signal_guide,
            },
            status: 'draft' as const,
          };
        });

      if (includeCustom && customTitle.trim()) {
        const parsedTarget = Number(customTarget) || 5;
        toCreate.push({
          experimentId: null,
          experimentKey: 'custom',
          projectId: context?.project?.id ?? null,
          opportunityId: context?.opportunity?.id ?? null,
          missionKey: 'mission-3',
          sourceNodeKey: nodeKey,
          title: customTitle.trim(),
          setup: {
            pitch: pitchWithSelection,
            where: customWhere.trim() || undefined,
          },
          customMetrics: [
            {
              key: 'primary_outcome',
              label: customMetricLabel.trim(),
              type: 'number',
              direction: 'at_least',
              default_target: parsedTarget,
              is_primary: true,
            },
          ],
          threshold: {
            targets: {
              primary_outcome: {
                target: parsedTarget,
                direction: 'at_least',
              },
            },
            timeframe_days: 5,
          },
          status: 'draft' as const,
        } as any);
      }

      const newlyCreated =
        toCreate.length > 0 ? await createUserExperiments(toCreate) : [];

      if (newlyCreated.length > 0) {
        userExperimentsActions.upsertMany(newlyCreated);
      }

      const allIds = [
        ...existingActive.map((r) => r.id),
        ...newlyCreated.map((r) => r.id),
      ];

      await onComplete({
        completed: true,
        experimentIds: allIds,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save selected tests.',
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading test options…
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

      <div className="max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">
            Select one or more tests to prepare and run
          </h2>
          {blueprints.length > recommended.length && (
            <button
              type="button"
              onClick={() => setShowAllBlueprints((prev) => !prev)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {showAllBlueprints
                ? 'Show top matches only'
                : `Show all ${blueprints.length} tests`}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {displayedBlueprints.map((bp) => {
            const isSelected = selectedKeys.includes(bp.key);
            return (
              <div
                key={bp.key}
                className={`rounded-2xl border p-5 transition ${
                  isSelected
                    ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <button
                  type="button"
                  aria-pressed={isSelected}
                  disabled={submitting}
                  onClick={() => toggleBlueprint(bp.key)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {bp.name}
                      </h3>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {bp.cost_estimate}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {bp.one_line}
                    </p>
                    <p className="pt-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        Best when:{' '}
                      </span>
                      {bp.best_when}
                    </p>
                  </div>
                  <div
                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                </button>

                {isSelected && (
                  <div className="mt-4 border-t border-border/60 pt-4">
                    <label className="block text-xs font-semibold text-foreground">
                      Where or through which channel will you run this?
                    </label>
                    <input
                      type="text"
                      value={channelNotes[bp.key] ?? ''}
                      onChange={(e) =>
                        setChannelNotes((prev) => ({
                          ...prev,
                          [bp.key]: e.target.value,
                        }))
                      }
                      disabled={submitting}
                      placeholder="e.g. r/CoffeeShops + 2 local cafe owner WhatsApp groups"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Optional Custom Experiment */}
        <div className="rounded-2xl border border-dashed border-border p-5">
          <button
            type="button"
            onClick={() => setIncludeCustom((prev) => !prev)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            {includeCustom
              ? 'Remove custom test'
              : 'Or add your own custom test'}
          </button>

          {includeCustom && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold">
                  Test name
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Short Loom walkthrough sent to 15 studio owners"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">
                  What number will you count?
                </label>
                <input
                  type="text"
                  value={customMetricLabel}
                  onChange={(e) => setCustomMetricLabel(e.target.value)}
                  placeholder="e.g. Replies asking to try it"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">
                  Starting target number
                </label>
                <input
                  type="number"
                  min={1}
                  value={customTarget}
                  onChange={(e) => setCustomTarget(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold">
                  Where will you run it? (Optional)
                </label>
                <input
                  type="text"
                  value={customWhere}
                  onChange={(e) => setCustomWhere(e.target.value)}
                  placeholder="e.g. Direct email & LinkedIn messages"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>
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
          onClick={() => void handleCommitTests()}
          disabled={submitting}
          className="h-12 rounded-full px-8 text-base"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving tests…
            </>
          ) : (
            <>
              Save &amp; set up your tests
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}