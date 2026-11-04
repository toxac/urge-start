'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { fetchUserOpportunities } from '@/actions/opportunities';
import { createProjectFromOpportunity } from '@/actions/projects';
import { projectsActions } from '@/lib/stores/projects';
import type { UserOpportunity } from '@/lib/types/opportunities';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function Mission2Action({ node, onComplete }: NodeComponentProps) {
  const [opportunities, setOpportunities] = useState<UserOpportunity[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [forwardQuestion, setForwardQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserOpportunities()
      .then((opps) => {
        setOpportunities(opps);
        if (opps.length > 0) setSelectedId(opps[0].id);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const selectedOpp = opportunities.find((o) => o.id === selectedId);

  const handleCommit = async () => {
    if (!selectedOpp) return;
    if (!forwardQuestion.trim()) {
      setError('Please write down the one question you most want to answer in Mission 3.');
      return;
    }

    setCommitting(true);
    setError(null);

    try {
      // 1. Create the durable user_projects record
      const project = await createProjectFromOpportunity({
        opportunityId: selectedOpp.id,
        title: selectedOpp.title,
        description: selectedOpp.problem || selectedOpp.description || selectedOpp.title,
        forwardQuestion: forwardQuestion.trim(),
      });

      projectsActions.setActive(project);

      // 2. Complete the node & advance to Mission 3
      await onComplete({
        completed: true,
        projectId: project.id,
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
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{node.title}</h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">{node.description}</p>
      </div>

      <div className="max-w-3xl space-y-4">
        <h2 className="text-xl font-bold">1. Select the opportunity to build your project around</h2>
        <div className="space-y-3">
          {opportunities.map((opp) => {
            const isSelected = selectedId === opp.id;
            const approach = (opp.metadata as Record<string, any>)?.approach;
            return (
              <div
                key={opp.id}
                onClick={() => setSelectedId(opp.id)}
                className={`cursor-pointer rounded-2xl border p-5 transition ${
                  isSelected
                    ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{opp.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{opp.problem || opp.description}</p>
                    {approach && (
                      <p className="text-xs text-primary font-medium mt-2">
                        Approach: {approach.type.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                  <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl space-y-4">
        <h2 className="text-xl font-bold">2. Take one question with you</h2>
        <p className="text-sm text-muted-foreground leading-6">
          What is the single most important thing you need to find out when you put this in front of real people in Mission 3?
        </p>
        <Textarea
          rows={3}
          value={forwardQuestion}
          onChange={(e) => setForwardQuestion(e.target.value)}
          placeholder="e.g. Will restaurant managers actually reply to cold messages offering to fix their menu, or do they ignore strangers?"
          className="resize-none text-base leading-7"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end pt-4">
        <Button onClick={handleCommit} disabled={committing} className="h-12 rounded-full px-8 text-base">
          {committing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Commit to Project & Enter Mission 3
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}