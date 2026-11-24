'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  ArrowRight,
  Clock,
  DollarSign,
  Loader2,
  Scissors,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  $activeBuild,
  $activeProject,
  $selectedOffer,
  projectsActions,
} from '@/lib/stores/projects';
import { fetchMission4ContextSummary } from '@/actions/projects';
import type { Mission4ContextSummary } from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function BuildStartingPoint({ node, onComplete }: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);
  const activeBuild = useStore($activeBuild);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchMission4ContextSummary()
      .then((data) => {
        if (!alive) return;
        setContext(data);
        if (data.project) projectsActions.upsertProject(data.project);
        if (data.selectedOffer) projectsActions.upsertOffer(data.selectedOffer);
        if (data.activeBuild) projectsActions.upsertBuild(data.activeBuild);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const project = context?.project ?? activeProject;
  const offer = context?.selectedOffer ?? selectedOffer;
  const build = context?.activeBuild ?? activeBuild;
  const econ = project?.metadata?.economics;
  const currency = offer?.metadata?.currency ?? econ?.currency ?? '₹';
  const taskCount =
    build?.requirements?.length ??
    project?.metadata?.mspRequirements?.length ??
    0;

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
        Loading your Mission 4 blueprint…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Wrench className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Mission 5 · Build, Test &amp; Launch ({build?.version_label ?? 'v1.0'})
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Build Guardrails Card */}
      <div className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Build · {build?.version_label ?? 'v1.0'}
            </p>
            <h2 className="text-xl font-bold text-foreground">
              {build?.title ??
                offer?.title ??
                project?.title ??
                'Minimum Sellable v1'}
            </h2>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {taskCount} build item{taskCount === 1 ? '' : 's'} queued
          </span>
        </div>

        {offer?.promise && (
          <p className="rounded-xl bg-muted/40 p-4 text-sm leading-6 text-foreground">
            {offer.promise}
          </p>
        )}

        <div className="grid gap-3 pt-1 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-4 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <span>Setup Budget</span>
            </div>
            <p className="mt-1 text-base font-bold text-foreground">
              {currency}
              {(econ?.oneTimeSetupCosts ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Target Hours / Sale</span>
            </div>
            <p className="mt-1 text-base font-bold text-foreground">
              {econ?.hoursPerUnit ?? 0} hrs
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <Scissors className="h-3.5 w-3.5 text-amber-600" />
              <span>Scope Rule</span>
            </div>
            <p className="mt-1 font-semibold text-foreground">
              Build {build?.version_label ?? 'v1.0'} only; skip cut items
            </p>
          </div>
        </div>
      </div>

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
              Opening…
            </>
          ) : (
            <>
              Go to Build Workspace setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}