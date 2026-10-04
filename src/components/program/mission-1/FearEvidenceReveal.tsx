'use client';

import { useEffect, useState, useRef } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveObservation } from '@/actions/observations';

// Ensure these actions exist in your mission1.ts file as defined earlier
import { getQuest4Reflections, generateRejectionSynthesis } from '@/actions/responses/mission1';

export function FearEvidenceReveal({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = progress.payload ?? {};

  const [synthesis, setSynthesis] = useState<string | null>(
    typeof saved.synthesis === 'string' ? saved.synthesis : null
  );
  const [reflections, setReflections] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(!saved.synthesis);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    async function fetchSynthesis() {
      if (hasFetchedRef.current || synthesis) return;
      hasFetchedRef.current = true;
      setIsGenerating(true);

      try {
        const rawReflections = await getQuest4Reflections();
        setReflections(rawReflections);

        if (rawReflections.length > 0) {
          const result = await generateRejectionSynthesis(rawReflections, nodeKey);
          setSynthesis(result);
          
          await saveObservation({
            title: 'Rejection Synthesis',
            content: result,
            domain: 'reflection',
            focus: 'personal',
            source_node_key: nodeKey,
          });
        } else {
          setSynthesis("You faced the rejection, but we couldn't find your written reflections. The important part is that you realized a 'no' is just data, not a disaster.");
        }
      } catch (error) {
        console.error('[FEAR REVEAL ERROR]', error);
        setSynthesis("The anticipation of rejection is always worse than the rejection itself. You survived the 'no'. That means it no longer controls what you are willing to ask for.");
      } finally {
        setIsGenerating(false);
      }
    }

    fetchSynthesis();
  }, [synthesis, nodeKey]);

  async function handleComplete() {
    if (isSubmitting || !synthesis) return;
    setIsSubmitting(true);
    await onComplete({ synthesis, completed: true });
  }

  return (
    <div className="w-full space-y-12">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || "The Autopsy of a No"}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          You went out and intentionally got rejected. Let's look at what actually happened in your own words.
        </p>
      </div>

      {reflections.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 max-w-4xl">
          {reflections.map((ref, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2">
                {ref.title}
              </h3>
              <p className="text-base leading-7 text-foreground italic">"{ref.content}"</p>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-4xl border-t border-border pt-8 min-h-[160px]">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Analyzing your response to rejection...</p>
          </div>
        ) : synthesis ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
            <p className="text-xl leading-8 text-foreground font-medium">
              {synthesis}
            </p>
            <div className="flex">
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