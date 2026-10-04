'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveCommitment } from '@/actions/commitments';

export function LearningAction({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = progress.payload ?? {};

  const [rule, setRule] = useState(
    typeof saved.rule === 'string' ? saved.rule : ''
  );
  
  const [isCommitted, setIsCommitted] = useState(saved.completed === true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = rule.trim().length >= 10;

  async function handleSaveRule() {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await saveCommitment({
        statement: `Rule of Engagement: ${rule.trim()}`,
        source_node_key: nodeKey,
      });
      setIsCommitted(true);
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await onComplete({ rule: rule.trim(), completed: true });
  }

  return (
    <div className="w-full space-y-10">
      
      {!isCommitted ? (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {node.title || "Establish a Rule of Engagement."}
            </h2>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
              You will feel this exact friction again. Based on what you just learned, write down a personal rule for how you will handle it next time. (e.g., "If I hesitate for more than 5 minutes, I have to hit send," or "I will not let my fear of looking foolish make decisions for me.")
            </p>
          </div>

          <div className="max-w-3xl space-y-4">
            <Textarea
              value={rule}
              onChange={(e) => setRule(e.target.value)}
              placeholder="My new rule is..."
              className="min-h-[160px] resize-none text-lg leading-8 font-medium"
              disabled={isSubmitting}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex max-w-3xl justify-end">
            <Button onClick={handleSaveRule} disabled={!canSubmit || isSubmitting} className="h-12 gap-2 rounded-full px-8 text-base">
              {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</> : 'Lock it in'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl space-y-12 duration-700">
          <div className="space-y-4">
            <h2 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
              Rule established.
            </h2>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
              <p className="font-heading text-2xl font-medium leading-relaxed text-foreground">
                "{rule}"
              </p>
            </div>
            <p className="text-lg leading-8 text-muted-foreground pt-4">
              This rule is now part of your operating system.
            </p>
          </div>

          <div className="flex">
            <Button onClick={handleComplete} disabled={isSubmitting} className="h-12 gap-2 rounded-full px-8 text-base">
              {isSubmitting ? 'Finalizing Quest...' : 'Complete Quest 3'}
              {!isSubmitting && <ArrowRight className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}