'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $progress } from '@/lib/stores/progress';
import {
  generateRejectionSynthesis,
  getQuest4Reflections,
} from '@/actions/responses/mission1';
import type { RejectionSynthesisResult } from '@/lib/types/ai';

type ExperimentPayload = {
  target?: string;
  intention?: string;
  why?: string;
  prediction?: string;
  actionTaken?: string;
  outcome?: string;
  reaction?: string;
  reflection?: string;
  completed?: boolean;
};

type ReflectionRecord = {
  title: string;
  content: string;
  source_node_key?: string | null;
};

type RevealPayload = {
  synthesis?: RejectionSynthesisResult;
  reflection?: string;
  completed?: boolean;
};

type EvidenceItem = {
  title: string;
  content: string;
};

export function FearEvidenceReveal({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);
  const saved = (progress.payload ?? {}) as RevealPayload;

  const warmup = (progressState.payloads['m1-q4-warmup'] ?? {}) as ExperimentPayload;
  const stretch = (progressState.payloads['m1-q4-stretch'] ?? {}) as ExperimentPayload;

  const [synthesis, setSynthesis] = useState<RejectionSynthesisResult | undefined>(
    saved.synthesis &&
      typeof saved.synthesis.headline === 'string' &&
      typeof saved.synthesis.interpretation === 'string'
      ? saved.synthesis
      : undefined,
  );
  const [reflection, setReflection] = useState(saved.reflection ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const experimentEvidence = useMemo<EvidenceItem[]>(() => {
    const fields: Array<[keyof ExperimentPayload, string]> = [
      ['target', 'Who they approached'],
      ['intention', 'What they asked for'],
      ['why', 'Why this person'],
      ['prediction', 'What they expected'],
      ['actionTaken', 'What they did'],
      ['outcome', 'What happened'],
      ['reaction', 'How they reacted'],
      ['reflection', 'What they noticed'],
    ];

    return [
      ...fields
        .filter(([key]) => Boolean(warmup[key]?.toString().trim()))
        .map(([key, title]) => ({
          title: `Warmup · ${title}`,
          content: String(warmup[key]).trim(),
        })),
      ...fields
        .filter(([key]) => Boolean(stretch[key]?.toString().trim()))
        .map(([key, title]) => ({
          title: `Harder ask · ${title}`,
          content: String(stretch[key]).trim(),
        })),
    ];
  }, [
    warmup.target,
    warmup.intention,
    warmup.why,
    warmup.prediction,
    warmup.actionTaken,
    warmup.outcome,
    warmup.reaction,
    warmup.reflection,
    stretch.target,
    stretch.intention,
    stretch.why,
    stretch.prediction,
    stretch.actionTaken,
    stretch.outcome,
    stretch.reaction,
    stretch.reflection,
  ]);

  useEffect(() => {
    if (saved.completed || progress.completed) return;

    if (saved.synthesis?.headline && saved.synthesis?.interpretation) {
      setSynthesis(saved.synthesis);
      setIsGenerating(false);
      return;
    }

    let cancelled = false;

    async function generate() {
      setIsGenerating(true);
      setError(null);

      try {
        const observations = (await getQuest4Reflections()) as ReflectionRecord[];
        if (cancelled) return;

        const observationEvidence: EvidenceItem[] = observations
          .filter((item) => item.content?.trim())
          .map((item) => ({
            title: item.title || `Reflection · ${item.source_node_key ?? 'experiment'}`,
            content: item.content.trim(),
          }));

        const combined = [...experimentEvidence];

        // The observation is the durable reflection record. Avoid adding the same
        // reflection twice when its content is already present in the progress payload.
        for (const observation of observationEvidence) {
          const alreadyIncluded = combined.some(
            (item) => item.content.trim() === observation.content.trim(),
          );
          if (!alreadyIncluded) combined.push(observation);
        }

        if (combined.length === 0) {
          throw new Error(
            'We could not find the saved answers from your two experiments. Please check that both experiments have been completed.',
          );
        }

        const result = await generateRejectionSynthesis(combined, node.key);
        if (cancelled) return;

        setSynthesis(result);
      } catch (err) {
        if (cancelled) return;
        console.error('[FEAR EVIDENCE REVEAL]', err);
        setError(
          err instanceof Error
            ? err.message
            : 'We could not put the two experiences together. Please try again.',
        );
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    void generate();

    return () => {
      cancelled = true;
    };
  }, [
    experimentEvidence,
    node.key,
    progress.completed,
    retryCount,
    saved.completed,
    saved.synthesis,
  ]);

  const canContinue = Boolean(synthesis) && reflection.trim().length > 0;

  async function handleComplete() {
    if (!canContinue || !synthesis || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onComplete({
        synthesis,
        reflection: reflection.trim(),
        completed: true,
      });
    } catch (err) {
      console.error('[FEAR EVIDENCE REVEAL SAVE]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'We could not save your reflection. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (progress.completed || saved.completed === true) {
    return (
      <div className="w-full max-w-4xl space-y-12">
        <Header nodeTitle={node.title} />

        <ExperimentSection title="The warmup" experiment={warmup} />
        <ExperimentSection title="The harder ask" experiment={stretch} />

        {saved.synthesis && (
          <SynthesisSection synthesis={saved.synthesis} />
        )}

        <section className="max-w-3xl space-y-3 border-t border-border pt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What I take from this
          </p>
          <p className="text-lg leading-8">{saved.reflection}</p>
        </section>

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
      <Header nodeTitle={node.title} />

      <section className="space-y-8">
        <div className="max-w-3xl space-y-2">
          <h3 className="text-2xl font-semibold">First, the small ask</h3>
          <p className="leading-7 text-muted-foreground">
            What you expected, what you did, and what actually happened.
          </p>
        </div>
        <ExperimentSection title="The warmup" experiment={warmup} />
      </section>

      <section className="space-y-8 border-t border-border pt-8">
        <div className="max-w-3xl space-y-2">
          <h3 className="text-2xl font-semibold">Then, the harder ask</h3>
          <p className="leading-7 text-muted-foreground">
            Did raising the stakes change the experience?
          </p>
        </div>
        <ExperimentSection title="The harder ask" experiment={stretch} />
      </section>

      <section className="max-w-3xl space-y-5 border-t border-border pt-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What stands out across both experiences
          </p>

          {isGenerating && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Looking across what you expected and what happened...</span>
            </div>
          )}

          {!isGenerating && synthesis && (
            <SynthesisSection synthesis={synthesis} />
          )}

          {!isGenerating && error && (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSynthesis(undefined);
                  setRetryCount((count) => count + 1);
                }}
                className="rounded-full"
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-3xl space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">What do you take from this?</h3>
          <p className="text-muted-foreground">
            Look at both experiences together. What do they mean to you now?
            You do not have to turn them into a positive lesson. Notice what
            changed, what did not, or what surprised you.
          </p>
        </div>

        <Textarea
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder="What I take from these two experiences..."
          className="min-h-[180px] resize-none text-lg leading-8"
          disabled={isGenerating || isSubmitting || !synthesis}
        />
      </section>

      {error && !isGenerating && synthesis && (
        <p className="max-w-3xl text-sm text-destructive">{error}</p>
      )}

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

function Header({ nodeTitle }: { nodeTitle: string }) {
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        {nodeTitle}
      </h2>
      <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
        Compare what you expected with what actually happened in both asks.
        The point is not to make either experience sound positive. It is to
        look at the evidence and notice what stands out to you.
      </p>
    </div>
  );
}

function ExperimentSection({
  title,
  experiment,
}: {
  title: string;
  experiment: ExperimentPayload;
}) {
  const items: Array<[string, string | undefined]> = [
    ['Who they approached', experiment.target],
    ['What they asked for', experiment.intention],
    ['Why this person', experiment.why],
    ['What they expected', experiment.prediction],
    ['What they did', experiment.actionTaken],
    ['What happened', experiment.outcome],
    ['How they reacted', experiment.reaction],
    ['What they noticed', experiment.reflection],
  ];

  const available = items.filter(([, value]) => Boolean(value?.trim()));

  if (available.length === 0) {
    return (
      <div className="max-w-3xl rounded-xl border border-border p-5">
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-2 text-muted-foreground">
          No saved answers were found for this experiment.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      {available.map(([label, value]) => (
        <div key={label} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-base leading-7">{value}</p>
        </div>
      ))}
    </div>
  );
}

function SynthesisSection({
  synthesis,
}: {
  synthesis: RejectionSynthesisResult;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold leading-tight">
        {synthesis.headline}
      </h3>
      <p className="text-lg leading-8 text-muted-foreground">
        {synthesis.interpretation}
      </p>
    </div>
  );
}
