'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  $activeProject,
  $selectedOffer,
  projectsActions,
} from '@/lib/stores/projects';
import { $activeProjectOps, $opsMetricsSummary } from '@/lib/stores/ops';
import { $userExperiments } from '@/lib/stores/experiments';
import { updateUserProjectMetadata } from '@/actions/projects';
import { synthesizeOperatingWindow } from '@/actions/responses/mission6';
import type { UserExperiment } from '@/lib/types/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type ScorecardData = {
  headline: string;
  scorecardRead: string;
  provenPlaybook: string[];
  next30DayFocus: string;
};

export function Mission6Synthesis({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const project = useStore($activeProject);
  const offer = useStore($selectedOffer);
  const opsBundle = useStore($activeProjectOps);
  const metrics = useStore($opsMetricsSummary);
  const userExpsState = useStore($userExperiments);

  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency =
    offer?.metadata?.currency ??
    project?.metadata?.economics?.currency ??
    '₹';

  const crossroads = project?.metadata?.crossroadsDecision as
    | { choice?: string; reason?: string }
    | undefined;

  async function buildScorecard(forceRegenerate = false) {
    if (!project) {
      setLoading(false);
      return;
    }

    const existing = project.metadata?.operatingScorecard as
      | ScorecardData
      | undefined;
    if (!forceRegenerate && existing?.headline) {
      setScorecard(existing);
      setLoading(false);
      return;
    }

    try {
      const completedExps = userExpsState.allIds
        .map((id) => userExpsState.byId[id])
        .filter(
          (e): e is UserExperiment =>
            Boolean(e) &&
            e.experiment_key === 'ops_hypothesis_test' &&
            e.status === 'completed',
        )
        .map((e) => ({
          title: e.title,
          worked: e.reflection?.worked,
          howItWorked: e.reflection?.how_it_worked,
        }));

      const generated = await synthesizeOperatingWindow({
        projectTitle: project.title,
        currency,
        horizon: opsBundle.activeGoal?.horizon ?? '3_months',
        goals: opsBundle.goalContent,
        metricsSummary: metrics as unknown as Record<string, unknown>,
        completedExperiments: completedExps,
        crossroadsChoice: crossroads?.choice ?? 'keep_steady',
        crossroadsReason: crossroads?.reason ?? '',
        nodeKey,
      });

      setScorecard(generated);
      const updated = await updateUserProjectMetadata(project.id, {
        operatingScorecard: generated,
      });
      projectsActions.upsertProject(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not generate operating scorecard.',
      );
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }

  useEffect(() => {
    void buildScorecard(false);
  }, [project?.id]);

  async function handleContinue() {
    if (continuing) return;
    setContinuing(true);
    try {
      await onComplete({ completed: true });
    } finally {
      setContinuing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Synthesizing your operating scorecard…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Award className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Mission 6 · Operating Scorecard
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setRegenerating(true);
              void buildScorecard(true);
            }}
            disabled={regenerating}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        {scorecard?.headline && (
          <p className="text-lg leading-8 text-muted-foreground">
            {scorecard.headline}
          </p>
        )}
      </div>

      {scorecard && (
        <div className="max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6 text-sm">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Performance vs. Quarterly Targets
            </h2>
            <p className="mt-2 leading-6 text-muted-foreground">
              {scorecard.scorecardRead}
            </p>
          </div>

          {scorecard.provenPlaybook.length > 0 && (
            <div className="space-y-2.5 border-t border-border pt-5">
              <h3 className="text-base font-bold text-foreground">
                Your Proven Operating Playbook
              </h3>
              <ul className="space-y-2 text-xs leading-5 text-muted-foreground">
                {scorecard.provenPlaybook.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scorecard.next30DayFocus && (
            <div className="rounded-xl bg-primary/[0.05] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Next 30-Day Priority
              </p>
              <p className="mt-1 leading-6 text-foreground">
                {scorecard.next30DayFocus}
              </p>
            </div>
          )}
        </div>
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

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={continuing}
          className="h-12 rounded-full px-8 text-base"
        >
          {continuing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Continuing…
            </>
          ) : (
            <>
              Complete program &amp; lock next chapter
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}