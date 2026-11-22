'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechContent } from '@/components/ui/speech-content';
import {
  $experimentBlueprints,
  $userExperiments,
  experimentBlueprintsActions,
  userExperimentsActions,
} from '@/lib/stores/experiments';
import {
  fetchExperimentBlueprints,
  fetchUserExperiments,
} from '@/actions/experiments';
import {
  evaluateMetricThreshold,
  resolveExperimentMetrics,
} from '@/lib/types/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function Mission3Synthesis({ node, onComplete }: NodeComponentProps) {
  const userExpState = useStore($userExperiments);
  const blueprints = useStore($experimentBlueprints);

  const [loading, setLoading] = useState(true);
  const [isContinuing, setIsContinuing] = useState(false);

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

  const missionExperiments = useMemo(() => {
    const bpMap = new Map(blueprints.map((b) => [b.key, b]));
    return userExpState.allIds
      .map((id) => userExpState.byId[id])
      .filter((exp) => exp && exp.mission_key === 'mission-3')
      .map((exp) => ({
        exp,
        blueprint: bpMap.get(exp.experiment_key) ?? null,
      }));
  }, [userExpState, blueprints]);

  const stats = useMemo(() => {
    const warmCount = missionExperiments.reduce(
      (sum, { exp }) => sum + (exp.results?.warm_leads?.length ?? 0),
      0,
    );
    const quoteCount = missionExperiments.reduce(
      (sum, { exp }) => sum + (exp.results?.quotes?.length ?? 0),
      0,
    );
    const anyBarMet = missionExperiments.some(({ exp, blueprint }) => {
      const metrics = resolveExperimentMetrics(exp, blueprint);
      const primary = metrics.find((m) => m.is_primary) ?? metrics[0];
      if (!primary) return false;
      return (
        evaluateMetricThreshold(
          exp.results?.values?.[primary.key],
          exp.threshold?.targets?.[primary.key],
        ) === true
      );
    });

    return {
      testCount: missionExperiments.length,
      warmCount,
      quoteCount,
      anyBarMet,
    };
  }, [missionExperiments]);

  const latestReflection = useMemo(() => {
    return missionExperiments.find(
      ({ exp }) => exp.reflection?.shows || exp.reflection?.founder_takeaway,
    )?.exp.reflection;
  }, [missionExperiments]);

  const readAloudText = useMemo(() => {
    return [
      node.title || 'You put it in front of people.',
      `You ran ${stats.testCount} tests, added ${stats.warmCount} people to your warm list, and captured ${stats.quoteCount} real responses.`,
      latestReflection?.founder_takeaway ?? latestReflection?.shows ?? '',
    ]
      .filter(Boolean)
      .join(' ');
  }, [node.title, stats, latestReflection]);

  async function handleContinue() {
    if (isContinuing) return;
    setIsContinuing(true);
    try {
      await onComplete({
        completed: true,
        signalStrength: stats.anyBarMet ? 'clear' : 'thin',
      });
    } finally {
      setIsContinuing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Assembling your Mission 3 story…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <SpeechContent
        textToRead={readAloudText}
        showControls="always"
        controlsPosition="top-right"
        className="space-y-8"
      >
        <div className="max-w-3xl space-y-4 pr-16">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Mission 3 Synthesis
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {node.title}
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            You stepped away from your desk, put a real problem in front of
            people, and watched how they responded.
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-3xl font-bold text-foreground">
              {stats.testCount}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-world test{stats.testCount === 1 ? '' : 's'} run
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-3xl font-bold text-foreground">
              {stats.warmCount}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              People on your warm list
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-3xl font-bold text-foreground">
              {stats.quoteCount}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Quotes &amp; reactions recorded
            </p>
          </div>
        </div>

        {/* Honest Signal Strength Note */}
        {!stats.anyBarMet && (
          <div className="max-w-3xl rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-5 text-sm leading-6 text-muted-foreground">
            <span className="font-semibold text-foreground">
              Honest note on your signal:{' '}
            </span>
            None of your tests crossed the target bar you set before launching
            yet. Moving forward on a thin signal is allowed—just keep that in
            mind when you plan how small to start in Mission 4.
          </div>
        )}

        {/* Per-Test Summary */}
        <div className="max-w-3xl space-y-4 rounded-2xl border border-border p-6">
          <h2 className="text-xl font-bold">What you tested</h2>
          <div className="space-y-3">
            {missionExperiments.map(({ exp, blueprint }) => {
              const metrics = resolveExperimentMetrics(exp, blueprint);
              const primary = metrics.find((m) => m.is_primary) ?? metrics[0];
              const actual = primary
                ? exp.results?.values?.[primary.key]
                : undefined;
              const target = primary
                ? exp.threshold?.targets?.[primary.key]
                : undefined;

              return (
                <div
                  key={exp.id}
                  className="space-y-1.5 rounded-xl bg-muted/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{exp.title}</p>
                    <span className="text-xs capitalize text-muted-foreground">
                      Pass {exp.pass_number} · {exp.status}
                    </span>
                  </div>
                  {exp.setup?.where && (
                    <p className="text-xs text-muted-foreground">
                      Where: {exp.setup.where}
                    </p>
                  )}
                  {primary && (
                    <p className="text-sm text-muted-foreground">
                      {primary.label}:{' '}
                      <span className="font-semibold text-foreground">
                        {actual ?? 0}
                      </span>
                      {target ? ` (target: ${String(target.target)})` : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Founder's Own Takeaway */}
        {(latestReflection?.founder_takeaway || latestReflection?.shows) && (
          <div className="max-w-3xl space-y-2 rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you took from it
            </p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
              {latestReflection.founder_takeaway || latestReflection.shows}
            </p>
          </div>
        )}
      </SpeechContent>

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={isContinuing}
          className="h-12 rounded-full px-8 text-base"
        >
          {isContinuing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Continuing…
            </>
          ) : (
            <>
              Carry this into Mission 4
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}