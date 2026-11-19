'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechContent } from '@/components/ui/speech-content';
import { fetchUserOpportunities } from '@/actions/opportunities';
import { getObservations } from '@/actions/observations';
import { $observations } from '@/lib/stores/observations';
import { $progress } from '@/lib/stores/progress';
import type { UserOpportunity } from '@/lib/types/opportunities';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type OpportunityWithReflection = UserOpportunity & {
  customer_interaction_reflection?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function Mission2Reveal({ node, onComplete }: NodeComponentProps) {
  const [opportunities, setOpportunities] = useState<OpportunityWithReflection[]>([]);
  const [fetchedObsCount, setFetchedObsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContinuing, setIsContinuing] = useState(false);

  const obsState = useStore($observations);
  const progressState = useStore($progress);

  useEffect(() => {
    let alive = true;

    Promise.all([
      fetchUserOpportunities(),
      getObservations().catch(() => null),
    ])
      .then(([oppData, obsData]) => {
        if (!alive) return;
        setOpportunities(oppData as OpportunityWithReflection[]);
        if (Array.isArray(obsData)) {
          const problemObs = obsData.filter(
            (row) => row.type === 'observation' && row.domain === 'problem',
          );
          setFetchedObsCount(problemObs.length);
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

  const storeObsCount = useMemo(
    () =>
      Object.values(obsState.byId).filter(
        (row) => row.type === 'observation' && row.domain === 'problem',
      ).length,
    [obsState.byId],
  );

  const totalObsCount = fetchedObsCount ?? storeObsCount;

  const researchPausePayload = isRecord(progressState.payloads['m2-q3-action'])
    ? progressState.payloads['m2-q3-action']
    : {};
  const researchNotes =
    typeof researchPausePayload.researchNotes === 'string'
      ? researchPausePayload.researchNotes.trim()
      : '';

  const readAloudText = useMemo(() => {
    const candidateSummaries = opportunities
      .map((opp) => {
        const approach = (opp.metadata as Record<string, any>)?.approach;
        return approach?.description
          ? `${opp.title}. Approach: ${approach.description}`
          : `${opp.title}. ${opp.problem || opp.description || ''}`;
      })
      .join(' ');

    return [
      node.title || 'How you got here.',
      "Look at how much evidence you've collected since deciding to move before you were ready.",
      `${totalObsCount || '5+'} problems noticed and recorded. ${opportunities.length} qualified opportunities investigated.`,
      candidateSummaries,
      researchNotes ? `What you noticed from your search: ${researchNotes}` : '',
    ]
      .filter(Boolean)
      .join(' ');
  }, [node.title, opportunities, totalObsCount, researchNotes]);

  async function handleContinue() {
    if (isContinuing) return;
    setIsContinuing(true);
    try {
      await onComplete({ completed: true });
    } finally {
      setIsContinuing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Assembling your journey…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <SpeechContent
        textToRead={readAloudText}
        showControls="always"
        controlsPosition="top-right"
        className="space-y-10"
      >
        <div className="max-w-3xl space-y-4 pr-16">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Mission 2 Synthesis
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {node.title}
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Look at how much evidence you&apos;ve collected since deciding to move before you were ready.
          </p>
        </div>

        <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-3xl font-bold text-foreground">
              {totalObsCount > 0 ? totalObsCount : '5+'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Problems noticed &amp; recorded
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-3xl font-bold text-foreground">
              {opportunities.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Qualified opportunities investigated
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-3xl font-bold text-foreground">Real People</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Interviewed in the real world
            </p>
          </div>
        </div>

        <div className="max-w-3xl space-y-4 rounded-2xl border border-border p-6">
          <h2 className="text-xl font-bold">Your Candidates</h2>
          <div className="space-y-3">
            {opportunities.map((opp) => {
              const approach = (opp.metadata as Record<string, any>)?.approach;
              const feas = (opp.metadata as Record<string, any>)?.feasibility;
              const reflection = opp.customer_interaction_reflection?.trim();

              return (
                <div key={opp.id} className="space-y-2 rounded-xl bg-muted/40 p-4">
                  <p className="font-semibold text-foreground">{opp.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {opp.problem || opp.description}
                  </p>

                  {approach && (
                    <p className="text-xs font-medium text-primary">
                      Approach: {approach.type.replace('_', ' ')} — {approach.description}
                    </p>
                  )}

                  {feas && (
                    <p className="text-xs text-muted-foreground">
                      What it takes: Skills ({feas.hasSkills}) · Time ({feas.timeCommitment}) · Capital ({feas.capitalRequirement})
                    </p>
                  )}

                  {reflection && (
                    <p className="border-t border-border/60 pt-2 text-xs leading-5 text-muted-foreground">
                      <span className="font-medium text-foreground">What you learned: </span>
                      {reflection}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {researchNotes && (
          <div className="max-w-3xl space-y-2 rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you noticed from your search
            </p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
              {researchNotes}
            </p>
          </div>
        )}
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
              Continuing…
            </>
          ) : (
            <>
              Make your commitment
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}