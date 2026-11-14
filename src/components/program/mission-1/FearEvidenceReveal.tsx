'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SpeechContent } from '@/components/ui/speech-content';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $progress } from '@/lib/stores/progress';
import { $userContext } from '@/lib/stores/user-context';
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
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);
  const contextState = useStore($userContext);
  const saved = (progress.payload ?? {}) as RevealPayload;

  const activeNodeKey = nodeKey || node.key;

  const founderName =
    contextState.profile?.display_name?.trim() ||
    contextState.profile?.username?.trim() ||
    null;

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
  const [isGenerating, setIsGenerating] = useState(!saved.synthesis);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (saved.synthesis?.headline && saved.synthesis?.interpretation) {
      setSynthesis(saved.synthesis);
      setIsGenerating(false);
    }
    if (typeof saved.reflection === 'string' && saved.reflection && !reflection) {
      setReflection(saved.reflection);
    }
  }, [saved.synthesis, saved.reflection]);

  const { warmupEvidence, stretchEvidence, experimentEvidence } = useMemo(() => {
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

    const warmupItems: EvidenceItem[] = fields
      .filter(([key]) => Boolean(warmup[key]?.toString().trim()))
      .map(([key, title]) => ({
        title: `Warmup · ${title}`,
        content: String(warmup[key]).trim(),
      }));

    const stretchItems: EvidenceItem[] = fields
      .filter(([key]) => Boolean(stretch[key]?.toString().trim()))
      .map(([key, title]) => ({
        title: `Harder ask · ${title}`,
        content: String(stretch[key]).trim(),
      }));

    return {
      warmupEvidence: warmupItems,
      stretchEvidence: stretchItems,
      experimentEvidence: [...warmupItems, ...stretchItems],
    };
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
    if (!progressState.isHydrated) return;
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
        const combined = [...experimentEvidence];

        // Only pull from user_observations as a fallback if one of the two
        // experiment payloads is missing from progressState.
        if (warmupEvidence.length === 0 || stretchEvidence.length === 0) {
          const observations = (await getQuest4Reflections()) as ReflectionRecord[];
          if (cancelled) return;

          for (const item of observations) {
            if (!item.content?.trim()) continue;
            const isWarmup = item.source_node_key === 'm1-q4-warmup';
            const isStretch = item.source_node_key === 'm1-q4-stretch';

            if ((isWarmup && warmupEvidence.length === 0) || (isStretch && stretchEvidence.length === 0)) {
              combined.push({
                title: isWarmup ? 'Warmup · Full record' : 'Harder ask · Full record',
                content: item.content.trim(),
              });
            }
          }
        }

        if (combined.length === 0) {
          throw new Error(
            'We could not find the saved answers from your two experiments. Please check that both experiments have been completed.',
          );
        }

        const result = await generateRejectionSynthesis(combined, activeNodeKey);
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
    progressState.isHydrated,
    experimentEvidence,
    warmupEvidence.length,
    stretchEvidence.length,
    activeNodeKey,
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

  if (!progressState.isHydrated) {
    return (
      <div className="flex items-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading your experiments...</span>
      </div>
    );
  }

  if (progress.completed || saved.completed === true) {
    return (
      <div className="w-full max-w-4xl space-y-12 pb-16 animate-in fade-in duration-300">
        <Header nodeTitle={node.title} founderName={founderName} />

        <ExperimentSection title="The warmup" experiment={warmup} />
        <ExperimentSection title="The harder ask" experiment={stretch} />

        {saved.synthesis && <SynthesisSection synthesis={saved.synthesis} />}

        <section className="max-w-3xl space-y-3 border-t border-border pt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What I take from this
          </p>
          <p className="text-lg leading-8">{saved.reflection}</p>
        </section>

        <div className="flex justify-end border-t border-border pt-6">
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
    <div className="w-full max-w-4xl space-y-12 pb-16 animate-in fade-in duration-300">
      <Header nodeTitle={node.title} founderName={founderName} />

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
            <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-5 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
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

        <SpeechTextarea
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder="What I take from these two experiences..."
          rows={5}
          className="resize-y text-lg leading-8"
          disabled={isGenerating || isSubmitting || !synthesis}
        />
      </section>

      {error && !isGenerating && synthesis && (
        <p className="max-w-3xl text-sm text-destructive">{error}</p>
      )}

      <div className="flex max-w-3xl justify-end border-t border-border pt-6">
        <Button
          onClick={() => void handleComplete()}
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

function Header({
  nodeTitle,
  founderName,
}: {
  nodeTitle: string;
  founderName: string | null;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        {nodeTitle}
      </h2>
      <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
        {founderName ? `${founderName}, compare ` : 'Compare '}
        what you expected with what actually happened in both asks. The point
        is not to make either experience sound positive. It is to look at the
        evidence and notice what stands out to you.
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
    <div className="max-w-3xl rounded-2xl border border-border bg-card p-6 space-y-5">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      {available.map(([label, value]) => (
        <div key={label} className="space-y-1.5">
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
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
      <SpeechContent
        textToRead={`${synthesis.headline}. ${synthesis.interpretation}`}
        showControls="always"
        controlsPosition="top-right"
      >
        <div className="space-y-4">
          <h3 className="pr-16 font-heading text-2xl font-semibold leading-tight">
            {synthesis.headline}
          </h3>
          <p className="text-lg leading-8 text-muted-foreground">
            {synthesis.interpretation}
          </p>
        </div>
      </SpeechContent>
    </div>
  );
}