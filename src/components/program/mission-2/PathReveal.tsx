'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchUserOpportunities } from '@/actions/opportunities';
import { generateFeasibilityAssessment, type FeasibilityAssessmentResult } from '@/actions/responses/mission2';
import { getNodeAILogs } from '@/actions/ai-logs';
import { useStore } from '@nanostores/react';
import { $userContext } from '@/lib/stores/user-context';
import type { UserOpportunity } from '@/lib/types/opportunities';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function PathReveal({ node, nodeKey, onComplete }: NodeComponentProps) {
  const contextState = useStore($userContext);
  const [opportunities, setOpportunities] = useState<UserOpportunity[]>([]);
  const [analysis, setAnalysis] = useState<FeasibilityAssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async (opps: UserOpportunity[]) => {
    try {
      const payload = {
        opportunities: opps.map((o) => ({
          id: o.id,
          title: o.title,
          approach: (o.metadata as Record<string, any>)?.approach || {},
          feasibility: (o.metadata as Record<string, any>)?.feasibility || {},
        })),
        userContext: contextState.userContext || {},
        nodeKey,
      };
      const result = await generateFeasibilityAssessment(payload);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Could not generate reflection');
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const opps = await fetchUserOpportunities();
        setOpportunities(opps);

        // Check ai_logs first
        const logs = await getNodeAILogs(nodeKey);
        const saved = logs.find((l) => l.purpose === 'feasibility_assessment' && l.response);

        if (saved && saved.response) {
          const resp = typeof saved.response === 'string' ? JSON.parse(saved.response) : saved.response;
          const parsed = typeof resp.content === 'string' ? JSON.parse(resp.content) : resp;
          setAnalysis(parsed);
        } else {
          await runAnalysis(opps);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [nodeKey]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    await runAnalysis(opportunities);
    setRegenerating(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 font-medium text-foreground">Comparing your opportunities side by side…</p>
        <p className="text-sm text-muted-foreground">Checking time, capital, and capabilities without forcing a score.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{node.title}</h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">{node.description}</p>
      </div>

      {analysis && (
        <section className="max-w-3xl rounded-2xl border border-primary/30 bg-primary/[0.04] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">A Mirror On Feasibility</span>
          </div>
          <p className="mt-3 text-lg leading-8 text-foreground">{analysis.overallReflection}</p>
        </section>
      )}

      {/* Side-by-side Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {opportunities.map((opp) => {
          const approach = (opp.metadata as Record<string, any>)?.approach;
          const feas = (opp.metadata as Record<string, any>)?.feasibility;
          const note = analysis?.opportunityNotes?.find((n) => n.id === opp.id);

          return (
            <div key={opp.id} className="flex flex-col justify-between space-y-4 rounded-2xl border border-border bg-card p-6">
              <div className="space-y-3">
                <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {approach?.type?.replace('_', ' ') || 'Approach'}
                </span>
                <h2 className="text-xl font-bold">{opp.title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{approach?.description || opp.problem}</p>

                <div className="border-t border-border pt-3 text-xs space-y-1.5 text-muted-foreground">
                  <p><strong>Skills:</strong> {feas?.hasSkills} {feas?.skillsNotes && `(${feas.skillsNotes})`}</p>
                  <p><strong>Time:</strong> {feas?.timeCommitment} {feas?.hasTime ? '✓ Available' : '⚠️ Strained'}</p>
                  <p><strong>Capital:</strong> {feas?.capitalRequirement}</p>
                </div>

                {note && (
                  <div className="mt-4 rounded-xl bg-muted/40 p-3 text-xs space-y-1">
                    <p className="font-semibold text-foreground">Observations:</p>
                    <p className="text-muted-foreground">{note.strengths}</p>
                    <p className="text-amber-600 dark:text-amber-400">{note.blindSpots}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {analysis?.questionsToConsider && analysis.questionsToConsider.length > 0 && (
        <div className="max-w-3xl space-y-3 rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground">Questions to carry into your research:</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            {analysis.questionsToConsider.map((q, idx) => (
              <li key={idx}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <Button variant="outline" onClick={handleRegenerate} disabled={regenerating} className="gap-2">
          {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh reflection
        </Button>

        <Button onClick={() => onComplete({ completed: true })} className="h-12 rounded-full px-8 text-base">
          Next: Research & Pause
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}