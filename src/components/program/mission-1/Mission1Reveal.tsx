'use client';

import { useEffect, useState, useRef } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveObservation } from '@/actions/observations';
import { getMission1Artifacts, generateMission1Synthesis } from '@/actions/responses/mission1';

export function Mission1Reveal({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = progress.payload ?? {};

  const [artifacts, setArtifacts] = useState<any>(saved.artifacts || null);
  const [synthesis, setSynthesis] = useState<string | null>(
    typeof saved.synthesis === 'string' ? saved.synthesis : null
  );
  
  const [isGenerating, setIsGenerating] = useState(!saved.synthesis);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    async function fetchReveal() {
      if (hasFetchedRef.current || synthesis) return;
      hasFetchedRef.current = true;
      setIsGenerating(true);

      try {
        const data = await getMission1Artifacts();
        if (data) {
          setArtifacts(data);
          const result = await generateMission1Synthesis(data, nodeKey);
          setSynthesis(result);
          
          await saveObservation({
            title: 'Mission 1 Operating System Synthesis',
            content: result,
            domain: 'reflection',
            focus: 'personal',
            source_node_key: nodeKey,
          });
        }
      } catch (error) {
        console.error('[MISSION REVEAL ERROR]', error);
        setSynthesis("You have established your baseline. The armor is built, but the real test lies in applying it to the market.");
      } finally {
        setIsGenerating(false);
      }
    }
    fetchReveal();
  }, [synthesis, nodeKey]);

  async function handleComplete() {
    if (isSubmitting || !synthesis) return;
    setIsSubmitting(true);
    await onComplete({ artifacts, synthesis, completed: true });
  }

  const renderCard = (title: string, content: string) => (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-3">{title}</h3>
      <p className="text-base leading-7 text-foreground font-medium">"{content.replace(/^(Rule of Engagement: |Rejection Protocol: )/, '')}"</p>
    </div>
  );

  return (
    <div className="w-full space-y-12">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || "Your Operating System."}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          You are no longer operating on vague ambition. This is the exact baseline you just constructed.
        </p>
      </div>

      {artifacts && (
        <div className="grid gap-4 sm:grid-cols-2 max-w-5xl">
          {renderCard("The Baseline Commitment", artifacts.lineDrawn)}
          {renderCard("Your Unfair Advantage", artifacts.leverage)}
          {renderCard("Social Engagement Rule", artifacts.socialRule)}
          {renderCard("Rejection Protocol", artifacts.rejectionProtocol)}
        </div>
      )}

      <div className="max-w-4xl border-t border-border pt-8 min-h-[200px]">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Analyzing your operating system...</p>
          </div>
        ) : synthesis ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
            <div className="space-y-6">
              {synthesis.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="text-xl leading-8 text-foreground font-medium">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="flex pt-4">
              <Button onClick={handleComplete} disabled={isSubmitting} className="h-12 gap-2 rounded-full px-8 text-base">
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