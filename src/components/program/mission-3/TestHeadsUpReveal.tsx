'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  Loader2,
} from 'lucide-react';
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
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function TestHeadsUpReveal({ node, onComplete }: NodeComponentProps) {
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

  const readAloudText = useMemo(() => {
    const tips = activeTests
      .map(({ exp, blueprint }) => {
        const pitfalls = blueprint?.heads_up?.watch_out_for?.join(' ') ?? '';
        const better = blueprint?.heads_up?.how_to_do_it_better?.join(' ') ?? '';
        return `${exp.title}. Watch out for: ${pitfalls}. How to do it better: ${better}`;
      })
      .join(' ');
    return [node.title || 'A few things to watch out for.', tips]
      .filter(Boolean)
      .join(' ');
  }, [node.title, activeTests]);

  async function handleContinue() {
    if (isContinuing) return;
    setIsContinuing(true);
    try {
      await onComplete({ completed: true });
    } finally {
      setIsContinuing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading practical tips…
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
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {node.title}
          </h1>
          <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
            {node.description}
          </p>
        </div>

        <div className="max-w-3xl space-y-6">
          {activeTests.map(({ exp, blueprint }) => {
            const watchOut = blueprint?.heads_up?.watch_out_for ?? [];
            const doBetter = blueprint?.heads_up?.how_to_do_it_better ?? [];

            return (
              <div
                key={exp.id}
                className="space-y-4 rounded-2xl border border-border bg-card p-6"
              >
                <h2 className="text-xl font-bold text-foreground">
                  {exp.title}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 rounded-xl bg-amber-500/[0.06] p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span>What usually trips people up</span>
                    </div>
                    <ul className="space-y-1.5 text-sm leading-6 text-muted-foreground">
                      {(watchOut.length > 0
                        ? watchOut
                        : [
                            'Asking friends for polite feedback instead of reaching people who genuinely feel the problem.',
                          ]
                      ).map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 rounded-xl bg-emerald-500/[0.06] p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                      <Lightbulb className="h-4 w-4" />
                      <span>Small moves that sharpen the signal</span>
                    </div>
                    <ul className="space-y-1.5 text-sm leading-6 text-muted-foreground">
                      {(doBetter.length > 0
                        ? doBetter
                        : [
                            'Write down the exact words people use when they explain why this matters to them.',
                          ]
                      ).map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
              Ready to put your tests live
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}