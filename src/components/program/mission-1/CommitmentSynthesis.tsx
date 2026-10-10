
'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

import { updateUserProgramContext } from '@/actions/user-context';
import {
  $userContext,
  userContextActions,
} from '@/lib/stores/user-context';
import { generateCommitmentSynthesis } from '@/actions/responses/mission1';

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

type MotivationsContext = {
  motivations: Motivation[];
};

type BarriersContext = {
  barriers: Barrier[];
};

type DesiredFutureContext = {
  reflection?: string;
  elaboration?: string;
  [key: string]: unknown;
};

type QuitConditionsContext = {
  conditions: QuitCondition[];
};

type Synthesis = {
  headline: string;
  interpretation: string;
  confirmed?: boolean;
};

type CommitmentSynthesisPayload = {
  synthesis?: Synthesis;
  completed?: boolean;
};

type MindsetAssessmentAddition = {
  additional_notes?: string;
  [key: string]: unknown;
};

type AdditionalAssessment = {
  mindset?: MindsetAssessmentAddition;
  [key: string]: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getAdditionalAssessment(value: unknown): AdditionalAssessment {
  if (!isRecord(value)) return {};
  return value as AdditionalAssessment;
}

export function CommitmentSynthesis({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const rawContext = useStore($userContext);
  const context = rawContext.userContext;
  const hasGeneratedRef = useRef(false);

  const saved = (progress.payload ?? {}) as CommitmentSynthesisPayload;

  const savedSynthesis =
    saved.synthesis && typeof saved.synthesis === 'object'
      ? saved.synthesis
      : null;

  const situation =
    typeof context?.start_drive === 'string' ? context.start_drive : '';

  const barriersContext = context?.perceived_barriers as
    | BarriersContext
    | null
    | undefined;
  const motivationsContext = context?.motivations as
    | MotivationsContext
    | null
    | undefined;
  const futureContext = context?.desired_future as
    | DesiredFutureContext
    | null
    | undefined;
  const quitConditionsContext = context?.quit_conditions as
    | QuitConditionsContext
    | null
    | undefined;

  const barriers: Barrier[] = Array.isArray(barriersContext?.barriers)
    ? barriersContext.barriers
    : [];

  const motivations: Motivation[] = Array.isArray(
    motivationsContext?.motivations,
  )
    ? motivationsContext.motivations
    : [];

  const future =
    typeof futureContext?.reflection === 'string'
      ? futureContext.reflection
      : typeof futureContext?.elaboration === 'string'
        ? futureContext.elaboration
        : '';

  const quitConditions: QuitCondition[] = Array.isArray(
    quitConditionsContext?.conditions,
  )
    ? quitConditionsContext.conditions
    : [];

  const additionalAssessment = getAdditionalAssessment(
    context?.additional_assessment,
  );

  const mindsetAddition = isRecord(additionalAssessment.mindset)
    ? (additionalAssessment.mindset as MindsetAssessmentAddition)
    : {};

  const savedAdditionalNotes =
    typeof mindsetAddition.additional_notes === 'string'
      ? mindsetAddition.additional_notes
      : '';

  const [headline, setHeadline] = useState(savedSynthesis?.headline ?? '');
  const [interpretation, setInterpretation] = useState(
    savedSynthesis?.interpretation ?? '',
  );
  const [additionalNotes, setAdditionalNotes] = useState(
    savedAdditionalNotes,
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const [mode, setMode] = useState<'generating' | 'review'>(
    savedSynthesis ? 'review' : 'generating',
  );

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAdditionalNotes(savedAdditionalNotes);
  }, [savedAdditionalNotes]);

  useEffect(() => {
    if (savedSynthesis) {
      setHeadline(savedSynthesis.headline ?? '');
      setInterpretation(savedSynthesis.interpretation ?? '');
      setMode('review');
    }
  }, [savedSynthesis]);

  useEffect(() => {
    if (savedSynthesis || !rawContext.isHydrated) return;
    if (hasGeneratedRef.current) return;

    hasGeneratedRef.current = true;
    setIsGenerating(true);
    setError(null);
    setMode('generating');

    async function generate() {
      try {
        const result = await generateCommitmentSynthesis(
          {
            situation,
            barriers,
            motivations,
            future,
            quitConditions,
          },
          nodeKey,
        );

        setHeadline(result.headline);
        setInterpretation(result.interpretation);
        setMode('review');
      } catch (err) {
        console.error('[COMMITMENT SYNTHESIS]', err);

        hasGeneratedRef.current = false;

        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong creating the reflection.',
        );
      } finally {
        setIsGenerating(false);
      }
    }

    void generate();
  }, [
    rawContext.isHydrated,
    savedSynthesis,
    nodeKey,
    generationAttempt,
  ]);

  async function handleSubmit() {
    if (!headline.trim() || !interpretation.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const existingAssessment = getAdditionalAssessment(
        context?.additional_assessment,
      );

      const existingMindset = isRecord(existingAssessment.mindset)
        ? existingAssessment.mindset
        : {};

      const trimmedNotes = additionalNotes.trim();

      // Preserve other assessment areas and existing mindset fields.
      const nextAssessment: AdditionalAssessment = {
        ...existingAssessment,
        mindset: {
          ...existingMindset,
          ...(trimmedNotes
            ? { additional_notes: trimmedNotes }
            : { additional_notes: undefined }),
        },
      };

      // Avoid writing an undefined value to JSON. If the notes are blank,
      // remove only this field while preserving all other mindset data.
      if (!trimmedNotes) {
        const nextMindset = { ...existingMindset };
        delete nextMindset.additional_notes;

        if (Object.keys(nextMindset).length > 0) {
          nextAssessment.mindset = nextMindset;
        } else {
          delete nextAssessment.mindset;
        }
      }

      const result = await updateUserProgramContext({
        additional_assessment: nextAssessment,
      });

      userContextActions.updateContextLocally(result.userContext);

      await onComplete({
        synthesis: {
          headline: headline.trim(),
          interpretation: interpretation.trim(),
        },
        additional_assessment: nextAssessment,
        completed: true,
      });
    } catch (err) {
      console.error('[COMMITMENT SYNTHESIS COMPLETE]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your reflection.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mode === 'generating') {
    return (
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            What we notice
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Looking across what you told us.
          </h2>

          <p className="text-lg leading-8 text-muted-foreground">
            You explored different parts of your journey. Now we're
            looking at them together to see whether there's a connection
            you may not have noticed yet.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Taking a closer look...</span>
        </div>

        {error && (
          <div className="space-y-4">
            <p role="alert" className="text-sm leading-6 text-destructive">
              {error}
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setError(null);
                hasGeneratedRef.current = false;
                setGenerationAttempt((attempt) => attempt + 1);
              }}
              disabled={isGenerating}
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-10">
      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          What we notice
        </p>

        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'What is actually driving you?'}
        </h2>

        <p className="text-lg leading-8 text-muted-foreground">
          You answered each question separately. Looking at them together
          reveals something different.
        </p>
      </div>

      {/* AI synthesis: presented as an interpretation, not a verdict. */}
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="space-y-5">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            The connection we see
          </p>

          <h3 className="font-heading text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            {headline}
          </h3>

          <div className="border-t border-border pt-5">
            <p className="text-base leading-7 text-foreground sm:text-lg sm:leading-8">
              {interpretation}
            </p>
          </div>
        </div>
      </section>

      {/* Why this matters: shorter and visually distinct from the synthesis. */}
      <section className="space-y-3 border-t border-border pt-7">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Why we start here
        </p>

        <h3 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
          Before we build the business, we're building your capacity to start.
        </h3>

        <p className="leading-7 text-muted-foreground">
          Starting a business means acting, learning from what happens,
          dealing with uncertainty, and keeping moving when things don't
          go as planned. The business comes later. First, we're working
          on your ability to take that first step.
        </p>
      </section>

      {/* User contribution: add context without editing the AI synthesis. */}
      <section className="space-y-4 border-t border-border pt-7">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Your reflection
          </p>

          <h3 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
            Is there something important we're missing?
          </h3>

          <p className="leading-7 text-muted-foreground">
            This is one way of connecting what you've shared. You may have
            other thoughts, experiences, or concerns that would complete
            the picture.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="mindset-additional-notes"
            className="text-sm font-medium text-foreground"
          >
            Anything else you'd like us to know?
            <span className="ml-2 font-normal text-muted-foreground">
              (Optional)
            </span>
          </label>

          <Textarea
            id="mindset-additional-notes"
            value={additionalNotes}
            onChange={(event) => setAdditionalNotes(event.target.value)}
            placeholder="Something else that's important to me is..."
            rows={4}
            disabled={isSubmitting}
            className="resize-y text-base leading-7"
          />

          <p className="text-sm leading-6 text-muted-foreground">
            You can leave this blank if nothing else comes to mind.
            You can add to it later.
          </p>
        </div>
      </section>

      {error && (
        <p role="alert" className="text-sm leading-6 text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end border-t border-border pt-6">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={
            !headline.trim() ||
            !interpretation.trim() ||
            isSubmitting
          }
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
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
