'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { updateUserProgramContext } from '@/actions/user-context';
import { saveObservation } from '@/actions/observations';

const EXPERIENCE_PROOFS = [
  { id: 'de_escalation', title: 'De-escalating an angry person', description: 'Taking someone from furious to calm and cooperative.' },
  { id: 'self_taught', title: 'Teaching yourself a complex skill', description: 'Figuring out how to do something hard without a formal teacher or manual.' },
  { id: 'organizing', title: 'Organizing a chaotic event', description: 'Herding cats to make sure people showed up at the right place and time.' },
  { id: 'persuasion', title: 'Selling something successfully', description: 'Getting someone to part with their money or time, even outside a formal sales role.' },
  { id: 'ownership', title: 'Fixing a problem that wasn\'t yours', description: 'Stepping in to solve an issue simply because it was broken and nobody else would.' },
  { id: 'budgeting', title: 'Stretching a tiny budget', description: 'Making a very small amount of money or resources go much further than it should have.' },
];

export function ExperienceMiner({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
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
      if (prev.length >= 3) return prev; 
      return [...prev, id];
    });
  };

  async function handleSave() {
    if (!canSubmit || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const selectedExperiences = EXPERIENCE_PROOFS.filter(t => selectedIds.includes(t.id));
      
      await updateUserProgramContext({
        experience: {
          proofs: selectedExperiences.map(t => t.title),
          elaboration: elaboration.trim()
        }
      });

      await saveObservation({
        title: 'Adjacent Experience',
        content: `Experiences: ${selectedExperiences.map(t => t.title).join(', ')}. Proof: ${elaboration.trim()}`,
        domain: 'solution',
        focus: 'personal',
        source_node_key: nodeKey,
      });

      setIsCommitted(true);
    } catch (err: any) {
      console.error('[EXPERIENCE MINER]', err);
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
          {node.title || "Mine your history for proof."}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          You might not have "founder" on your resume, but you have likely done the hard parts of building a business in other areas of your life. Which of these have you actually done? Pick up to three.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-4xl">
        {EXPERIENCE_PROOFS.map((option) => {
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
                  Document exactly how you did it in one of those instances.
                </label>
                <Textarea
                  value={elaboration}
                  onChange={(e) => setElaboration(e.target.value)}
                  placeholder="I had to handle this when..."
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
                That is operational proof. You have the necessary experience, even if the context changes.
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