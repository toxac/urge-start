'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type FearPayload = {
  fear?: string;
  customFear?: string;
  completed?: boolean;
};

const FEAR_OPTIONS = [
  {
    id: 'judgment',
    label: 'They might think less of me.',
  },
  {
    id: 'self_doubt',
    label: 'I might start doubting myself.',
  },
  {
    id: 'embarrassment',
    label: 'I might feel embarrassed.',
  },
  {
    id: 'relationship',
    label: 'It might affect the relationship.',
  },
  {
    id: 'inexperienced',
    label: 'I might look inexperienced or incapable.',
  },
  {
    id: 'not_know',
    label: 'I might have to face what I do not know.',
  },
  {
    id: 'next_step',
    label: 'I might not know what to do next.',
  },
  {
    id: 'other',
    label: 'Something else.',
  },
  {
    id: 'not_scared',
    label: 'This situation does not scare me at all.',
  },
] as const;

export function FearExplorer({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const saved = (progress.payload ?? {}) as FearPayload;

  const [selectedFear, setSelectedFear] = useState(
    typeof saved.fear === 'string' ? saved.fear : ''
  );

  const [customFear, setCustomFear] = useState(
    typeof saved.customFear === 'string' ? saved.customFear : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOther = selectedFear === 'other';

  const canComplete =
    selectedFear.length > 0 &&
    (!isOther || customFear.trim().length > 0);

  async function handleComplete() {
    if (!canComplete || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onComplete({
        fear: selectedFear,
        customFear: isOther ? customFear.trim() : undefined,
        completed: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (progress.completed || saved.completed === true) {
    const selectedOption = FEAR_OPTIONS.find(
      (option) => option.id === selectedFear
    );

    const answer =
      selectedFear === 'other'
        ? customFear
        : selectedOption?.label ?? '';

    return (
      <div className="w-full max-w-4xl space-y-10">
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You have identified what, if anything, makes this situation
            uncomfortable for you. Now we can look more closely at what you
            expect to happen.
          </p>
        </div>

        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What scares me
          </p>

          <p className="text-xl leading-8">
            {answer}
          </p>
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
      <div className="space-y-5">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>

        <div className="max-w-3xl space-y-4 text-lg leading-8 text-muted-foreground">
          <p>
            Imagine this.
          </p>

          <p>
            You have something you want to start. You finally put it in front
            of someone who could say yes — a potential customer, someone whose
            help you need, someone you respect, or someone who could open a
            door for you.
          </p>

          <p>
            You make the ask.
          </p>

          <p>
            And they say <strong className="text-foreground">no</strong>.
          </p>

          <p>
            Maybe they do not want to buy. Maybe they do not want to help.
            Maybe they are simply not interested.
          </p>

          <p>
            Now imagine that moment actually happening to you.
          </p>

          <p className="font-medium text-foreground">
            What, if anything, about that situation scares you?
          </p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        <div>
          <h3 className="text-xl font-semibold">
            What scares you most?
          </h3>

          <p className="mt-2 text-muted-foreground">
            There is no right answer. If none of these fit, choose something
            else — or tell us that this situation does not scare you.
          </p>
        </div>

        <div className="grid gap-3">
          {FEAR_OPTIONS.map((option) => {
            const isSelected = selectedFear === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedFear(option.id)}
                disabled={isSubmitting}
                className={[
                  'w-full rounded-xl border px-5 py-4 text-left text-base transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'border-foreground bg-muted'
                    : 'border-border hover:bg-muted/50',
                ].join(' ')}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {isOther && (
          <div className="space-y-3">
            <label
              htmlFor="custom-fear"
              className="text-sm font-medium"
            >
              What is it?
            </label>

            <Textarea
              id="custom-fear"
              value={customFear}
              onChange={(event) => setCustomFear(event.target.value)}
              placeholder="I am afraid that..."
              className="min-h-[140px] resize-none text-lg leading-8"
              disabled={isSubmitting}
              autoFocus
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleComplete}
            disabled={!canComplete || isSubmitting}
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}