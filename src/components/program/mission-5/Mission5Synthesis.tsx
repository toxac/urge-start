'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, CheckCircle2, Loader2, Rocket } from 'lucide-react';
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

export function Mission5Synthesis({ node, onComplete }: NodeComponentProps) {
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
  const launch = build?.launch_summary;
  const currency =
    offer?.metadata?.currency ??
    project?.metadata?.economics?.currency ??
    '₹';

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
        Summarizing your build and launch…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Rocket className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Mission 5 · Launch Milestone ({build?.version_label ?? 'v1.0'})
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          You went from a validated problem to a live{' '}
          {build?.version_label ?? 'v1.0'} product tested with real buyers.
        </p>
      </div>

      <div className="max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          <h2 className="text-lg font-bold text-foreground">
            {build?.title ??
              offer?.title ??
              project?.title ??
              'Your v1 Offer'}{' '}
            is live
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Launch Inquiries</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {launch?.launchInquiries ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Paying Customers</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              {launch?.launchCustomers ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Initial Revenue</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {currency}
              {(launch?.launchRevenue ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        {launch?.launchNotes && (
          <p className="rounded-xl bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            {launch.launchNotes}
          </p>
        )}
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
              Continuing…
            </>
          ) : (
            <>
              Continue to Operate Workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}