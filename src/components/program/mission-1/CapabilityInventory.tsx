'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { updateUserProgramContext } from '@/actions/user-context';
import { saveObservation } from '@/actions/observations';

const CAPABILITY_TRAITS = [
  { id: 'chaos_to_order', title: 'Translating chaos into order', description: 'Taking messy, undefined problems and creating a clear system or process.' },
  { id: 'reading_the_room', title: 'Reading the room', description: 'Understanding what people actually want or feel, even when they don\'t say it.' },
  { id: 'tinkering', title: 'Tinkering with broken systems', description: 'Taking things apart (software, machines, rules) to figure out how to make them work better.' },
  { id: 'selling_ideas', title: 'Selling ideas to skeptics', description: 'Convincing people to buy in when they start out doubting you.' },
  { id: 'deep_focus', title: 'Obsessive deep work', description: 'Locking into a single hard problem for hours until it is solved.' },
  { id: 'rallying_people', title: 'Rallying people', description: 'Getting a group of unorganized people moving in the exact same direction.' },
];

export function CapabilityInventory({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = progress.payload ?? {};

  const [selectedIds, setSelectedIds] = useState<string[]>(
    Array.isArray(saved.selectedIds) ? saved.selectedIds : []
  );
  
  const [elaboration, setElaboration] = useState(
    typeof saved.elaboration === 'string' ? saved.elaboration : ''
  );
  
  const [isCommitted, setIsCommitted] = useState(saved.completed === true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = selectedIds.length > 0 && elaboration.trim().length >= 10;

  const toggleSelection = (id: string) => {
    if (isCommitted) return;
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev; // Limit to max 3
      return [...prev, id];
    });
  };

  async function handleSave() {
    if (!canSubmit || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const selectedTraits = CAPABILITY_TRAITS.filter(t => selectedIds.includes(t.id));
      
      // Save to context
      await updateUserProgramContext({
        capabilities: {
          traits: selectedTraits.map(t => t.title),
          elaboration: elaboration.trim()
        }
      });

      // Save as an observation for AI Synthesis
      await saveObservation({
        title: 'Behavioral Leverage',
        content: `Traits: ${selectedTraits.map(t => t.title).join(', ')}. Proof: ${elaboration.trim()}`,
        domain: 'solution',
        focus: 'personal',
        source_node_key: nodeKey,
      });

      setIsCommitted(true);
    } catch (err: any) {
      console.error('[CAPABILITY]', err);
      setError('Something went wrong saving your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    await onComplete({
      selectedIds,
      elaboration: elaboration.trim(),
      completed: true,
    });
  }

  return (
    <div className="w-full space-y-10">
      
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || "Identify your actual leverage."}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Forget your job title. Titles are boxes other people put you in. What is the actual, behavioral trait you rely on when things get hard? Pick up to three.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-4xl">
        {CAPABILITY_TRAITS.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          const isDisabled = !isSelected && selectedIds.length >= 3;

          return (
            <button
              key={option.id}
              onClick={() => toggleSelection(option.id)}
              disabled={isCommitted || (isDisabled && !isCommitted)}
              className={`group relative flex flex-col items-start rounded-2xl border p-6 text-left transition-all ${
                isSelected 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                  : isDisabled && !isCommitted
                  ? 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
              } ${isCommitted ? 'cursor-default' : ''}`}
            >
              <div className="flex w-full items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className={`font-heading text-xl font-medium ${isSelected ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'}`}>
                    {option.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                
                <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                }`}>
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedIds.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl space-y-8 duration-700">
          
          {!isCommitted ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-lg font-medium text-foreground">
                  Give us one brief example of a time you had to use this in the real world.
                </label>
                <Textarea
                  value={elaboration}
                  onChange={(e) => setElaboration(e.target.value)}
                  placeholder="At my last job, I had to..."
                  className="min-h-[160px] resize-none text-lg leading-8"
                  disabled={isSubmitting}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSave}
                  disabled={!canSubmit || isSubmitting}
                  className="h-12 rounded-full px-8 text-base"
                >
                  {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</> : "Lock this in"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 border-t border-border pt-8">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
                <p className="text-lg leading-8 text-foreground font-medium">
                  "{elaboration}"
                </p>
              </div>
              <p className="text-lg leading-8 text-muted-foreground">
                That is the exact muscle you will use to build this. We have saved this to your inventory.
              </p>
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="h-12 gap-2 rounded-full px-8 text-base"
              >
                {isSubmitting ? 'Moving forward...' : 'Continue'}
                {!isSubmitting && <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}