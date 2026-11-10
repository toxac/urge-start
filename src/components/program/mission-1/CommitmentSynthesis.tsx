// src/components/program/mission-1/CommitmentSynthesis.tsx
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
import { getNodeAILogs } from '@/actions/ai-logs';
import { generateCommitmentSynthesis } from '@/actions/responses/mission1';
import type { SynthesisReflectiveItem } from '@/lib/types/ai';

type Synthesis = {
  headline: string;
  interpretation: string;
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

function parseSavedLog(log: any): Synthesis | null {
  if (log.purpose !== 'reveal_m1_q1_pattern') return null;

  try {
    let res = log.response;
    if (typeof res === 'string') {
      try {
        res = JSON.parse(res);
      } catch {}
    }

    if (res && typeof res === 'object' && res.content) {
      let content = res.content;
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
        } catch {}
      }
      res = content;
    }

    if (
      res &&
      typeof res.headline === 'string' &&
      typeof res.interpretation === 'string'
    ) {
      return {
        headline: res.headline.trim(),
        interpretation: res.interpretation.trim(),
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function CommitmentSynthesis({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const rawContext = useStore($userContext);
  const context = rawContext.userContext;
  const profile = rawContext.profile;
  const hasInitialized = useRef(false);

  const situation =
    typeof context?.start_drive === 'string' ? context.start_drive : '';

  // Extract structured reflective arrays
  const barriersContext = context?.perceived_barriers as Record<string, any> | undefined;
  const motivationsContext = context?.motivations as Record<string, any> | undefined;
  const futureContext = context?.desired_future as Record<string, any> | undefined;
  const quitConditionsContext = context?.quit_conditions as Record<string, any> | undefined;

  const barriers: SynthesisReflectiveItem[] = Array.isArray(barriersContext?.barriers)
    ? barriersContext.barriers
    : [];

  const motivations: SynthesisReflectiveItem[] = Array.isArray(motivationsContext?.motivations)
    ? motivationsContext.motivations
    : [];

  const futureChanges: SynthesisReflectiveItem[] = Array.isArray(futureContext?.changes)
    ? futureContext.changes
    : [];

  const future =
    typeof futureContext?.reflection === 'string'
      ? futureContext.reflection
      : typeof futureContext?.elaboration === 'string'
        ? futureContext.elaboration
        : '';

  const quitConditions: SynthesisReflectiveItem[] = Array.isArray(quitConditionsContext?.conditions)
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

  const [headline, setHeadline] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState(savedAdditionalNotes);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'generating' | 'review'>('generating');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAdditionalNotes(savedAdditionalNotes);
  }, [savedAdditionalNotes]);

  // Load saved reflection from ai_logs (or progress) before generating
  useEffect(() => {
    if (!rawContext.isHydrated || hasInitialized.current) return;
    hasInitialized.current = true;

    async function loadLogsOrGenerate() {
      setIsGenerating(true);
      setMode('generating');
      setError(null);

      // 1. Check progress payload first
      const progressSynthesis = (progress.payload as Record<string, any>)?.synthesis as Synthesis | undefined;
      if (progressSynthesis?.headline && progressSynthesis?.interpretation) {
        setHeadline(progressSynthesis.headline);
        setInterpretation(progressSynthesis.interpretation);
        setMode('review');
        setIsGenerating(false);
        return;
      }

      // 2. Check ai_logs table for previous successful generation
      try {
        const logs = await getNodeAILogs(nodeKey);
        const savedLog = logs.find((log) => parseSavedLog(log) !== null);

        if (savedLog) {
          const parsed = parseSavedLog(savedLog);
          if (parsed) {
            setHeadline(parsed.headline);
            setInterpretation(parsed.interpretation);
            setMode('review');
            setIsGenerating(false);
            return;
          }
        }
      } catch (logErr) {
        console.error('[COMMITMENT SYNTHESIS LOG CHECK]', logErr);
      }

      // 3. Generate only once if no saved record exists
      try {
        const userName =
          profile?.display_name?.trim() || profile?.username?.trim() || undefined;

        const result = await generateCommitmentSynthesis(
          {
            userName,
            situation,
            barriers,
            motivations,
            future,
            futureChanges,
            quitConditions,
          },
          nodeKey,
        );

        setHeadline(result.headline);
        setInterpretation(result.interpretation);
        setMode('review');
      } catch (err) {
        console.error('[COMMITMENT SYNTHESIS GENERATE]', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong creating the reflection.',
        );
      } finally {
        setIsGenerating(false);
      }
    }

    void loadLogsOrGenerate();
  }, [rawContext.isHydrated, nodeKey, progress.payload]);

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

      const nextAssessment: AdditionalAssessment = {
        ...existingAssessment,
        mindset: {
          ...existingMindset,
          ...(trimmedNotes
            ? { additional_notes: trimmedNotes }
            : { additional_notes: undefined }),
        },
      };

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
      <div className="w-full max-w-3xl space-y-8 animate-in fade-in duration-300">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            What we notice
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Looking across what you told us.
          </h2>

          <p className="text-lg leading-8 text-muted-foreground">
            You explored different parts of your journey. Now we&apos;re
            looking at them together to surface the tension between what pulls you
            forward and what holds you back.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Connecting your core motivations and barriers...</span>
        </div>

        {error && (
          <p role="alert" className="text-sm leading-6 text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-10 animate-in fade-in duration-300">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          What we notice
        </p>

        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'What is actually driving you?'}
        </h2>

        <p className="text-lg leading-8 text-muted-foreground">
          You answered each question separately. Looking at them together
          reveals the central tension beneath your desire to start.
        </p>
      </div>

      {/* AI synthesis reflection */}
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            The connection we see
          </p>

          <h3 className="font-heading text-2xl font-semibold leading-snug tracking-tight sm:text-3xl text-foreground">
            {headline}
          </h3>

          <div className="border-t border-border pt-5">
            <p className="text-base leading-7 text-foreground/90 sm:text-lg sm:leading-8">
              {interpretation}
            </p>
          </div>
        </div>
      </section>

      {/* Why this matters */}
      <section className="space-y-3 border-t border-border pt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Why we start here
        </p>

        <h3 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
          Before we build the business, we&apos;re building your capacity to start.
        </h3>

        <p className="leading-7 text-muted-foreground">
          Starting a business means acting, learning from what happens,
          dealing with uncertainty, and keeping moving when things don&apos;t
          go as planned. The business comes later. First, we&apos;re working
          on your ability to take that first step.
        </p>
      </section>

      {/* User notes */}
      <section className="space-y-4 border-t border-border pt-7">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Your reflection
          </p>

          <h3 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
            Is there something important we&apos;re missing?
          </h3>

          <p className="leading-7 text-muted-foreground">
            This is one way of connecting what you&apos;ve shared. You may have
            other thoughts, experiences, or concerns that complete the picture.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="mindset-additional-notes"
            className="text-sm font-medium text-foreground"
          >
            Anything else you&apos;d like us to know?
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
            You can leave this blank if nothing else comes to mind. You can add to it later.
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
          disabled={!headline.trim() || !interpretation.trim() || isSubmitting}
          className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
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
