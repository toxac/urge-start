'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $userContext } from '@/lib/stores/user-context';
import { $progress } from '@/lib/stores/progress';
import { generateQuadrantSynthesis } from '@/actions/responses/mission1';
import { saveObservation } from '@/actions/observations';

export function CommitmentSynthesis({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  // 1. Grab data from the Context Store
  const rawContext = useStore($userContext);
  const context = (rawContext as any)?.userContext || rawContext || {};

  // 2. Grab data from the Progress Store (Fallback if context hasn't updated yet)
  const progressState = useStore($progress);
  // Assuming the node before this was m1-q1-investigate
  const investigatePayload = progressState.payloads?.['m1-q1-investigate'] || {};

  const saved = progress.payload ?? {};

  const [synthesis, setSynthesis] = useState<string | null>(
    typeof saved.synthesis === 'string' ? saved.synthesis : null
  );
  const [isGenerating, setIsGenerating] = useState(!saved.synthesis);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Prevent double-fetching
    if (hasFetchedRef.current || synthesis) return;

    // Resolve the data from either the Context Store or the previous node's Progress Payload
    const qData = {
      motivation: context.motivations || investigatePayload.motivations,
      barrier: context.perceived_barriers || investigatePayload.perceived_barriers,
      future: context.desired_future || investigatePayload.desired_future,
      quit: context.quit_conditions || investigatePayload.quit_conditions,
    };

    // We use a small timeout to ensure Nanostores has fully hydrated before we check for missing data
    const timer = setTimeout(async () => {
      hasFetchedRef.current = true;
      setIsGenerating(true);

      // If data is genuinely missing after hydration, fall back safely so you don't get stuck
      if (!qData.motivation || !qData.barrier) {
        console.warn('[SYNTHESIS] Missing quadrant data in both context and progress stores.');
        setSynthesis("You have a clear picture of what you want and what stands in your way. The friction between these realities is where the actual work begins.");
        setIsGenerating(false);
        return;
      }

      try {
        const quadrantData = {
          motivation: `${qData.motivation.title}: ${qData.motivation.elaboration}`,
          barrier: `${qData.barrier.title}: ${qData.barrier.elaboration}`,
          future: `${qData.future?.title || 'Not provided'}: ${qData.future?.elaboration || 'Not provided'}`,
          quit: `${qData.quit?.title || 'Not provided'}: ${qData.quit?.elaboration || 'Not provided'}`,
        };

        const result = await generateQuadrantSynthesis(quadrantData, nodeKey);
        setSynthesis(result);
        
        await saveObservation({
          title: 'Quadrant Synthesis',
          content: result,
          domain: 'problem',
          focus: 'personal',
          source_node_key: nodeKey,
        });

      } catch (error) {
        console.error('[SYNTHESIS ERROR]', error);
        setSynthesis("You have a clear picture of what you want and what stands in your way. The friction between these realities is where the actual work begins.");
      } finally {
        setIsGenerating(false);
      }
    }, 500); // Wait 500ms for stores to settle

    return () => clearTimeout(timer);
  }, [context, investigatePayload, synthesis, nodeKey]);

  async function handleComplete() {
    if (isSubmitting || !synthesis) return;
    setIsSubmitting(true);
    await onComplete({ synthesis, completed: true });
  }

  // Helper to render the UI safely
  const renderQuadrant = (title: string, data: any) => {
    if (!data) return (
      <div className="flex flex-col space-y-2 rounded-xl bg-card/50 p-6 border border-border border-dashed">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground/50 italic">No data recorded.</p>
      </div>
    );
    return (
      <div className="flex flex-col space-y-2 rounded-xl bg-card p-6 border border-border">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
        <p className="font-heading text-lg font-medium text-foreground">{data.title}</p>
        <p className="text-sm leading-6 text-muted-foreground line-clamp-3">"{data.elaboration}"</p>
      </div>
    );
  };

  // Derive the display data (so the UI matches what the AI analyzed)
  const displayData = {
    motivation: context.motivations || investigatePayload.motivations,
    barrier: context.perceived_barriers || investigatePayload.perceived_barriers,
    future: context.desired_future || investigatePayload.desired_future,
    quit: context.quit_conditions || investigatePayload.quit_conditions,
  };

  return (
    <div className="w-full space-y-12">
      
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Before we draw a line in the sand, let's look at exactly what you just told us.
        </p>
      </div>

      <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
        {renderQuadrant("The Pull", displayData.motivation)}
        {renderQuadrant("The Hold", displayData.barrier)}
        {renderQuadrant("The Stakes", displayData.future)}
        {renderQuadrant("The Boundary", displayData.quit)}
      </div>

      <div className="max-w-3xl border-t border-border pt-8 min-h-[160px]">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Looking for the tension...</p>
          </div>
        ) : synthesis ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
            <p className="text-xl leading-8 text-foreground font-medium">
              {synthesis}
            </p>
            <div className="flex">
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="h-12 gap-2 rounded-full px-8 text-base"
              >
                {isSubmitting ? 'Moving forward...' : 'I see it'}
                {!isSubmitting && <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

    </div>
  );
}