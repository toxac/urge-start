'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Loader2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $userContext } from '@/lib/stores/user-context';

type Barrier = {
  id: string;
  title: string;
  reflection: string;
};

type Motivation = {
  id: string;
  title: string;
  reflection: string;
};

type QuitCondition = {
  id: string;
  title: string;
  reflection: string;
};

type Synthesis = {
  pattern: string;
  matters: string;
  future: string;
  chosenBehavior: string;
  barrierIds: string[];
  motivationIds: string[];
  quitConditionIds: string[];
  confirmed: boolean;
};

export function CommitmentSynthesis({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const rawContext = useStore($userContext);
  const context = (rawContext as any)?.userContext || rawContext || {};

  const saved = progress.payload ?? {};

  const savedSynthesis =
    saved.synthesis &&
    typeof saved.synthesis === 'object'
      ? (saved.synthesis as Synthesis)
      : null;

  const barriers: Barrier[] =
    Array.isArray(context.perceived_barriers?.barriers)
      ? context.perceived_barriers.barriers
      : [];

  const motivations: Motivation[] =
    Array.isArray(context.motivations?.motivations)
      ? context.motivations.motivations
      : [];

  const futureReflection =
    typeof context.desired_future?.reflection === 'string'
      ? context.desired_future.reflection
      : '';

  const quitConditions: QuitCondition[] =
    Array.isArray(context.quit_conditions?.conditions)
      ? context.quit_conditions.conditions
      : [];

  const [pattern, setPattern] = useState(
    savedSynthesis?.pattern ?? ''
  );

  const [matters, setMatters] = useState(
    savedSynthesis?.matters ?? ''
  );

  const [chosenBehavior, setChosenBehavior] = useState(
    savedSynthesis?.chosenBehavior ?? ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mode, setMode] = useState<'edit' | 'review'>(
    savedSynthesis ? 'review' : 'edit'
  );

  useEffect(() => {
    if (!savedSynthesis) return;

    setPattern(savedSynthesis.pattern ?? '');
    setMatters(savedSynthesis.matters ?? '');
    setChosenBehavior(savedSynthesis.chosenBehavior ?? '');
    setMode('review');
  }, [savedSynthesis]);

  const primaryBarrier = barriers[0];
  const primaryMotivation = motivations[0];

  const canContinue =
    pattern.trim().length >= 3 &&
    matters.trim().length >= 3 &&
    chosenBehavior.trim().length >= 3;

  const handleSubmit = async () => {
    if (!canContinue || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const synthesis: Synthesis = {
        pattern: pattern.trim(),
        matters: matters.trim(),
        future: futureReflection,
        chosenBehavior: chosenBehavior.trim(),
        barrierIds: barriers.map((item) => item.id),
        motivationIds: motivations.map((item) => item.id),
        quitConditionIds: quitConditions.map((item) => item.id),
        confirmed: true,
      };

      await onComplete({
        synthesis,
        completed: true,
      });

      setMode('review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === 'review') {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            YOUR LINE
          </p>

          <h2 className="text-2xl font-semibold tracking-tight">
            You know what is pulling you.
          </h2>

          <p className="text-muted-foreground">
            Here is what you said. Read it back to yourself.
          </p>
        </div>

        <div className="rounded-2xl border bg-muted/30 p-6 space-y-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              WHEN I FEEL MY RESISTANCE
            </p>

            <p className="text-lg leading-relaxed">
              I tend to {pattern}.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              WHAT MATTERS TO ME
            </p>

            <p className="text-lg leading-relaxed">
              {matters}
            </p>
          </div>

          {futureReflection && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                THE FUTURE I WANT
              </p>

              <p className="text-lg leading-relaxed">
                {futureReflection}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              SO I AM CHOOSING TO
            </p>

            <p className="text-lg leading-relaxed">
              {chosenBehavior}.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => setMode('edit')}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
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
    );
  }

  return (
    <div className="space-y-10">
      {/* Intro */}

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          LOOK AT WHAT IS ACTUALLY DRIVING YOU
        </p>

        <h2 className="text-2xl font-semibold tracking-tight">
          You have said a lot. Now look at it together.
        </h2>

        <p className="text-muted-foreground leading-relaxed">
          There is no right interpretation here. You are the person who
          gets to decide what these answers mean.
        </p>
      </div>

      {/* Deterministic mirror */}

      {(primaryBarrier || primaryMotivation) && (
        <div className="rounded-2xl border p-6 space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            SOMETHING YOU MIGHT NOTICE
          </p>

          <p className="text-lg leading-relaxed">
            {primaryMotivation && (
              <>
                You keep coming back to{' '}
                <strong>{primaryMotivation.title.toLowerCase()}</strong>
              </>
            )}

            {primaryMotivation && primaryBarrier && ' while '}

            {primaryBarrier && (
              <>
                <strong>
                  {primaryBarrier.title.toLowerCase()}
                </strong>{' '}
                is one of the things making it harder to move.
              </>
            )}
          </p>

          <p className="text-sm text-muted-foreground">
            That is only a connection between the things you told us.
            What it means is up to you.
          </p>
        </div>
      )}

      {/* What is pulling you */}

      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            WHAT IS PULLING YOU
          </p>

          <h3 className="text-xl font-semibold">
            Why do you keep coming back?
          </h3>
        </div>

        {motivations.length > 0 ? (
          <div className="space-y-3">
            {motivations.map((motivation) => (
              <div
                key={motivation.id}
                className="rounded-xl border p-4"
              >
                <p className="font-medium">{motivation.title}</p>

                {motivation.reflection && (
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    {motivation.reflection}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            You did not record a motivation.
          </p>
        )}
      </section>

      {/* What is holding you back */}

      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            WHAT IS HOLDING YOU BACK
          </p>

          <h3 className="text-xl font-semibold">
            What has been getting in the way?
          </h3>
        </div>

        {barriers.length > 0 ? (
          <div className="space-y-3">
            {barriers.map((barrier) => (
              <div
                key={barrier.id}
                className="rounded-xl border p-4"
              >
                <p className="font-medium">{barrier.title}</p>

                {barrier.reflection && (
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    {barrier.reflection}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            You did not record a barrier.
          </p>
        )}
      </section>

      {/* What you want to change */}

      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            WHAT YOU WANT TO CHANGE
          </p>

          <h3 className="text-xl font-semibold">
            If this happens, what would be different?
          </h3>
        </div>

        {futureReflection ? (
          <div className="rounded-xl border p-5">
            <p className="text-lg leading-relaxed">
              {futureReflection}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">
            You did not record a future reflection.
          </p>
        )}
      </section>

      {/* What could make you quit */}

      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            WHAT COULD MAKE YOU QUIT
          </p>

          <h3 className="text-xl font-semibold">
            What might pull you off course?
          </h3>
        </div>

        {quitConditions.length > 0 ? (
          <div className="space-y-3">
            {quitConditions.map((condition) => (
              <div
                key={condition.id}
                className="rounded-xl border p-4"
              >
                <p className="font-medium">{condition.title}</p>

                {condition.reflection && (
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    {condition.reflection}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            You did not record a quit condition.
          </p>
        )}
      </section>

      {/* User-owned synthesis */}

      <section className="space-y-6 border-t pt-8">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            NOW MAKE THE CONNECTION
          </p>

          <h3 className="text-xl font-semibold">
            What do you notice?
          </h3>

          <p className="text-muted-foreground leading-relaxed">
            We are not going to tell you what your answers mean.
            Complete these sentences in your own words.
          </p>
        </div>

        {/* Pattern */}

        <div className="space-y-3">
          <label
            htmlFor="pattern"
            className="text-sm font-medium"
          >
            When I feel my resistance, I tend to...
          </label>

          <textarea
            id="pattern"
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            placeholder="I tend to..."
            rows={4}
            className="w-full rounded-xl border bg-background px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Matters */}

        <div className="space-y-3">
          <label
            htmlFor="matters"
            className="text-sm font-medium"
          >
            What matters to me is...
          </label>

          <textarea
            id="matters"
            value={matters}
            onChange={(event) => setMatters(event.target.value)}
            placeholder="What matters most to me is..."
            rows={4}
            className="w-full rounded-xl border bg-background px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Chosen behavior */}

        <div className="space-y-3">
          <label
            htmlFor="chosenBehavior"
            className="text-sm font-medium"
          >
            So I am choosing to...
          </label>

          <textarea
            id="chosenBehavior"
            value={chosenBehavior}
            onChange={(event) =>
              setChosenBehavior(event.target.value)
            }
            placeholder="I am choosing to..."
            rows={4}
            className="w-full rounded-xl border bg-background px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>
      </section>

      {/* Continue */}

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!canContinue || isSubmitting}
          className="gap-2"
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
  );
}