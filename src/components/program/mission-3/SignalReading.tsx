'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  RefreshCw,
  Sparkles,
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
  fetchMission3ContextSummary,
  fetchUserExperiments,
  saveUserExperimentReflection,
} from '@/actions/experiments';
import { readMission3Signals } from '@/actions/responses/mission3';
import {
  resolveExperimentMetrics,
  type Mission3ContextSummary,
} from '@/lib/types/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function SignalReading({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const userExpState = useStore($userExperiments);
  const blueprints = useStore($experimentBlueprints);

  const [context, setContext] = useState<Mission3ContextSummary | null>(null);
  const [shows, setShows] = useState('');
  const [mightMean, setMightMean] = useState('');
  const [unclear, setUnclear] = useState('');
  const [founderTakeaway, setFounderTakeaway] = useState('');

  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    let alive = true;

    async function load() {
      try {
        const [ctx, loadedBps, loadedRuns] = await Promise.all([
          fetchMission3ContextSummary(),
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
        setContext(ctx);
        if (blueprints.length === 0 && loadedBps.length > 0) {
          experimentBlueprintsActions.hydrate(loadedBps);
        }
        if (!userExpState.hydrated && loadedRuns.length > 0) {
          userExperimentsActions.hydrate(loadedRuns);
        }

        const currentM3 = loadedRuns.filter(
          (e) =>
            e.mission_key === 'mission-3' &&
            e.status !== 'parked' &&
            e.status !== 'iterated',
        );

        const existingReflection = currentM3.find(
          (e) => e.reflection?.shows || e.reflection?.founder_takeaway,
        )?.reflection;

        if (existingReflection?.shows) {
          setShows(existingReflection.shows);
          setMightMean(existingReflection.might_mean ?? '');
          setUnclear(existingReflection.unclear ?? '');
          setFounderTakeaway(existingReflection.founder_takeaway ?? '');
          setLoading(false);
          return;
        }

        const bpMap = new Map(loadedBps.map((b) => [b.key, b]));
        const allQuotes = currentM3.flatMap((e) =>
          (e.results?.quotes ?? []).map((q) => q.quote),
        );

        if (currentM3.length > 0) {
          const aiRead = await readMission3Signals({
            projectTitle: ctx.project?.title ?? 'My Project',
            experiments: currentM3.map((e) => ({
              title: e.title,
              passNumber: e.pass_number,
              where: e.setup?.where,
              metrics: resolveExperimentMetrics(
                e,
                bpMap.get(e.experiment_key) ?? null,
              ),
              threshold: e.threshold,
              results: e.results,
            })),
            quotes: allQuotes,
            nodeKey,
            regenerate: false,
          });

          if (alive) {
            setShows(aiRead.shows);
            setMightMean(aiRead.mightMean);
            setUnclear(aiRead.unclear);
          }
        }
      } catch (err) {
        if (alive) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not assemble signal read.',
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

  async function handleRegenerate() {
    if (regenerating || activeTests.length === 0) return;
    setRegenerating(true);
    setError(null);
    try {
      const allQuotes = activeTests.flatMap(({ exp }) =>
        (exp.results?.quotes ?? []).map((q) => q.quote),
      );
      const nextRead = await readMission3Signals({
        projectTitle: context?.project?.title ?? 'My Project',
        experiments: activeTests.map(({ exp, blueprint }) => ({
          title: exp.title,
          passNumber: exp.pass_number,
          where: exp.setup?.where,
          metrics: resolveExperimentMetrics(exp, blueprint),
          threshold: exp.threshold,
          results: exp.results,
        })),
        quotes: allQuotes,
        nodeKey,
        regenerate: true,
      });

      setShows(nextRead.shows);
      setMightMean(nextRead.mightMean);
      setUnclear(nextRead.unclear);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not regenerate read.',
      );
    } finally {
      setRegenerating(false);
    }
  }

  async function handleSaveAndContinue() {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      const updated = await Promise.all(
        activeTests.map(({ exp }) =>
          saveUserExperimentReflection(exp.id, {
            ...exp.reflection,
            shows: shows.trim(),
            might_mean: mightMean.trim(),
            unclear: unclear.trim(),
            founder_takeaway: founderTakeaway.trim() || undefined,
          }),
        ),
      );

      userExperimentsActions.upsertMany(updated);

      await onComplete({
        completed: true,
        reading: {
          shows: shows.trim(),
          mightMean: mightMean.trim(),
          unclear: unclear.trim(),
          founderTakeaway: founderTakeaway.trim(),
        },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your reading.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Putting what came back into order…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Signal Read
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleRegenerate()}
            disabled={regenerating || saving}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`}
            />
            Refresh summary
          </Button>
        </div>

        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className="space-y-2 rounded-2xl border border-border bg-card p-6">
          <label className="text-sm font-bold text-foreground">
            1. What the signals show (the facts)
          </label>
          <p className="text-xs text-muted-foreground">
            Edit anything that isn&apos;t accurate about what people did or
            said.
          </p>
          <SpeechTextarea
            rows={3}
            value={shows}
            onChange={(e) => setShows(e.target.value)}
            disabled={saving}
            className="text-base leading-7"
          />
        </div>

        <div className="space-y-2 rounded-2xl border border-border bg-card p-6">
          <label className="text-sm font-bold text-foreground">
            2. What it might mean
          </label>
          <p className="text-xs text-muted-foreground">
            Possibilities, not certainty. Keep what feels plausible and rewrite
            what doesn&apos;t fit.
          </p>
          <SpeechTextarea
            rows={3}
            value={mightMean}
            onChange={(e) => setMightMean(e.target.value)}
            disabled={saving}
            className="text-base leading-7"
          />
        </div>

        <div className="space-y-2 rounded-2xl border border-border bg-card p-6">
          <label className="text-sm font-bold text-foreground">
            3. What is still unclear
          </label>
          <SpeechTextarea
            rows={3}
            value={unclear}
            onChange={(e) => setUnclear(e.target.value)}
            disabled={saving}
            className="text-base leading-7"
          />
        </div>

        <div className="space-y-2 rounded-2xl border border-primary/30 bg-primary/[0.03] p-6">
          <label className="text-sm font-bold text-foreground">
            4. Your own read (what you noticed firsthand)
          </label>
          <p className="text-xs text-muted-foreground">
            You were there. Write what stood out to you—your read always takes
            priority.
          </p>
          <SpeechTextarea
            rows={3}
            value={founderTakeaway}
            onChange={(e) => setFounderTakeaway(e.target.value)}
            disabled={saving}
            placeholder="e.g. People who already tried spreadsheets replied within an hour, while cold posts got ignored..."
            className="text-base leading-7"
          />
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
          onClick={() => void handleSaveAndContinue()}
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
              See where you stand
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}