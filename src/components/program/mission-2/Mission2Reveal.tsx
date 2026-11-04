'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchUserOpportunities } from '@/actions/opportunities';
import { $observations } from '@/lib/stores/observations';
import { useStore } from '@nanostores/react';
import type { UserOpportunity } from '@/lib/types/opportunities';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function Mission2Reveal({ node, onComplete }: NodeComponentProps) {
  const [opportunities, setOpportunities] = useState<UserOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const obsState = useStore($observations);

  useEffect(() => {
    fetchUserOpportunities()
      .then((data) => {
        setOpportunities(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalObsCount = Object.keys(obsState.byId).length;

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
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Mission 2 Synthesis</span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{node.title}</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Look at how much evidence you've collected since deciding to move before you were ready.
        </p>
      </div>

      <div className="max-w-3xl grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-3xl font-bold text-foreground">{totalObsCount || '5+'}</p>
          <p className="text-sm text-muted-foreground mt-1">Problems noticed & recorded</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-3xl font-bold text-foreground">{opportunities.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Qualified opportunities investigated</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-3xl font-bold text-foreground">Real People</p>
          <p className="text-sm text-muted-foreground mt-1">Interviewed in the real world</p>
        </div>
      </div>

      <div className="max-w-3xl space-y-4 rounded-2xl border border-border p-6">
        <h2 className="text-xl font-bold">Your Candidates</h2>
        <div className="space-y-3">
          {opportunities.map((opp) => {
            const approach = (opp.metadata as Record<string, any>)?.approach;
            return (
              <div key={opp.id} className="rounded-xl bg-muted/40 p-4">
                <p className="font-semibold text-foreground">{opp.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{opp.problem || opp.description}</p>
                {approach && (
                  <p className="text-xs font-medium text-primary mt-2">
                    Approach: {approach.type.replace('_', ' ')} — {approach.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={() => onComplete({ completed: true })} className="h-12 rounded-full px-8 text-base">
          Make your commitment
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}