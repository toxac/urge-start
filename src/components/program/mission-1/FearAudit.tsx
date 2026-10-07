'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $progress } from '@/lib/stores/progress';
import { saveCommitment } from '@/actions/commitments';

type ActionPayload = {
  when?: string;
  will?: string;
  insteadOf?: string;
  statement?: string;
  completed?: boolean;
};

export function FearAudit({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);
  const saved = (progress.payload ?? {}) as ActionPayload;

  const reveal = progressState.payloads['m1-q4-reveal'] ?? {};

  const [when, setWhen] = useState(
    typeof saved.when === 'string' ? saved.when : ''
  );

  const [will, setWill] = useState(
    typeof saved.will === 'string' ? saved.will : ''
  );

  const [insteadOf, setInsteadOf] = useState(
    typeof saved.insteadOf === 'string'
      ? saved.insteadOf
      : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statement =
    when.trim() && will.trim() && insteadOf.trim()
      ? `When ${when.trim()}, I will ${will.trim()} instead of ${insteadOf.trim()}.`
      : '';

  const canContinue =
    when.trim().length > 0 &&
    will.trim().length > 0 &&
    insteadOf.trim().length > 0;

  async function handleComplete() {
    if (!canContinue || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await saveCommitment({
        statement,
        source_node_key: nodeKey,
      });

      await onComplete({
        when: when.trim(),
        will: will.trim(),
        insteadOf: insteadOf.trim(),
        statement,
        completed: true,
      });
    } catch (err) {
      console.error('[FEAR ACTION]', err);
      setError(
        'Something went wrong while saving your commitment. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (progress.completed || saved.completed === true) {
    return (
      <div className="w-full max-w-4xl space-y-10">
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You have decided how you want to respond the next time
            fear shows up.
          </p>
        </div>

        {saved.statement && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
            <Check className="mb-5 h-6 w-6 text-primary" />

            <p className="font-heading text-2xl font-medium leading-relaxed">
              {saved.statement}
            </p>
          </div>
        )}

        {typeof reveal.notice === 'string' && reveal.notice && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you noticed
            </p>

            <p className="text-lg leading-8">
              {reveal.notice}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={() => onComplete(saved)}
            className="h-12 gap-2 rounded-full px-8"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-12">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          You probably won't stop feeling fear just because you did
          this once. The useful question is what you want to do the
          next time it shows up.
        </p>
      </div>

      {typeof reveal.notice === 'string' && reveal.notice && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What you noticed
          </p>

          <p className="text-lg leading-8">
            {reveal.notice}
          </p>
        </div>
      )}

      <div className="max-w-3xl space-y-8">
        <div className="space-y-3">
          <label className="text-xl font-semibold">
            When...
          </label>

          <Textarea
            value={when}
            onChange={(event) => setWhen(event.target.value)}
            placeholder="When I feel myself avoiding an ask..."
            className="min-h-[100px] resize-none text-lg leading-8"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-3">
          <label className="text-xl font-semibold">
            I will...
          </label>

          <Textarea
            value={will}
            onChange={(event) => setWill(event.target.value)}
            placeholder="I will make the ask anyway..."
            className="min-h-[100px] resize-none text-lg leading-8"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-3">
          <label className="text-xl font-semibold">
            Instead of...
          </label>

          <Textarea
            value={insteadOf}
            onChange={(event) => setInsteadOf(event.target.value)}
            placeholder="Instead of putting it off or talking myself out of it..."
            className="min-h-[100px] resize-none text-lg leading-8"
            disabled={isSubmitting}
          />
        </div>

        {statement && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your rule
            </p>

            <p className="mt-3 text-xl leading-9">
              {statement}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex max-w-3xl justify-end">
        <Button
          onClick={handleComplete}
          disabled={!canContinue || isSubmitting}
          className="h-12 gap-2 rounded-full px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Lock it in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}