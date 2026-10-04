'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $userContext } from '@/lib/stores/user-context';
import { generateQuadrantSynthesis } from '@/actions/responses/mission1';
import { saveObservation } from '@/actions/observations';

export function CommitmentSynthesis({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const { userContext } = useStore($userContext);
  const saved = progress.payload ?? {};

  const [synthesis, setSynthesis] = useState<string | null>(
    typeof saved.synthesis === 'string' ? saved.synthesis : null
  );
  const [isGenerating, setIsGenerating] = useState(!saved.synthesis);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    async function fetchSynthesis() {
      if (hasFetchedRef.current || synthesis || !userContext) return;
      hasFetchedRef.current = true;
      setIsGenerating(true);

      try {
        const quadrantData = {
          motivation: `${(userContext.motivations as any)?.title}: ${(userContext.motivations as any)?.elaboration}`,
          barrier: `${(userContext.perceived_barriers as any)?.title}: ${(userContext.perceived_barriers as any)?.elaboration}`,
          future: `${(userContext.desired_future as any)?.title}: ${(userContext.desired_future as any)?.elaboration}`,
          quit: `${(userContext.quit_conditions as any)?.title}: ${(userContext.quit_conditions as any)?.elaboration}`,
        };

        const result = await generateQuadrantSynthesis(quadrantData, nodeKey);
        setSynthesis(result);
        
        // Save the AI's observation to the domain table for future use
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
    }

    fetchSynthesis();
  }, [userContext, synthesis, nodeKey]);

  async function handleComplete() {
    if (isSubmitting || !synthesis) return;
    setIsSubmitting(true);
    await onComplete({ synthesis, completed: true });
  }

  // Helper to render a quadrant block safely
  const renderQuadrant = (title: string, data: any) => {
    if (!data) return null;
    return (
      <div className="flex flex-col space-y-2 rounded-xl bg-card p-6 border border-border">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
        <p className="font-heading text-lg font-medium text-foreground">{data.title}</p>
        <p className="text-sm leading-6 text-muted-foreground line-clamp-3">"{data.elaboration}"</p>
      </div>
    );
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
        {renderQuadrant("The Pull", userContext?.motivations)}
        {renderQuadrant("The Hold", userContext?.perceived_barriers)}
        {renderQuadrant("The Stakes", userContext?.desired_future)}
        {renderQuadrant("The Boundary", userContext?.quit_conditions)}
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