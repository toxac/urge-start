'use client';

import { useEffect, useState, useRef } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveObservation } from '@/actions/observations';
import { getQuest3Reflections, generateFrictionSynthesis } from '@/actions/responses/mission1';

export function PredictionRealityReveal({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
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
        const rawReflections = await getQuest3Reflections();
        setReflections(rawReflections);

        if (rawReflections.length > 0) {
          const result = await generateFrictionSynthesis(rawReflections, nodeKey);
          setSynthesis(result);
          
          await saveObservation({
            title: 'Social Friction Synthesis',
            content: result,
            domain: 'reflection',
            focus: 'personal',
            source_node_key: nodeKey,
          });
        } else {
          setSynthesis("You moved through the friction, but we couldn't find your reflections. The important part is that you did the reps.");
        }
      } catch (error) {
        console.error('[REVEAL ERROR]', error);
        setSynthesis("The gap between what we imagine will happen and what actually happens is usually where the fear lives. You just proved you can survive the reality.");
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
          {node.title}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          You stepped out of your own head and forced the world to react. Let's look at what actually happened compared to what you feared.
        </p>
      </div>

      {reflections.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 max-w-4xl">
          {reflections.map((ref, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2">{ref.title}</h3>
              <p className="text-base leading-7 text-foreground italic">"{ref.content}"</p>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-4xl border-t border-border pt-8 min-h-[160px]">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Synthesizing the reality gap...</p>
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