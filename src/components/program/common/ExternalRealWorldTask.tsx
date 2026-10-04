'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveObservation } from '@/actions/observations';

export function ExternalRealWorldTask({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = progress.payload ?? {};

  const [step, setStep] = useState<'action' | 'reflection' | 'done'>(
    saved.completed ? 'done' : saved.reflection ? 'reflection' : 'action'
  );
  const [reflection, setReflection] = useState(
    typeof saved.reflection === 'string' ? saved.reflection : ''
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkActionDone() {
    setStep('reflection');
  }

  async function handleSaveReflection() {
    if (reflection.trim().length < 10 || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await saveObservation({
        title: `Task Execution: ${node.title}`,
        content: reflection.trim(),
        domain: 'execution',
        focus: 'personal',
        source_node_key: nodeKey,
      });
      setStep('done');
    } catch (err) {
      setError('Failed to save reflection.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await onComplete({ reflection: reflection.trim(), completed: true });
  }

  return (
    <div className="w-full space-y-10">
      
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>
        {node.description && (
          <div className="max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-8">
            <p className="text-lg leading-8 text-foreground font-medium whitespace-pre-wrap">
              {node.description}
            </p>
          </div>
        )}
      </div>

      {step === 'action' && (
        <div className="flex max-w-3xl justify-end">
          <Button onClick={handleMarkActionDone} className="h-12 gap-2 rounded-full px-8 text-base">
            <Check className="h-5 w-5" />
            I have completed this action
          </Button>
        </div>
      )}

      {step === 'reflection' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl space-y-6 duration-700">
          <div className="space-y-4">
            <label className="text-lg font-medium text-foreground">
              {node.prompt || "How did it feel to actually do that?"}
            </label>
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="The hardest part was..."
              className="min-h-[160px] resize-none text-lg leading-8"
              disabled={isSubmitting}
            />
          </div>
          
          {error && <p className="text-sm text-destructive">{error}</p>}
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveReflection} 
              disabled={reflection.trim().length < 10 || isSubmitting} 
              className="h-12 gap-2 rounded-full px-8 text-base"
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</> : 'Lock in reflection'}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl space-y-8 border-t border-border pt-8 duration-700">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
            <p className="text-lg leading-8 text-foreground font-medium">
              "{reflection}"
            </p>
          </div>
          <Button onClick={handleComplete} disabled={isSubmitting} className="h-12 gap-2 rounded-full px-8 text-base">
            {isSubmitting ? 'Moving forward...' : 'Continue'}
            {!isSubmitting && <ArrowRight className="h-5 w-5" />}
          </Button>
        </div>
      )}

    </div>
  );
}