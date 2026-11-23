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
import { $activeProject, projectsActions } from '@/lib/stores/projects';
import {
  fetchMission4ContextSummary,
  updateUserProjectMetadata,
} from '@/actions/projects';
import { assessMinimumSellableOffer } from '@/actions/responses/mission4';
import type {
  Mission4ContextSummary,
  OfferAssessmentResult,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function OfferAssessmentReveal({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const activeProject = useStore($activeProject);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [assessment, setAssessment] = useState<OfferAssessmentResult | null>(
    null,
  );
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
        if (proj) {
          projectsActions.upsertProject(proj);

          if (proj.metadata?.offerAssessment) {
            setAssessment(proj.metadata.offerAssessment);
            setLoading(false);
            return;
          }

          const result = await assessMinimumSellableOffer({
            projectTitle: proj.title,
            problemStatement:
              data.m3ProblemStatement || proj.description || '',
            m3Constraint: data.m3PlanAroundNote || '',
            personas: proj.metadata?.personas ?? [],
            painsRemoved: proj.metadata?.painsRemoved ?? [],
            gainsCreated: proj.metadata?.gainsCreated ?? [],
            features: proj.metadata?.features ?? [],
            m3Quotes: data.m3Quotes,
            nodeKey,
            regenerate: false,
          });

          if (!alive) return;
          setAssessment(result);
          const updated = await updateUserProjectMetadata(proj.id, {
            offerAssessment: result,
          });
          projectsActions.upsertProject(updated);
        }
      } catch (err) {
        if (alive) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not review your v1 offer.',
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

  async function handleRegenerate() {
    if (regenerating || !project) return;
    setRegenerating(true);
    setError(null);

    try {
      const next = await assessMinimumSellableOffer({
        projectTitle: project.title,
        problemStatement:
          context?.m3ProblemStatement || project.description || '',
        m3Constraint: context?.m3PlanAroundNote || '',
        personas: project.metadata?.personas ?? [],
        painsRemoved: project.metadata?.painsRemoved ?? [],
        gainsCreated: project.metadata?.gainsCreated ?? [],
        features: project.metadata?.features ?? [],
        m3Quotes: context?.m3Quotes ?? [],
        nodeKey,
        regenerate: true,
      });

      setAssessment(next);
      const updated = await updateUserProjectMetadata(project.id, {
        offerAssessment: next,
      });
      projectsActions.upsertProject(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not refresh assessment.',
      );
    } finally {
      setRegenerating(false);
    }
  }

  async function handleContinue() {
    if (continuing) return;
    setContinuing(true);
    try {
      await onComplete({
        completed: true,
        suggestedOffer: assessment?.suggestedOffer ?? null,
      });
    } finally {
      setContinuing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Checking your v1 cut against your customer personas…
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
              Offer Fit Check
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
            Re-assess
          </Button>
        </div>

        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {assessment && (
        <div className="max-w-3xl space-y-6">
          {/* Alignment & Warnings */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            {assessment.alignmentNotes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>What hits the mark</span>
                </div>
                <ul className="space-y-1.5 text-sm leading-6 text-muted-foreground">
                  {assessment.alignmentNotes.map((note, idx) => (
                    <li key={idx}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}

            {assessment.scopeWarnings.length > 0 && (
              <div className="space-y-2 border-t border-border/60 pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Scope check (can v1 be even leaner?)</span>
                </div>
                <ul className="space-y-1.5 text-sm leading-6 text-muted-foreground">
                  {assessment.scopeWarnings.map((warn, idx) => (
                    <li key={idx}>• {warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {assessment.gapsToWatch.length > 0 && (
              <div className="space-y-2 border-t border-border/60 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Gaps to keep an eye on
                </p>
                <ul className="space-y-1.5 text-sm leading-6 text-muted-foreground">
                  {assessment.gapsToWatch.map((gap, idx) => (
                    <li key={idx}>• {gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Suggested v1 Offer Draft */}
          <div className="space-y-4 rounded-2xl border border-primary/30 bg-primary/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Suggested v1 Offer Draft (you&apos;ll edit &amp; lock this next)
            </p>
            <h2 className="text-xl font-bold text-foreground">
              {assessment.suggestedOffer.title}
            </h2>
            <p className="text-sm leading-6 text-foreground">
              {assessment.suggestedOffer.promise}
            </p>
            <div className="grid gap-4 pt-2 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Included in v1
                </p>
                <p className="mt-1 text-muted-foreground">
                  {assessment.suggestedOffer.includedSummary}
                </p>
              </div>
              <div className="rounded-xl bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Explicitly left out of v1
                </p>
                <p className="mt-1 text-muted-foreground">
                  {assessment.suggestedOffer.excludedSummary ||
                    'Anything not listed in v1'}
                </p>
              </div>
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
              Refine &amp; lock your v1 offer
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}