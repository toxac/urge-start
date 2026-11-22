'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Loader2,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  $userExperiments,
  userExperimentsActions,
} from '@/lib/stores/experiments';
import {
  fetchUserExperiments,
  launchUserExperiment,
} from '@/actions/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function TestLaunchAction({ node, onComplete }: NodeComponentProps) {
  const userExpState = useStore($userExperiments);

  const [liveUrls, setLiveUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!userExpState.hydrated);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!userExpState.hydrated) {
      fetchUserExperiments({ missionKey: 'mission-3' })
        .then((items) => {
          if (!alive) return;
          userExperimentsActions.hydrate(items);
          setLoading(false);
        })
        .catch(() => {
          if (alive) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      alive = false;
    };
  }, [userExpState.hydrated]);

  const activeTests = useMemo(() => {
    return userExpState.allIds
      .map((id) => userExpState.byId[id])
      .filter(
        (exp) =>
          exp &&
          exp.mission_key === 'mission-3' &&
          exp.status !== 'parked' &&
          exp.status !== 'iterated',
      );
  }, [userExpState]);

  useEffect(() => {
    if (activeTests.length === 0) return;
    setLiveUrls((prev) => {
      const next = { ...prev };
      for (const exp of activeTests) {
        if (next[exp.id] === undefined) {
          next[exp.id] = exp.setup?.live_url ?? '';
        }
      }
      return next;
    });
  }, [activeTests]);

  async function handleGoLive() {
    if (launching || activeTests.length === 0) return;
    setLaunching(true);
    setError(null);

    try {
      const launched = await Promise.all(
        activeTests.map((exp) => {
          const url = liveUrls[exp.id]?.trim();
          return launchUserExperiment(exp.id, {
            setup: {
              ...exp.setup,
              ...(url ? { live_url: url } : {}),
            },
          });
        }),
      );

      userExperimentsActions.upsertMany(launched);

      await onComplete({
        completed: true,
        liveExperimentIds: launched.map((r) => r.id),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not mark tests as live.',
      );
      setLaunching(false);
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
        <div className="flex items-center gap-2 text-primary">
          <Rocket className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Go Live
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      <div className="max-w-3xl space-y-4">
        {activeTests.map((exp) => (
          <div
            key={exp.id}
            className="space-y-4 rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {exp.title}
                </h2>
                {exp.setup?.where && (
                  <p className="text-xs text-muted-foreground">
                    Channel / setting: {exp.setup.where}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                {exp.status === 'live' ? 'Already live' : 'Ready to launch'}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Live link or post URL (optional)</span>
              </label>
              <input
                type="url"
                value={liveUrls[exp.id] ?? ''}
                onChange={(e) =>
                  setLiveUrls((prev) => ({
                    ...prev,
                    [exp.id]: e.target.value,
                  }))
                }
                disabled={launching}
                placeholder="https://..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                If your test is offline or 1-on-1 messages, leave this blank and
                mark it live once you start reaching out.
              </p>
            </div>
          </div>
        ))}
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
          onClick={() => void handleGoLive()}
          disabled={launching || activeTests.length === 0}
          className="h-12 rounded-full px-8 text-base"
        >
          {launching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Marking live…
            </>
          ) : (
            <>
              Mark tests live &amp; start tracking
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}