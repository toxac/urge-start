'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type FearPayload = {
  fearedOutcome?: string;
  meaning?: string;
  whyItMatters?: string;
  completed?: boolean;
};

export function FearExplorer({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const saved = (progress.payload ?? {}) as FearPayload;

  const [step, setStep] = useState(
    saved.completed ? 3 : saved.fearedOutcome ? 2 : 1
  );

  const [fearedOutcome, setFearedOutcome] = useState(
    typeof saved.fearedOutcome === 'string'
      ? saved.fearedOutcome
      : ''
  );

  const [meaning, setMeaning] = useState(
    typeof saved.meaning === 'string'
      ? saved.meaning
      : ''
  );

  const [whyItMatters, setWhyItMatters] = useState(
    typeof saved.whyItMatters === 'string'
      ? saved.whyItMatters
      : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canNext =
    step === 1
      ? fearedOutcome.trim().length > 0
      : step === 2
        ? meaning.trim().length > 0
        : whyItMatters.trim().length > 0;

  async function handleComplete() {
    if (!canNext || isSubmitting) return;

    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }

    setIsSubmitting(true);

    try {
      await onComplete({
        fearedOutcome: fearedOutcome.trim(),
        meaning: meaning.trim(),
        whyItMatters: whyItMatters.trim(),
        completed: true,
      });
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
            You have named the thing you are actually afraid of.
            Now we can test it instead of letting it stay vague.
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What I am afraid will happen
            </p>

            <p className="text-lg leading-8">
              {fearedOutcome}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What that would mean
            </p>

            <p className="text-lg leading-8">
              {meaning}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Why that matters to me
            </p>

            <p className="text-lg leading-8">
              {whyItMatters}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => onComplete(saved)}
            className="h-12 gap-2 rounded-full px-8 text-base"
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
          You have already started putting yourself out there. Now let's
          get closer to the thing you actually want to avoid.
        </p>
      </div>

      {step === 1 && (
        <div className="max-w-3xl space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              What are you afraid will happen?
            </h3>

            <p className="text-muted-foreground">
              Be specific. Not just “I am afraid of rejection.”
              What do you imagine actually happening?
            </p>
          </div>

          <Textarea
            value={fearedOutcome}
            onChange={(event) => setFearedOutcome(event.target.value)}
            placeholder="I am afraid that..."
            className="min-h-[160px] resize-none text-lg leading-8"
            disabled={isSubmitting}
          />
        </div>
      )}

      {step === 2 && (
        <div className="max-w-3xl space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              And if that happened, what would it mean?
            </h3>

            <p className="text-muted-foreground">
              What would you tell yourself about the situation, or about
              yourself?
            </p>
          </div>

          <Textarea
            value={meaning}
            onChange={(event) => setMeaning(event.target.value)}
            placeholder="It would mean..."
            className="min-h-[160px] resize-none text-lg leading-8"
            disabled={isSubmitting}
          />
        </div>
      )}

      {step === 3 && (
        <div className="max-w-3xl space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              Why would that matter to you?
            </h3>

            <p className="text-muted-foreground">
              What is really at stake for you?
            </p>
          </div>

          <Textarea
            value={whyItMatters}
            onChange={(event) => setWhyItMatters(event.target.value)}
            placeholder="It matters because..."
            className="min-h-[160px] resize-none text-lg leading-8"
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="flex max-w-3xl justify-between">
        {step > 1 ? (
          <Button
            variant="ghost"
            onClick={() => setStep((current) => current - 1)}
            disabled={isSubmitting}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          onClick={handleComplete}
          disabled={!canNext || isSubmitting}
          className="h-12 gap-2 rounded-full px-8 text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : step === 3 ? (
            <>
              Continue
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}