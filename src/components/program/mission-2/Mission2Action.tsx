'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import { fetchUserOpportunities } from '@/actions/opportunities';
import { createProjectFromOpportunity } from '@/actions/projects';
import { projectsActions } from '@/lib/stores/projects';
import type { UserOpportunity } from '@/lib/types/opportunities';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type Mission2ActionPayload = {
  completed?: boolean;
  projectId?: string;
  opportunityId?: string;
  forwardQuestion?: string;
};

export function Mission2Action({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const saved = (progress.payload ?? {}) as Mission2ActionPayload;

  const [opportunities, setOpportunities] = useState<UserOpportunity[]>([]);
  const [selectedId, setSelectedId] = useState<string>(
    typeof saved.opportunityId === 'string' ? saved.opportunityId : '',
  );
  const [forwardQuestion, setForwardQuestion] = useState(
    typeof saved.forwardQuestion === 'string' ? saved.forwardQuestion : '',
  );
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(
    typeof saved.projectId === 'string' ? saved.projectId : null,
  );
  const [createdForOpportunityId, setCreatedForOpportunityId] = useState<string | null>(
    typeof saved.projectId === 'string' && typeof saved.opportunityId === 'string'
      ? saved.opportunityId
      : null,
  );

  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchUserOpportunities()
      .then((opps) => {
        if (!alive) return;
        setOpportunities(opps);
        if (opps.length > 0) {
          const hasSavedMatch =
            typeof saved.opportunityId === 'string' &&
            opps.some((o) => o.id === saved.opportunityId);
          setSelectedId(hasSavedMatch ? saved.opportunityId! : opps[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (alive) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [saved.opportunityId]);

  const selectedOpp = opportunities.find((o) => o.id === selectedId);
  const alreadyCreatedForSelection =
    Boolean(createdProjectId) && createdForOpportunityId === selectedId;

  const handleCommit = async () => {
    if (!selectedOpp || committing) return;
    if (!forwardQuestion.trim()) {
      setError('Please write down the one question you most want to answer in Mission 3.');
      return;
    }

    setCommitting(true);
    setError(null);

    try {
      let projectId = createdProjectId;

      // Avoid inserting duplicate user_projects rows on revisit if already created
      // for this selected opportunity.
      if (!alreadyCreatedForSelection || !projectId) {
        const project = await createProjectFromOpportunity({
          opportunityId: selectedOpp.id,
          title: selectedOpp.title,
          description:
            selectedOpp.problem || selectedOpp.description || selectedOpp.title,
          forwardQuestion: forwardQuestion.trim(),
        });

        projectsActions.setActive(project);
        projectId = project.id;
        setCreatedProjectId(project.id);
        setCreatedForOpportunityId(selectedOpp.id);
      }

      await onComplete({
        completed: true,
        projectId,
        opportunityId: selectedOpp.id,
        forwardQuestion: forwardQuestion.trim(),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      setCommitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading opportunities…
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

      <div className="max-w-3xl space-y-4">
        <h2 className="text-xl font-bold">
          1. Select the opportunity to build your project around
        </h2>
        <div className="space-y-3">
          {opportunities.map((opp) => {
            const isSelected = selectedId === opp.id;
            const approach = (opp.metadata as Record<string, any>)?.approach;
            const feas = (opp.metadata as Record<string, any>)?.feasibility;

            return (
              <button
                key={opp.id}
                type="button"
                aria-pressed={isSelected}
                disabled={committing}
                onClick={() => {
                  setSelectedId(opp.id);
                  setError(null);
                }}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  isSelected
                    ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">{opp.title}</h3>
                      {createdProjectId && createdForOpportunityId === opp.id && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          Active project
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {opp.problem || opp.description}
                    </p>
                    {approach && (
                      <p className="pt-1 text-xs font-medium text-primary">
                        Approach: {approach.type.replace('_', ' ')}
                        {approach.description ? ` — ${approach.description}` : ''}
                      </p>
                    )}
                    {feas && (
                      <p className="text-xs text-muted-foreground">
                        Time: {feas.timeCommitment} · Capital: {feas.capitalRequirement}
                      </p>
                    )}
                  </div>
                  <div
                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl space-y-4">
        <h2 className="text-xl font-bold">2. Take one question with you</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          What is the single most important thing you need to find out when you put this in front of real people in Mission 3?
        </p>
        <SpeechTextarea
          rows={3}
          value={forwardQuestion}
          onChange={(e) => {
            setForwardQuestion(e.target.value);
            setError(null);
          }}
          disabled={committing}
          placeholder="e.g. Will restaurant managers actually reply to cold messages offering to fix their menu, or do they ignore strangers?"
          className="resize-y text-base leading-7"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleCommit()}
          disabled={committing || !selectedOpp}
          className="h-12 rounded-full px-8 text-base"
        >
          {committing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {alreadyCreatedForSelection
            ? 'Continue to Mission 3'
            : 'Commit to Project & Enter Mission 3'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}