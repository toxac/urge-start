'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { AlertCircle, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import {
  $userExperiments,
  userExperimentsActions,
} from '@/lib/stores/experiments';
import {
  createNextExperimentPass,
  fetchUserExperiments,
  saveUserExperimentReflection,
  updateUserExperiment,
} from '@/actions/experiments';
import { saveUserTasks } from '@/actions/tasks';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type RouteChoice = 'proceed' | 'iterate' | 'switch_opportunity' | 'pause';

const ROUTE_OPTIONS: Array<{
  key: RouteChoice;
  title: string;
  description: string;
}> = [
  {
    key: 'proceed',
    title: 'Move forward to Mission 4 (Plan the Business)',
    description:
      'Carry what you learned and your warm list into planning—even if the signal is still early.',
  },
  {
    key: 'iterate',
    title: 'Run a sharper test (Pass 2)',
    description:
      'Keep the same opportunity, but adjust how you put the problem or where you share it.',
  },
  {
    key: 'switch_opportunity',
    title: 'Park this for now and look at another Mission 2 opportunity',
    description:
      'Step back and test one of the other candidates you investigated in Mission 2.',
  },
  {
    key: 'pause',
    title: 'Pause for now and set a reminder to come back',
    description:
      'Save a follow-up task on your dashboard so you can pick this back up when ready.',
  },
];

export function SignalRouteAction({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const userExpState = useStore($userExperiments);
  const saved = (progress.payload ?? {}) as {
    route?: RouteChoice;
    reason?: string;
  };

  const [route, setRoute] = useState<RouteChoice>(saved.route ?? 'proceed');
  const [reason, setReason] = useState(saved.reason ?? '');
  const [loading, setLoading] = useState(!userExpState.hydrated);
  const [submitting, setSubmitting] = useState(false);
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

  async function handleConfirmRoute() {
    if (submitting) return;
    if (!reason.trim()) {
      setError('Please write a sentence or two explaining why in your own words.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const trimmedReason = reason.trim();

      if (route === 'iterate' && activeTests.length > 0) {
        const nextPass = await createNextExperimentPass(
          activeTests[0].id,
          nodeKey,
        );
        userExperimentsActions.upsert(nextPass);
      } else if (route === 'switch_opportunity') {
        const parked = await Promise.all(
          activeTests.map((exp) =>
            updateUserExperiment(exp.id, {
              status: 'parked',
              reflection: {
                ...exp.reflection,
                next_step: 'switch_opportunity',
                decision_reason: trimmedReason,
              },
            }),
          ),
        );
        userExperimentsActions.upsertMany(parked);
      } else {
        const updated = await Promise.all(
          activeTests.map((exp) =>
            saveUserExperimentReflection(exp.id, {
              ...exp.reflection,
              next_step: route,
              decision_reason: trimmedReason,
            }),
          ),
        );
        userExperimentsActions.upsertMany(updated);

        if (route === 'pause') {
          await saveUserTasks([
            {
              title: 'Revisit Mission 3 problem test results and next step',
              task_type: 'practice',
              source_node_key: nodeKey,
              description: trimmedReason,
            },
          ]);
        }
      }

      await onComplete({
        completed: true,
        route,
        reason: trimmedReason,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your decision.',
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
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

      <div className="max-w-3xl space-y-3">
        {ROUTE_OPTIONS.map((opt) => {
          const isSelected = route === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              aria-pressed={isSelected}
              disabled={submitting}
              onClick={() => {
                setRoute(opt.key);
                setError(null);
              }}
              className={`w-full rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-bold text-foreground">{opt.title}</p>
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

      <div className="max-w-3xl space-y-2">
        <label className="text-base font-bold text-foreground">
          Why are you choosing this path?
        </label>
        <p className="text-sm text-muted-foreground">
          Put your reasoning in your own words so you remember what led you
          here.
        </p>
        <SpeechTextarea
          rows={3}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(null);
          }}
          disabled={submitting}
          placeholder="e.g. Eight cafe owners joined the list and six described the exact same stock headache, so I have enough to start planning..."
          className="text-base leading-7"
        />
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
          onClick={() => void handleConfirmRoute()}
          disabled={submitting}
          className="h-12 rounded-full px-8 text-base"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Confirm &amp; review your Mission 3 story
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}