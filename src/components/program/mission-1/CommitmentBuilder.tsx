'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

// Adjust import path if your commitment action is elsewhere
import { saveCommitment } from '@/actions/commitments'; 

export function CommitmentBuilder({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = progress.payload ?? {};

  const [commitment, setCommitment] = useState(
    typeof saved.commitment === 'string' ? saved.commitment : ''
  );
  
  const [isCommitted, setIsCommitted] = useState(saved.completed === true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = commitment.trim().length >= 10;

  async function handleSaveCommitment() {
    if (!canSubmit || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Save directly to the dedicated commitments table
      await saveCommitment({
        statement: commitment.trim(),
        source_node_key: nodeKey,
      });

      setIsCommitted(true);
    } catch (err: any) {
      console.error('[COMMITMENT BUILDER]', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    await onComplete({
      commitment: commitment.trim(),
      completed: true,
    });
  }

  return (
    <div className="w-full space-y-10">
      
      {!isCommitted ? (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {node.title || "Draw your line in the sand."}
            </h2>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
              Don't promise an outcome you can't control, like making a certain amount of money or getting a specific number of users. Promise a behavior. What is the actual, unglamorous thing you are willing to commit to right now?
            </p>
          </div>

          <div className="max-w-3xl space-y-4">
            <Textarea
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
              placeholder="I commit to..."
              className="min-h-[160px] resize-none text-lg leading-8 font-medium"
              disabled={isSubmitting}
            />
            <p className="text-sm leading-6 text-muted-foreground">
              Make it small enough to be real, but heavy enough to matter.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex max-w-3xl justify-end">
            <Button
              onClick={handleSaveCommitment}
              disabled={!canSubmit || isSubmitting}
              className="h-12 gap-2 rounded-full px-8 text-base"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Committing...</>
              ) : (
                'Lock it in'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl space-y-12 duration-700">
          <div className="space-y-4">
            <h2 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
              Line drawn.
            </h2>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
              <p className="font-heading text-2xl font-medium leading-relaxed text-foreground">
                "{commitment}"
              </p>
            </div>
            <p className="text-lg leading-8 text-muted-foreground pt-4">
              We have recorded this. It will serve as your baseline moving forward.
            </p>
          </div>

          <div className="flex">
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="h-12 gap-2 rounded-full px-8 text-base"
            >
              {isSubmitting ? 'Finalizing Quest...' : 'Complete Quest 1'}
              {!isSubmitting && <ArrowRight className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}