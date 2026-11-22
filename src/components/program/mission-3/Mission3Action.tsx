'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { AlertCircle, ArrowRight, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import {
  $userExperiments,
  userExperimentsActions,
} from '@/lib/stores/experiments';
import {
  fetchMission3ContextSummary,
  fetchUserExperiments,
  saveUserExperimentReflection,
} from '@/actions/experiments';
import type {
  ExperimentWarmLead,
  Mission3ContextSummary,
} from '@/lib/types/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type Mission3ActionPayload = {
  completed?: boolean;
  problemStatement?: string;
  planAroundNote?: string;
  warmLeads?: ExperimentWarmLead[];
};

export function Mission3Action({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const userExpState = useStore($userExperiments);
  const saved = (progress.payload ?? {}) as Mission3ActionPayload;

  const [context, setContext] = useState<Mission3ContextSummary | null>(null);
  const [problemStatement, setProblemStatement] = useState(
    saved.problemStatement ?? '',
  );
  const [planAroundNote, setPlanAroundNote] = useState(
    saved.planAroundNote ?? '',
  );

  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [ctx, loadedRuns] = await Promise.all([
          fetchMission3ContextSummary(),
          userExpState.hydrated
            ? Promise.resolve(
                userExpState.allIds.map((id) => userExpState.byId[id]),
              )
            : fetchUserExperiments({ missionKey: 'mission-3' }),
        ]);

        if (!alive) return;
        setContext(ctx);
        if (!userExpState.hydrated && loadedRuns.length > 0) {
          userExperimentsActions.hydrate(loadedRuns);
        }

        const m3Runs = loadedRuns.filter((e) => e.mission_key === 'mission-3');
        const pitchPain =
          m3Runs.find((e) => e.setup?.pitch?.pain)?.setup?.pitch?.pain ??
          ctx.opportunity?.problem ??
          ctx.project?.description ??
          '';

        setProblemStatement((prev) => (prev.trim() ? prev : pitchPain));
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const missionExperiments = useMemo(() => {
    return userExpState.allIds
      .map((id) => userExpState.byId[id])
      .filter((exp) => exp && exp.mission_key === 'mission-3');
  }, [userExpState]);

  const warmLeads = useMemo(() => {
    const seen = new Set<string>();
    const list: ExperimentWarmLead[] = [];
    for (const exp of missionExperiments) {
      for (const lead of exp.results?.warm_leads ?? []) {
        const key = `${lead.name.toLowerCase()}|${lead.contact.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(lead);
        }
      }
    }
    return list;
  }, [missionExperiments]);

  async function handleFinishMission3() {
    if (committing) return;
    if (!problemStatement.trim()) {
      setError('Please confirm the problem statement you are carrying forward.');
      return;
    }
    if (!planAroundNote.trim()) {
      setError(
        'Please write down the one thing you most need to plan around in Mission 4.',
      );
      return;
    }

    setCommitting(true);
    setError(null);

    try {
      const activeToComplete = missionExperiments.filter(
        (exp) => exp.status !== 'parked' && exp.status !== 'iterated',
      );

      const completed = await Promise.all(
        activeToComplete.map((exp) =>
          saveUserExperimentReflection(exp.id, exp.reflection, {
            markCompleted: true,
          }),
        ),
      );

      userExperimentsActions.upsertMany(completed);

      await onComplete({
        completed: true,
        projectId: context?.project?.id ?? null,
        problemStatement: problemStatement.trim(),
        planAroundNote: planAroundNote.trim(),
        warmLeads,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not complete Mission 3.',
      );
      setCommitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Preparing your handoff to Mission 4…
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

      {/* 1. Refined Problem Statement */}
      <div className="max-w-3xl space-y-2">
        <h2 className="text-xl font-bold">
          1. The problem in your own words
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Update this if running your tests sharpened how you describe the
          problem.
        </p>
        <SpeechTextarea
          rows={3}
          value={problemStatement}
          onChange={(e) => {
            setProblemStatement(e.target.value);
            setError(null);
          }}
          disabled={committing}
          className="text-base leading-7"
        />
      </div>

      {/* 2. Warm List */}
      <div className="max-w-3xl space-y-3 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">
            2. People who raised their hand ({warmLeads.length})
          </h2>
        </div>

        {warmLeads.length > 0 ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {warmLeads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-xl bg-muted/40 p-3.5 text-sm"
              >
                <p className="font-semibold text-foreground">{lead.name}</p>
                {lead.contact && (
                  <p className="text-xs text-primary">{lead.contact}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {lead.action_taken}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No warm contacts logged yet—you can still move forward and add
            people as you talk to them in Mission 4.
          </p>
        )}
      </div>

      {/* 3. Key Thing to Plan Around */}
      <div className="max-w-3xl space-y-2">
        <h2 className="text-xl font-bold">
          3. What do you most need to plan around?
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Name the single most important constraint, expectation, or insight
          from your tests that your business plan in Mission 4 has to respect.
        </p>
        <SpeechTextarea
          rows={3}
          value={planAroundNote}
          onChange={(e) => {
            setPlanAroundNote(e.target.value);
            setError(null);
          }}
          disabled={committing}
          placeholder="e.g. Cafe owners only have 2 minutes at closing—anything that takes longer than a quick phone check-in will get ignored..."
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
          onClick={() => void handleFinishMission3()}
          disabled={committing}
          className="h-12 rounded-full px-8 text-base"
        >
          {committing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Finish Mission 3 &amp; Enter Mission 4
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}