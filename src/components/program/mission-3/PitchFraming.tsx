'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import {
  fetchMission3ContextSummary,
  type Mission3ContextSummary,
} from '@/actions/experiments';
import type { ExperimentPitchSetup } from '@/lib/types/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type PitchFramingPayload = {
  completed?: boolean;
  pitch?: ExperimentPitchSetup;
};

export function PitchFraming({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const saved = (progress.payload ?? {}) as PitchFramingPayload;
  const savedPitch = saved.pitch ?? {};

  const [context, setContext] = useState<Mission3ContextSummary | null>(null);
  const [audience, setAudience] = useState(savedPitch.audience ?? '');
  const [pain, setPain] = useState(savedPitch.pain ?? '');
  const [direction, setDirection] = useState(savedPitch.direction ?? '');
  const [ask, setAsk] = useState(savedPitch.ask ?? '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMission3ContextSummary()
      .then((data) => {
        if (!alive) return;
        setContext(data);
        // Pre-fill empty fields gently from Mission 2 context on first visit
        setPain((prev) =>
          prev.trim()
            ? prev
            : data.opportunity?.problem || data.project?.description || '',
        );
        const approach = data.opportunity?.metadata?.approach as
          | Record<string, unknown>
          | undefined;
        if (typeof approach?.description === 'string') {
          setDirection((prev) =>
            prev.trim() ? prev : (approach.description as string),
          );
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function handleContinue() {
    if (isSubmitting) return;

    if (
      !audience.trim() ||
      !pain.trim() ||
      !direction.trim() ||
      !ask.trim()
    ) {
      setError(
        'Please fill in all four parts so we can review how your pitch lands.',
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onComplete({
        completed: true,
        pitch: {
          audience: audience.trim(),
          pain: pain.trim(),
          direction: direction.trim(),
          ask: ask.trim(),
        },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your pitch.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Reference quotes from Mission 2 */}
      {context && context.m2Quotes.length > 0 && (
        <div className="max-w-3xl space-y-2 rounded-2xl border border-border bg-muted/30 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Quote className="h-3.5 w-3.5 text-primary" />
            <span>Words from your Mission 2 notes</span>
          </div>
          <ul className="space-y-1.5 text-sm leading-6 text-muted-foreground">
            {context.m2Quotes.map((quote, idx) => (
              <li key={idx}>• &ldquo;{quote}&rdquo;</li>
            ))}
          </ul>
        </div>
      )}

      <div className="max-w-3xl space-y-6">
        <div className="space-y-2">
          <label className="text-base font-bold text-foreground">
            1. Who is this for?
          </label>
          <p className="text-sm text-muted-foreground">
            Be specific enough that the right person reads it and thinks,
            &ldquo;that&apos;s me.&rdquo;
          </p>
          <SpeechTextarea
            rows={2}
            value={audience}
            onChange={(e) => {
              setAudience(e.target.value);
              setError(null);
            }}
            disabled={isSubmitting}
            placeholder="e.g. Independent cafe owners managing daily stock on paper or spreadsheets"
            className="text-base leading-7"
          />
        </div>

        <div className="space-y-2">
          <label className="text-base font-bold text-foreground">
            2. What is frustrating or costing them right now?
          </label>
          <p className="text-sm text-muted-foreground">
            Stick to the real headache in plain words—skip buzzwords.
          </p>
          <SpeechTextarea
            rows={3}
            value={pain}
            onChange={(e) => {
              setPain(e.target.value);
              setError(null);
            }}
            disabled={isSubmitting}
            placeholder="e.g. Running out of key ingredients mid-week or wasting money over-ordering because tracking stock takes too long after closing"
            className="text-base leading-7"
          />
        </div>

        <div className="space-y-2">
          <label className="text-base font-bold text-foreground">
            3. How are you thinking of helping?
          </label>
          <p className="text-sm text-muted-foreground">
            Share the rough direction without naming a final price or promising
            features you haven&apos;t built yet.
          </p>
          <SpeechTextarea
            rows={3}
            value={direction}
            onChange={(e) => {
              setDirection(e.target.value);
              setError(null);
            }}
            disabled={isSubmitting}
            placeholder="e.g. A 2-minute end-of-day check-in that flags what to reorder before you run out"
            className="text-base leading-7"
          />
        </div>

        <div className="space-y-2">
          <label className="text-base font-bold text-foreground">
            4. What is the one small step you will ask them to take?
          </label>
          <p className="text-sm text-muted-foreground">
            Keep the ask simple—joining an early list, replying with how they
            handle this today, or claiming an early spot.
          </p>
          <SpeechTextarea
            rows={2}
            value={ask}
            onChange={(e) => {
              setAsk(e.target.value);
              setError(null);
            }}
            disabled={isSubmitting}
            placeholder="e.g. Leave your email or WhatsApp to join the first 10 cafes testing the early version"
            className="text-base leading-7"
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={isSubmitting}
          className="h-12 rounded-full px-8 text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Review your pitch &amp; matching tests
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}