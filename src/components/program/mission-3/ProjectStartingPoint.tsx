'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Compass, HelpCircle, Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechContent } from '@/components/ui/speech-content';
import { $progress } from '@/lib/stores/progress';
import {
  fetchMission3ContextSummary,
} from '@/actions/experiments';

import type {Mission3ContextSummary} from '@/lib/types/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

const APPROACH_LABELS: Record<string, string> = {
  do_for_them: 'Do it for them (product or service)',
  tool: 'Give them a tool (software or app)',
  connect: 'Connect them (marketplace or matching)',
  teach: 'Teach them (information or course)',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function ProjectStartingPoint({
  node,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);
  const [context, setContext] = useState<Mission3ContextSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchMission3ContextSummary()
      .then((data) => {
        if (!alive) return;
        setContext(data);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const m2ActionPayload = isRecord(progressState.payloads['m2-action'])
    ? progressState.payloads['m2-action']
    : {};

  const forwardQuestion =
    typeof m2ActionPayload.forwardQuestion === 'string' &&
    m2ActionPayload.forwardQuestion.trim()
      ? m2ActionPayload.forwardQuestion.trim()
      : typeof context?.project?.metadata?.forwardQuestion === 'string'
        ? context.project.metadata.forwardQuestion
        : '';

  const approach = isRecord(context?.opportunity?.metadata?.approach)
    ? context?.opportunity?.metadata?.approach
    : null;
  const approachType =
    typeof approach?.type === 'string' ? approach.type : null;
  const approachDescription =
    typeof approach?.description === 'string' ? approach.description : '';

  const readAloudText = useMemo(() => {
    return [
      node.title || "You're about to put this in front of people.",
      node.description || '',
      context?.project?.title ? `Your project: ${context.project.title}.` : '',
      forwardQuestion
        ? `The question you brought from Mission 2: ${forwardQuestion}`
        : '',
    ]
      .filter(Boolean)
      .join(' ');
  }, [node.title, node.description, context?.project?.title, forwardQuestion]);

  async function handleContinue() {
    if (isContinuing) return;
    setIsContinuing(true);
    try {
      await onComplete({
        completed: true,
        projectId: context?.project?.id ?? null,
        opportunityId: context?.opportunity?.id ?? null,
      });
    } finally {
      setIsContinuing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your project starting point…
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
              Mission 3 · Test the Problem
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {node.title}
          </h1>
          <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
            {node.description}
          </p>
        </div>

        {/* Active Project Card */}
        {context?.project && (
          <div className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Active Project
              </p>
              <h2 className="text-xl font-bold text-foreground">
                {context.project.title}
              </h2>
              {context.project.description && (
                <p className="text-sm leading-6 text-muted-foreground">
                  {context.project.description}
                </p>
              )}
            </div>

            {approachType && (
              <div className="rounded-xl bg-muted/40 p-4 text-sm">
                <p className="font-semibold text-foreground">
                  How you&apos;re thinking of helping:{' '}
                  <span className="text-primary">
                    {APPROACH_LABELS[approachType] ?? approachType}
                  </span>
                </p>
                {approachDescription && (
                  <p className="mt-1 text-muted-foreground">
                    {approachDescription}
                  </p>
                )}
              </div>
            )}

            {forwardQuestion && (
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
                <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">
                    The question you brought from Mission 2
                  </p>
                  <p className="leading-6 text-muted-foreground">
                    &ldquo;{forwardQuestion}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Two Core Questions of Mission 3 */}
        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-primary">
              <Target className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Question 1
              </span>
            </div>
            <h3 className="font-bold text-foreground">
              Do people want this problem solved?
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Not polite nods from friends—genuine interest from people who deal
              with this frustration regularly.
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-primary">
              <Target className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Question 2
              </span>
            </div>
            <h3 className="font-bold text-foreground">
              Does it hurt enough to act?
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Will they take a real step—leaving their contact, replying with
              their story, or claiming an early spot?
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
              Check how you can reach people
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}