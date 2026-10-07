'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $progress } from '@/lib/stores/progress';
import {
  generateRejectionSynthesis,
} from '@/actions/responses/mission1';
import type { RejectionSynthesisResult } from '@/lib/types/ai';

type FearPayload = {
  fear?: string;
  customFear?: string;
  completed?: boolean;
};

type ExperimentPayload = {
  actionTaken?: string;
  outcome?: string;
  completed?: boolean;
};

type RevealPayload = {
  synthesis?: RejectionSynthesisResult;
  reflection?: string;
  completed?: boolean;
};

export function FearEvidenceReveal({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);

  const saved = (progress.payload ?? {}) as RevealPayload;

  const fear = progressState.payloads['m1-q4-setup'] as
    | FearPayload
    | undefined;

  const warmup = progressState.payloads['m1-q4-warmup'] as
    | ExperimentPayload
    | undefined;

  const stretch = progressState.payloads['m1-q4-stretch'] as
    | ExperimentPayload
    | undefined;

  const [synthesis, setSynthesis] = useState<
    RejectionSynthesisResult | undefined
  >(
    saved.synthesis &&
      typeof saved.synthesis.headline === 'string' &&
      typeof saved.synthesis.interpretation === 'string'
      ? saved.synthesis
      : undefined
  );

  const [reflection, setReflection] = useState(
    typeof saved.reflection === 'string'
      ? saved.reflection
      : ''
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasGeneratedRef = useRef(Boolean(saved.synthesis));

  const fearLabel = getFearLabel(fear);

  useEffect(() => {
    if (hasGeneratedRef.current) return;

    if (
      !fearLabel &&
      !fear?.customFear &&
      !stretch?.actionTaken &&
      !stretch?.outcome
    ) {
      return;
    }

    hasGeneratedRef.current = true;
    setIsGenerating(true);

    const reflections = [
      {
        title: 'What you feared',
        content: fear?.customFear || fearLabel || '',
      },
      {
        title: 'What you did',
        content: stretch?.actionTaken || '',
      },
      {
        title: 'What actually happened',
        content: stretch?.outcome || '',
      },
      ...(warmup?.outcome
        ? [
            {
              title: 'What happened in the warmup',
              content: warmup.outcome,
            },
          ]
        : []),
    ].filter((reflection) => reflection.content.trim());

    generateRejectionSynthesis(reflections, node.key)
      .then((result) => {
        setSynthesis(result);
      })
      .catch(() => {
        hasGeneratedRef.current = false;
      })
      .finally(() => {
        setIsGenerating(false);
      });
  }, [
    fearLabel,
    fear?.customFear,
    stretch?.actionTaken,
    stretch?.outcome,
    warmup?.outcome,
    node.key,
  ]);

  const canContinue =
    synthesis !== undefined &&
    reflection.trim().length > 0;

  async function handleComplete() {
    if (!canContinue || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onComplete({
        synthesis,
        reflection: reflection.trim(),
        completed: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (progress.completed || saved.completed === true) {
    const completedSynthesis = saved.synthesis;

    return (
      <div className="w-full max-w-4xl space-y-12">
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You put what you expected beside what actually happened.
            Now you have your own reading of the experience.
          </p>
        </div>

        <EvidenceGroup
          fear={fearLabel}
          customFear={fear?.customFear}
          actionTaken={stretch?.actionTaken}
          outcome={stretch?.outcome}
          warmupOutcome={warmup?.outcome}
        />

        {completedSynthesis && (
          <div className="max-w-3xl space-y-4 border-t border-border pt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What this experience showed you
            </p>

            <h3 className="text-2xl font-semibold leading-tight">
              {completedSynthesis.headline}
            </h3>

            <p className="text-lg leading-8 text-muted-foreground">
              {completedSynthesis.interpretation}
            </p>
          </div>
        )}

        <div className="max-w-3xl space-y-3 border-t border-border pt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What I take from this
          </p>

          <p className="text-lg leading-8">
            {reflection}
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
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Here is what you expected, beside what actually happened.
          Look at the difference. The point is not to make the experience
          sound positive. It is to see what the evidence tells you.
        </p>
      </div>

      <EvidenceGroup
        fear={fearLabel}
        customFear={fear?.customFear}
        actionTaken={stretch?.actionTaken}
        outcome={stretch?.outcome}
        warmupOutcome={warmup?.outcome}
      />

      <div className="max-w-3xl space-y-6 border-t border-border pt-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What this experience showed you
          </p>

          {isGenerating && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />

              <span>
                Looking across what you expected and what happened...
              </span>
            </div>
          )}

          {!isGenerating && synthesis && (
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold leading-tight">
                {synthesis.headline}
              </h3>

              <p className="text-lg leading-8 text-muted-foreground">
                {synthesis.interpretation}
              </p>
            </div>
          )}

          {!isGenerating && !synthesis && (
            <p className="text-muted-foreground">
              We could not generate the reflection yet. Please try again.
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            What do you take from this?
          </h3>

          <p className="text-muted-foreground">
            You do not have to turn this into a positive lesson.
            What does the experience mean to you now that you have
            seen the evidence?
          </p>
        </div>

        <Textarea
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder="What I take from this..."
          className="min-h-[180px] resize-none text-lg leading-8"
          disabled={isGenerating || isSubmitting || !synthesis}
        />
      </div>

      <div className="flex max-w-3xl justify-end">
        <Button
          onClick={handleComplete}
          disabled={!canContinue || isGenerating || isSubmitting}
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
  );
}

function EvidenceGroup({
  fear,
  customFear,
  actionTaken,
  outcome,
  warmupOutcome,
}: {
  fear?: string;
  customFear?: string;
  actionTaken?: string;
  outcome?: string;
  warmupOutcome?: string;
}) {
  return (
    <div className="space-y-8">
      <Evidence
        label="What you feared"
        value={customFear || fear}
      />

      <Evidence
        label="What you did"
        value={actionTaken}
      />

      <Evidence
        label="What actually happened"
        value={outcome}
      />

      {warmupOutcome && (
        <Evidence
          label="What happened in the warmup"
          value={warmupOutcome}
        />
      )}
    </div>
  );
}

function Evidence({
  label,
  value,
}: {
  label: string;
  value?: unknown;
}) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="text-lg leading-8">
        {value}
      </p>
    </div>
  );
}

function getFearLabel(fear?: FearPayload) {
  if (!fear?.fear) {
    return undefined;
  }

  const labels: Record<string, string> = {
    judgment: 'They might think less of me.',
    self_doubt: 'I might start doubting myself.',
    embarrassment: 'I might feel embarrassed.',
    relationship: 'It might affect the relationship.',
    inexperienced: 'I might look inexperienced or incapable.',
    not_know: 'I might have to face what I do not know.',
    next_step: 'I might not know what to do next.',
    not_scared: 'This situation does not scare me at all.',
  };

  return labels[fear.fear] ?? fear.fear;
}