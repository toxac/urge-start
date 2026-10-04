'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { updateUserProgramContext } from '@/actions/user-context';

const RESOURCE_DIMENSIONS = [
  { id: 'capital', label: 'Financial Capital', left: 'Deeply constrained', right: 'Plentiful runway' },
  { id: 'time', label: 'Available Time', left: 'Fully booked', right: 'Wide open schedules' },
  { id: 'knowhow', label: 'Industry Know-How', left: 'Starting from zero', right: 'Deep domain expertise' },
  { id: 'energy', label: 'Mental Energy', left: 'Nearing burnout', right: 'Highly energized' },
];

export function ResourceInventory({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = progress.payload ?? {};
  
  const [scores, setScores] = useState<Record<string, number>>(
    saved.scores || { capital: 3, time: 3, knowhow: 3, energy: 3 }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSliderChange = (id: string, value: number) => {
    setScores(prev => ({ ...prev, [id]: value }));
  };

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await updateUserProgramContext({
        resources: scores
      });
      await onComplete({ scores, completed: true });
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full space-y-12">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || "Map your current reality."}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Constraints breed creativity, and abundant resources can make you lazy. Be brutally honest about where you are starting from right now.
        </p>
      </div>

      <div className="max-w-3xl space-y-10">
        {RESOURCE_DIMENSIONS.map((dim) => (
          <div key={dim.id} className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="font-heading text-xl font-medium">{dim.label}</label>
            </div>
            
            <input 
              type="range" 
              min="1" max="5" step="1"
              value={scores[dim.id]} 
              onChange={(e) => handleSliderChange(dim.id, parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            
            <div className="flex justify-between text-sm font-medium text-muted-foreground">
              <span>{dim.left}</span>
              <span>{dim.right}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex max-w-3xl justify-end border-t border-border pt-8">
        <Button onClick={handleComplete} disabled={isSubmitting} className="h-12 gap-2 rounded-full px-8 text-base">
          {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</> : 'Lock it in'}
          {!isSubmitting && <ArrowRight className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}