'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $userContext } from '@/lib/stores/user-context';
import { saveObservation } from '@/actions/observations';

// Adjust import path based on where you put the action
import { generateAssetReveal } from '@/actions/responses/mission1'; 

export function AssetReveal({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
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
        const assetData = {
          resources: userContext.resources || {},
          networks: userContext.network_context || [],
          capabilities: userContext.capabilities || {},
          experience: userContext.experience || {},
        };

        const result = await generateAssetReveal(assetData, nodeKey);
        setSynthesis(result);
        
        await saveObservation({
          title: 'Unfair Advantage',
          content: result,
          domain: 'solution',
          focus: 'personal',
          source_node_key: nodeKey,
        });

      } catch (error) {
        console.error('[ASSET REVEAL ERROR]', error);
        setSynthesis("You have a unique combination of traits and experiences that cannot be easily replicated. This is your baseline leverage.");
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

  return (
    <div className="w-full space-y-12">
      
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || "Your unfair advantage."}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          We often focus on what we lack—capital, a technical degree, or free time. But leverage isn't about having everything; it's about aggressively utilizing the specific things you do have.
        </p>
      </div>

      <div className="max-w-3xl rounded-2xl border border-border bg-card p-8 sm:p-10 min-h-[200px]">
        {isGenerating ? (
          <div className="flex h-full flex-col items-center justify-center space-y-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Analyzing your baseline leverage...</p>
          </div>
        ) : synthesis ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
            <p className="text-xl leading-8 text-foreground font-medium">
              {synthesis}
            </p>
            <div className="flex pt-4">
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