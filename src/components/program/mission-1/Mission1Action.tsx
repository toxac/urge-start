'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function Mission1Action({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const saved = progress.payload ?? {};

  const [decision, setDecision] = useState(
    typeof saved.decision === 'string' ? saved.decision : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = decision.trim().length >= 10;

  async function handleComplete() {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onComplete({
        decision: decision.trim(),
        completed: true,
      });
    } catch (error) {
      console.error('[MISSION 1 ACTION]', error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-3xl space-y-10">
      <div className="space-y-5">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'What are you taking with you?'}
        </h2>

        <p className="text-lg leading-8 text-muted-foreground">
          You don't need to feel ready before you move. You've now experienced
          what happens when you stop waiting, involve people, ask, and learn
          from what actually happens.
        </p>
      </div>

      <div className="space-y-4">
        <label
          htmlFor="mission-1-decision"
          className="text-xl font-medium text-foreground"
        >
          What do you want to carry into the next mission?
        </label>

        <p className="text-base text-muted-foreground">
          Put it in your own words.
        </p>

        <Textarea
          id="mission-1-decision"
          value={decision}
          onChange={(event) => setDecision(event.target.value)}
          placeholder="In my own words..."
          className="min-h-[160px] resize-none text-lg leading-8"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleComplete}
          disabled={!canSubmit || isSubmitting}
          className="h-14 gap-2 rounded-full px-8 text-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Complete Mission 1
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}