'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  ArrowRight,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $progress } from '@/lib/stores/progress';
import {
  $experimentBlueprints,
  experimentBlueprintsActions,
} from '@/lib/stores/experiments';
import {
  fetchExperimentBlueprints,
  fetchMission3ContextSummary,
} from '@/actions/experiments';
import type {Mission3ContextSummary} from '@/lib/types/experiments';
import { reviewMission3Pitch } from '@/actions/responses/mission3';
import {
  recommendExperimentsForFounder,
  type ExperimentBlueprint,
  type ExperimentPitchSetup,
  type FounderAccessProfile,
} from '@/lib/types/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export type PitchReviewResult = {
  whatWorks: string[];
  watchOut: string[];
  sharperVersions: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function PitchAndTestReveal({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);
  const storeBlueprints = useStore($experimentBlueprints);

  const saved = isRecord(progress.payload) ? progress.payload : {};
  const accessPayload = isRecord(progressState.payloads['m3-q1-access'])
    ? progressState.payloads['m3-q1-access']
    : {};
  const pitchPayload = isRecord(progressState.payloads['m3-q1-pitch'])
    ? progressState.payloads['m3-q1-pitch']
    : {};

  const accessProfile = (accessPayload.accessProfile ??
    {}) as FounderAccessProfile;
  const originalPitch = (pitchPayload.pitch ?? {}) as ExperimentPitchSetup;

  const [blueprints, setBlueprints] =
    useState<ExperimentBlueprint[]>(storeBlueprints);
  const [context, setContext] = useState<Mission3ContextSummary | null>(null);
  const [review, setReview] = useState<PitchReviewResult | null>(
    isRecord(saved.review) ? (saved.review as PitchReviewResult) : null,
  );
  const [selectedOneLiner, setSelectedOneLiner] = useState<string>(
    typeof saved.selectedOneLiner === 'string' ? saved.selectedOneLiner : '',
  );

  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [ctx, loadedBlueprints] = await Promise.all([
          fetchMission3ContextSummary(),
          storeBlueprints.length > 0
            ? Promise.resolve(storeBlueprints)
            : fetchExperimentBlueprints({ category: 'demand' }),
        ]);

        if (!alive) return;
        setContext(ctx);
        setBlueprints(loadedBlueprints);
        if (storeBlueprints.length === 0 && loadedBlueprints.length > 0) {
          experimentBlueprintsActions.hydrate(loadedBlueprints);
        }

        if (!review && originalPitch.pain) {
          const aiReview = await reviewMission3Pitch({
            projectTitle: ctx.project?.title ?? 'My Project',
            pitch: originalPitch,
            regenerate: false,
          });
          if (alive) setReview(aiReview);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const approachType = useMemo(() => {
    const approach = context?.opportunity?.metadata?.approach;
    return isRecord(approach) && typeof approach.type === 'string'
      ? approach.type
      : null;
  }, [context]);

  const recommendedBlueprints = useMemo(() => {
    return recommendExperimentsForFounder(blueprints, {
      ...accessProfile,
      approachType,
    }).slice(0, 3);
  }, [blueprints, accessProfile, approachType]);

  async function handleRegenerate() {
    if (regenerating || !originalPitch.pain) return;
    setRegenerating(true);
    try {
      const nextReview = await reviewMission3Pitch({
        projectTitle: context?.project?.title ?? 'My Project',
        pitch: originalPitch,
        regenerate: true,
      });
      setReview(nextReview);
    } finally {
      setRegenerating(false);
    }
  }

  async function handleContinue() {
    if (isContinuing) return;
    setIsContinuing(true);
    try {
      await onComplete({
        completed: true,
        review,
        selectedOneLiner: selectedOneLiner || undefined,
        recommendedKeys: recommendedBlueprints.map((b) => b.key),
      });
    } finally {
      setIsContinuing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Reviewing your pitch and matching tests…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Pitch Check &amp; Matching Tests
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Founder's Original Framing */}
      <div className="max-w-3xl space-y-3 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your Framing
        </p>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="font-semibold text-foreground">Who: </span>
            <span className="text-muted-foreground">
              {originalPitch.audience}
            </span>
          </div>
          <div>
            <span className="font-semibold text-foreground">Small ask: </span>
            <span className="text-muted-foreground">{originalPitch.ask}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="font-semibold text-foreground">Problem: </span>
            <span className="text-muted-foreground">{originalPitch.pain}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="font-semibold text-foreground">Direction: </span>
            <span className="text-muted-foreground">
              {originalPitch.direction}
            </span>
          </div>
        </div>
      </div>

      {/* AI Pitch Review */}
      {review && (
        <div className="max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold">How your framing lands</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleRegenerate()}
              disabled={regenerating}
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`}
              />
              Try another angle
            </Button>
          </div>

          {review.whatWorks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                What already works
              </p>
              <ul className="space-y-1 text-sm leading-6 text-muted-foreground">
                {review.whatWorks.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {review.watchOut.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Worth tightening
              </p>
              <ul className="space-y-1 text-sm leading-6 text-muted-foreground">
                {review.watchOut.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {review.sharperVersions.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Optional plain-spoken versions (click one if you want to carry
                it forward)
              </p>
              <div className="space-y-2">
                {review.sharperVersions.map((line, i) => {
                  const isPicked = selectedOneLiner === line;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setSelectedOneLiner(isPicked ? '' : line)
                      }
                      className={`flex w-full items-start justify-between gap-3 rounded-xl border p-4 text-left text-sm leading-6 transition ${
                        isPicked
                          ? 'border-primary bg-primary/[0.05] text-foreground'
                          : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      <span>&ldquo;{line}&rdquo;</span>
                      {isPicked && (
                        <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommended Tests */}
      <div className="max-w-3xl space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">
            Tests that fit your reach and project
          </h2>
          <p className="text-sm text-muted-foreground">
            Based on how you can reach people this week, these are the best
            fits. You&apos;ll pick which one(s) to run on the next screen.
          </p>
        </div>

        <div className="space-y-3">
          {recommendedBlueprints.map((bp) => (
            <div
              key={bp.key}
              className="space-y-2 rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-foreground">{bp.name}</h3>
                <span className="rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground">
                  {bp.cost_estimate}
                </span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {bp.one_line}
              </p>
              <div className="grid gap-2 pt-2 text-xs sm:grid-cols-2">
                <div className="rounded-xl bg-emerald-500/[0.06] p-3">
                  <span className="font-semibold text-emerald-700">
                    Strong signal:{' '}
                  </span>
                  <span className="text-muted-foreground">
                    {bp.strong_signal_guide}
                  </span>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <span className="font-semibold text-foreground">
                    Weak signal:{' '}
                  </span>
                  <span className="text-muted-foreground">
                    {bp.weak_signal_guide}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={isContinuing}
          className="h-12 rounded-full px-8 text-base"
        >
          {isContinuing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Continuing…
            </>
          ) : (
            <>
              Choose your test(s)
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}