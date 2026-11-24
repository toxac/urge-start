'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  $activeBuild,
  $activeProject,
  $selectedOffer,
  projectsActions,
} from '@/lib/stores/projects';
import {
  fetchMission4ContextSummary,
  updateProjectBuild,
} from '@/actions/projects';
import {
  fetchUserExperiments,
  saveUserExperimentReflection,
} from '@/actions/experiments';
import { readAlphaTestSignals } from '@/actions/responses/mission5';
import type {
  AlphaAnalysisResult,
  Mission4ContextSummary,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function AlphaSignalRead({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);
  const activeBuild = useStore($activeBuild);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [analysis, setAnalysis] = useState<AlphaAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [continuing, setContinuing] = useState(false);
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
        const build = data.activeBuild ?? activeBuild;
        if (proj) projectsActions.upsertProject(proj);
        if (offer) projectsActions.upsertOffer(offer);
        if (build) projectsActions.upsertBuild(build);

        if (!proj) {
          setLoading(false);
          return;
        }

        if (build?.alpha_summary?.whatWorked) {
          setAnalysis(build.alpha_summary as AlphaAnalysisResult);
          setLoading(false);
          return;
        }

        const m5Runs = await fetchUserExperiments({
          missionKey: 'mission-5',
          projectId: proj.id,
        });
        if (!alive) return;

        const alphaRun = m5Runs.find(
          (r) => r.experiment_key === 'alpha_delivery_test',
        );

        const aiRead = await readAlphaTestSignals({
          projectTitle: proj.title,
          offerTitle: offer?.title ?? proj.title,
          offerPromise: offer?.promise ?? '',
          usersOnboarded: Number(
            alphaRun?.results?.values?.alpha_users_onboarded ?? 0,
          ),
          outcomesDelivered: Number(
            alphaRun?.results?.values?.outcomes_delivered ?? 0,
          ),
          actualHoursPerBuyer: Number(
            alphaRun?.results?.values?.actual_hours_per_customer ?? 0,
          ),
          estimatedHoursPerBuyer: proj.metadata?.economics?.hoursPerUnit ?? 0,
          buyerQuotesAndBlockers: (alphaRun?.results?.quotes ?? []).map(
            (q) => q.quote,
          ),
          notes: alphaRun?.results?.notes ?? '',
          nodeKey,
          regenerate: false,
        });

        if (!alive) return;
        setAnalysis(aiRead);

        if (build) {
          const updatedBuild = await updateProjectBuild(build.id, {
            alphaSummary: aiRead,
          });
          projectsActions.upsertBuild(updatedBuild);
        }

        if (alphaRun) {
          await saveUserExperimentReflection(
            alphaRun.id,
            {
              shows: aiRead.whatWorked,
              might_mean: aiRead.timeAndCostReality,
              next_step: 'proceed',
            },
            { markCompleted: true },
          );
        }
      } catch (err) {
        if (alive) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not read Alpha test signals.',
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
  const offer = context?.selectedOffer ?? selectedOffer;
  const build = context?.activeBuild ?? activeBuild;

  async function handleRegenerate() {
    if (regenerating || !project) return;
    setRegenerating(true);
    setError(null);
    try {
      const m5Runs = await fetchUserExperiments({
        missionKey: 'mission-5',
        projectId: project.id,
      });
      const alphaRun = m5Runs.find(
        (r) => r.experiment_key === 'alpha_delivery_test',
      );

      const aiRead = await readAlphaTestSignals({
        projectTitle: project.title,
        offerTitle: offer?.title ?? project.title,
        offerPromise: offer?.promise ?? '',
        usersOnboarded: Number(
          alphaRun?.results?.values?.alpha_users_onboarded ?? 0,
        ),
        outcomesDelivered: Number(
          alphaRun?.results?.values?.outcomes_delivered ?? 0,
        ),
        actualHoursPerBuyer: Number(
          alphaRun?.results?.values?.actual_hours_per_customer ?? 0,
        ),
        estimatedHoursPerBuyer: project.metadata?.economics?.hoursPerUnit ?? 0,
        buyerQuotesAndBlockers: (alphaRun?.results?.quotes ?? []).map(
          (q) => q.quote,
        ),
        notes: alphaRun?.results?.notes ?? '',
        nodeKey,
        regenerate: true,
      });
      setAnalysis(aiRead);
      if (build) {
        const updatedBuild = await updateProjectBuild(build.id, {
          alphaSummary: aiRead,
        });
        projectsActions.upsertBuild(updatedBuild);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not refresh reading.',
      );
    } finally {
      setRegenerating(false);
    }
  }

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
        Reading what your Alpha test revealed…
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
              Alpha Signal Read · {build?.version_label ?? 'v1.0'}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleRegenerate()}
            disabled={regenerating}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`}
            />
            Re-read
          </Button>
        </div>

        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {analysis && (
        <div className="max-w-3xl space-y-6">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-6 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
              <h2 className="text-lg font-bold">Delivery &amp; Time Check</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  analysis.deliveryVerdict === 'ready_to_launch'
                    ? 'bg-emerald-500/10 text-emerald-700'
                    : 'bg-amber-500/10 text-amber-700'
                }`}
              >
                {analysis.deliveryVerdict === 'ready_to_launch'
                  ? 'Ready to launch'
                  : 'Fix bottlenecks first'}
              </span>
            </div>

            <div>
              <p className="font-semibold text-foreground">What worked</p>
              <p className="mt-1 leading-6 text-muted-foreground">
                {analysis.whatWorked}
              </p>
            </div>

            <div className="border-t border-border/60 pt-4">
              <p className="font-semibold text-foreground">
                Delivery time &amp; margin reality
              </p>
              <p className="mt-1 leading-6 text-muted-foreground">
                {analysis.timeAndCostReality}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-5 text-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                <span>Fix before public launch</span>
              </div>
              <ul className="space-y-1.5 text-xs leading-5 text-muted-foreground">
                {analysis.mustFixBeforeLaunch.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5 text-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Ignore for v1 launch</span>
              </div>
              <ul className="space-y-1.5 text-xs leading-5 text-muted-foreground">
                {analysis.ignoreForNow.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
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
              Proceed to public launch
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}