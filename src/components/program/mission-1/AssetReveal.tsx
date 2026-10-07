'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Loader2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $userContext } from '@/lib/stores/user-context';
import { generateAssetReveal } from '@/actions/responses/mission1';

type ResourceEntry = {
  id: string;
  type: 'time' | 'money' | 'energy' | 'access' | 'credibility';
  title: string;
  detail: string;
};

type ResourcesContext = {
  items: ResourceEntry[];
};

type NetworkUse =
  | 'ask'
  | 'feedback'
  | 'find'
  | 'test'
  | 'tell'
  | 'learn'
  | 'introduction';

type NetworkEntry = {
  id: string;
  type: 'people' | 'group' | 'professional' | 'online' | 'place';
  name: string;
  access: string;
  possibleUses: NetworkUse[];
};

type CapabilityEntry = {
  id: string;
  title: string;
  evidence: string;
};

type CapabilitiesContext = {
  items: CapabilityEntry[];
};

type ExperienceEntry = {
  id: string;
  title: string;
  evidence: string;
};

type ExperienceContext = {
  items: ExperienceEntry[];
};

type AssetRevealPayload = {
  synthesis?: string;
  confirmed?: boolean;
  completed?: boolean;
};

function getContextItems<T>(
  value: unknown,
  key: 'items'
): T[] {
  if (!value || typeof value !== 'object') return [];

  const items = (value as Record<string, unknown>)[key];

  return Array.isArray(items) ? (items as T[]) : [];
}

function getNetworkItems(value: unknown): NetworkEntry[] {
  if (Array.isArray(value)) {
    return value as NetworkEntry[];
  }

  if (value && typeof value === 'object') {
    const items = (value as Record<string, unknown>).items;

    if (Array.isArray(items)) {
      return items as NetworkEntry[];
    }
  }

  return [];
}

export function AssetReveal({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const rawContext = useStore($userContext);
  const userContext = rawContext.userContext;

  const hasGeneratedRef = useRef(false);

  const saved = (progress.payload ?? {}) as AssetRevealPayload;

  const savedSynthesis =
    typeof saved.synthesis === 'string'
      ? saved.synthesis
      : '';

  const [synthesis, setSynthesis] = useState(savedSynthesis);

  const [confirmed, setConfirmed] = useState(
    saved.confirmed === true
  );

  const [mode, setMode] = useState<'generating' | 'review'>(
    savedSynthesis ? 'review' : 'generating'
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * Q2 investigation results
   */
  const resources = getContextItems<ResourceEntry>(
    userContext?.resources,
    'items'
  );

  const networks = getNetworkItems(
    userContext?.network_context
  );

  const capabilities = getContextItems<CapabilityEntry>(
    userContext?.capabilities,
    'items'
  );

  const experiences = getContextItems<ExperienceEntry>(
    userContext?.experience,
    'items'
  );

  /*
   * Generate the reveal once the context has hydrated.
   *
   * We deliberately keep the dependency list small.
   * This prevents the AI call from repeating when local state changes.
   */
  useEffect(() => {
    if (savedSynthesis) return;

    if (!rawContext.isHydrated) return;

    if (hasGeneratedRef.current) return;

    hasGeneratedRef.current = true;

    setIsGenerating(true);
    setError(null);

    async function generate() {
      try {
        const result = await generateAssetReveal(
          {
            resources,
            networks,
            capabilities,
            experience: experiences,
          },
          nodeKey
        );

        setSynthesis(result);
        setConfirmed(false);
        setMode('review');
      } catch (err) {
        console.error('[ASSET REVEAL]', err);

        hasGeneratedRef.current = false;

        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong creating the reflection.'
        );
      } finally {
        setIsGenerating(false);
      }
    }

    generate();
  }, [
    rawContext.isHydrated,
    savedSynthesis,
    nodeKey,
  ]);

  function handleConfirm() {
    setConfirmed(true);
  }

  function handleReconsider() {
    setConfirmed(false);
  }

  async function handleSubmit() {
    if (!synthesis.trim() || !confirmed || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onComplete({
        synthesis: synthesis.trim(),
        confirmed: true,
        completed: true,
      });
    } catch (err) {
      console.error('[ASSET REVEAL COMPLETE]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your reflection.'
      );

      setIsSubmitting(false);
    }
  }

  /*
   * GENERATING
   */
  if (mode === 'generating') {
    return (
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            WHAT WE NOTICE
          </p>

          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Looking across what you already have.
          </h2>

          <p className="text-lg leading-8 text-muted-foreground">
            You&apos;ve taken stock of your resources, people,
            capabilities, and experience. Now we&apos;re looking at
            them together to see what your starting position actually
            tells us.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Taking a closer look...</span>
        </div>

        {error && (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-destructive">
              {error}
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setError(null);
                hasGeneratedRef.current = false;
                setMode('generating');
              }}
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    );
  }

  /*
   * REVIEW
   */
  return (
    <div className="w-full max-w-3xl space-y-10">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
          WHAT WE NOTICE
        </p>

        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'You are not starting from zero.'}
        </h2>

        <p className="text-lg leading-8 text-muted-foreground">
          You looked at each part of what you already have
          separately. Looking at them together reveals something
          different.
        </p>
      </div>

      <div className="rounded-2xl border bg-muted/20 p-6 sm:p-8">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              THE LEVERAGE WE SEE
            </p>

            <p className="mt-5 text-lg leading-8 text-foreground">
              {synthesis}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 border-t border-border pt-8">
        <h3 className="text-2xl font-medium">
          You are not starting from zero.
        </h3>

        <p className="text-lg leading-8 text-muted-foreground">
          You don&apos;t need everything before you begin. You need
          to understand what you can use now, what you can learn as
          you go, and what genuinely needs attention.
        </p>
      </div>

      {!confirmed ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              Does this feel true to you?
            </h3>

            <p className="text-base leading-7 text-muted-foreground">
              This is an interpretation of what you told us, not a
              verdict. You are the person who gets to decide whether
              it fits.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={handleConfirm}
              className="gap-2"
            >
              Yes, that feels right
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleReconsider}
            >
              Not quite — let me reconsider
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-dashed p-6">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              YOUR TAKE
            </p>

            <p className="mt-3 text-base leading-7 text-foreground">
              You confirmed that this reflection feels true to your
              starting position.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReconsider}
              disabled={isSubmitting}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Reconsider
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!synthesis.trim() || isSubmitting}
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
      )}

      {error && (
        <p className="text-sm leading-6 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}