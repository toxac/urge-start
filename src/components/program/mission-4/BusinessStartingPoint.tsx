'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  Loader2,
  Target,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechContent } from '@/components/ui/speech-content';
import { $activeProject, projectsActions } from '@/lib/stores/projects';
import { fetchMission4ContextSummary } from '@/actions/projects';
import type { Mission4ContextSummary } from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function BusinessStartingPoint({
  node,
  onComplete,
}: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchMission4ContextSummary()
      .then((data) => {
        if (!alive) return;
        setContext(data);
        if (data.project && !activeProject) {
          projectsActions.upsertProject(data.project);
        }
        if (data.offers.length > 0) {
          projectsActions.hydrateOffers(data.offers);
        }
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
  const problemStatement =
    context?.m3ProblemStatement || project?.description || '';
  const constraintNote = context?.m3PlanAroundNote || '';
  const warmCount = context?.m3WarmLeads.length ?? 0;

  const readAloudText = useMemo(() => {
    return [
      node.title || 'From validated problem to sellable offer.',
      node.description || '',
      project?.title ? `Active project: ${project.title}.` : '',
      problemStatement ? `Confirmed problem: ${problemStatement}` : '',
    ]
      .filter(Boolean)
      .join(' ');
  }, [node.title, node.description, project?.title, problemStatement]);

  async function handleContinue() {
    if (isContinuing) return;
    setIsContinuing(true);
    try {
      await onComplete({
        completed: true,
        projectId: project?.id ?? null,
      });
    } finally {
      setIsContinuing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Gathering what you proved in Mission 3…
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
            <Compass className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Mission 4 · Make the Business Work
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {node.title}
          </h1>
          <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
            {node.description}
          </p>
        </div>

        {/* Carried Forward from Mission 3 */}
        <div className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What you&apos;re building around
              </p>
              <h2 className="text-xl font-bold text-foreground">
                {project?.title ?? 'Your Active Project'}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Users className="h-3.5 w-3.5" />
              {warmCount} warm lead{warmCount === 1 ? '' : 's'} from M3
            </span>
          </div>

          {problemStatement && (
            <div className="rounded-xl bg-muted/40 p-4 text-sm">
              <p className="font-semibold text-foreground">
                Confirmed problem
              </p>
              <p className="mt-1 leading-6 text-muted-foreground">
                {problemStatement}
              </p>
            </div>
          )}

          {constraintNote && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-foreground">
                  The constraint your offer must respect
                </p>
                <p className="mt-1 leading-6 text-muted-foreground">
                  {constraintNote}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Three Ruthless Rules of Mission 4 */}
        <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Target className="h-3.5 w-3.5" />
              <span>1. Cut to sell</span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Strip away nice-to-haves until only what someone will pay for in
              v1 remains.
            </p>
          </div>
          <div className="space-y-1.5 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Target className="h-3.5 w-3.5" />
              <span>2. Check the math</span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Use a quick spreadsheet template to see what one order actually
              makes.
            </p>
          </div>
          <div className="space-y-1.5 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Target className="h-3.5 w-3.5" />
              <span>3. Test new reach</span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Put a real price in front of strangers beyond your warm list
              before building.
            </p>
          </div>
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
              Starting…
            </>
          ) : (
            <>
              Map who has this problem
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}