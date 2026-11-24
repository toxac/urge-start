'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@nanostores/react';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
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
import {
  updateProjectBuild,
  upsertProjectBuild,
} from '@/actions/builds';
import type { Mission4ContextSummary } from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function BuildWorkspaceEntry({ node, onComplete }: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);
  const activeBuild = useStore($activeBuild);
  const autoCompletedRef = useRef(false);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

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

  useEffect(() => {
    if (typeof window === 'undefined' || autoCompletedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('buildComplete') === '1') {
      autoCompletedRef.current = true;
      void onComplete({
        completed: true,
        buildCompletedAt: new Date().toISOString(),
      });
    }
  }, [onComplete]);

  const project = context?.project ?? activeProject;
  const offer = context?.selectedOffer ?? selectedOffer;
  const build = context?.activeBuild ?? activeBuild;
  const tasks =
    build?.requirements ?? project?.metadata?.mspRequirements ?? [];
  const doneCount = tasks.filter((t) => t.done).length;
  const alreadyMarkedComplete = Boolean(build?.build_completed_at);

  async function handleMarkReadyDirectly() {
    if (completing) return;
    setCompleting(true);
    try {
      const now = new Date().toISOString();
      if (build) {
        const updated = await updateProjectBuild(build.id, {
          status: 'alpha_testing',
          buildCompletedAt: now,
        });
        projectsActions.upsertBuild(updated);
      } else if (project) {
        const { build: created, project: updatedProj } =
          await upsertProjectBuild({
            projectId: project.id,
            offerId: offer?.id ?? null,
            versionNumber: 1,
            versionLabel: 'v1.0',
            title: offer?.title
              ? `${offer.title} (v1.0)`
              : `${project.title} v1.0 Build`,
            status: 'alpha_testing',
            requirements: tasks,
            buildCompletedAt: now,
            setAsActive: true,
          });
        projectsActions.upsertBuild(created);
        if (updatedProj) projectsActions.upsertProject(updatedProj);
      }

      await onComplete({
        completed: true,
        buildCompletedAt: now,
      });
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Checking your Build Workspace progress…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Wrench className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Quest 1 · Non-Sequential Build ({build?.version_label ?? 'v1.0'})
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      <div className="max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {build?.version_label ?? 'v1.0'} Build Workspace Status
            </p>
            <h2 className="text-xl font-bold text-foreground">
              {doneCount} of {tasks.length} build tasks completed
            </h2>
          </div>

          {alreadyMarkedComplete && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Marked Ready to Test
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button className="h-12 rounded-full px-8 text-base">
            <Link href="/program/build">
              Open Build Workspace
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => void handleMarkReadyDirectly()}
            disabled={completing}
            className="h-12 rounded-full px-6 text-base"
          >
            {completing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Advancing…
              </>
            ) : (
              <>
                Build complete — move to Alpha test
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}