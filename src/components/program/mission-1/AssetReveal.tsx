'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SpeechContent } from '@/components/ui/speech-content';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { updateUserProgramContext } from '@/actions/user-context';
import {
  $userContext,
  userContextActions,
} from '@/lib/stores/user-context';
import { generateAssetReveal } from '@/actions/responses/mission1';
import type {
  AssetRevealInput,
  CapabilitiesContext,
  ExperienceContext,
} from '@/lib/types/ai';

type AssetRevealPayload = {
  synthesis?: string;
  confirmed?: boolean;
  completed?: boolean;
};

type ResourceAssessmentAddition = {
  additional_notes?: string;
  [key: string]: unknown;
};

type AdditionalAssessment = {
  resources?: ResourceAssessmentAddition;
  [key: string]: unknown;
};

const CAPABILITY_LABELS: Record<string, string> = {
  making: 'Making & Inventing',
  people: 'People & Communication',
  uncertainty: 'Navigating Uncertainty & Pressure',
  learning: 'Self-Direction & Learning',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  work_industry: 'Workplaces & Industries',
  customers_served: 'People & Customers Served',
  communities: 'Communities & Circles',
  lived_friction: 'Problems & Setbacks Lived Through',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getAdditionalAssessment(value: unknown): AdditionalAssessment {
  if (!isRecord(value)) return {};
  return value as AdditionalAssessment;
}

function normalizeResources(value: unknown): AssetRevealInput['resources'] {
  if (!isRecord(value) || !Array.isArray(value.items)) return [];

  return value.items
    .filter(isRecord)
    .map((item) => ({
      type: typeof item.type === 'string' ? item.type : 'resource',
      title: typeof item.title === 'string' ? item.title : '',
      detail: typeof item.detail === 'string' ? item.detail : '',
    }))
    .filter((item) => item.title || item.detail);
}

function normalizeNetworks(value: unknown): AssetRevealInput['networks'] {
  const rawList = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.items)
      ? value.items
      : [];

  return rawList
    .filter(isRecord)
    .map((item) => ({
      type: typeof item.type === 'string' ? item.type : 'connection',
      name: typeof item.name === 'string' ? item.name : '',
      description:
        typeof item.description === 'string'
          ? item.description
          : typeof item.access === 'string'
            ? item.access
            : '',
    }))
    .filter((item) => item.name);
}

function normalizeCapabilities(
  value: unknown
): AssetRevealInput['capabilities'] {
  if (!isRecord(value)) return [];

  // New bucketed structure: { entries: [{ capabilityKey, rawUserInput, tags }] }
  if (Array.isArray((value as CapabilitiesContext).entries)) {
    return (value as CapabilitiesContext).entries
      .map((entry) => ({
        area:
          CAPABILITY_LABELS[entry.capabilityKey] ?? 'Additional Strength',
        story: typeof entry.rawUserInput === 'string' ? entry.rawUserInput : '',
        tags: Array.isArray(entry.tags)
          ? entry.tags
              .map((t) => (typeof t?.name === 'string' ? t.name : ''))
              .filter(Boolean)
          : [],
      }))
      .filter((item) => item.story || item.tags.length > 0);
  }

  // Legacy structure: { items: [{ id, title, evidence }] }
  if (Array.isArray(value.items)) {
    return value.items
      .filter(isRecord)
      .map((item) => ({
        area: typeof item.title === 'string' ? item.title : 'Capability',
        story: typeof item.evidence === 'string' ? item.evidence : '',
        tags: typeof item.title === 'string' ? [item.title] : [],
      }))
      .filter((item) => item.story || item.tags.length > 0);
  }

  return [];
}

function normalizeExperience(value: unknown): AssetRevealInput['experience'] {
  if (!isRecord(value)) return [];

  // New bucketed structure: { entries: [{ experienceKey, rawUserInput, tags }] }
  if (Array.isArray((value as ExperienceContext).entries)) {
    return (value as ExperienceContext).entries
      .map((entry) => ({
        arena:
          EXPERIENCE_LABELS[entry.experienceKey] ?? 'Additional Experience',
        story: typeof entry.rawUserInput === 'string' ? entry.rawUserInput : '',
        tags: Array.isArray(entry.tags)
          ? entry.tags
              .map((t) => (typeof t?.name === 'string' ? t.name : ''))
              .filter(Boolean)
          : [],
      }))
      .filter((item) => item.story || item.tags.length > 0);
  }

  // Legacy structure: { items: [{ id, title, evidence }] }
  if (Array.isArray(value.items)) {
    return value.items
      .filter(isRecord)
      .map((item) => ({
        arena: typeof item.title === 'string' ? item.title : 'Experience',
        story: typeof item.evidence === 'string' ? item.evidence : '',
        tags: typeof item.title === 'string' ? [item.title] : [],
      }))
      .filter((item) => item.story || item.tags.length > 0);
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
  const context = rawContext.userContext;
  const profile = rawContext.profile;
  const hasGeneratedRef = useRef(false);

  const founderName =
    profile?.display_name?.trim() || profile?.username?.trim() || null;

  const saved = (progress.payload ?? {}) as AssetRevealPayload;

  const savedSynthesis =
    typeof saved.synthesis === 'string' ? saved.synthesis : '';

  const additionalAssessment = getAdditionalAssessment(
    context?.additional_assessment
  );

  const resourceAddition = isRecord(additionalAssessment.resources)
    ? (additionalAssessment.resources as ResourceAssessmentAddition)
    : {};

  const savedAdditionalNotes =
    typeof resourceAddition.additional_notes === 'string'
      ? resourceAddition.additional_notes
      : '';

  const [synthesis, setSynthesis] = useState(savedSynthesis);
  const [additionalNotes, setAdditionalNotes] = useState(savedAdditionalNotes);

  const [mode, setMode] = useState<'generating' | 'review'>(
    savedSynthesis ? 'review' : 'generating'
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const normalizedAssets = useMemo<AssetRevealInput>(
    () => ({
      userName: founderName ?? undefined,
      resources: normalizeResources(context?.resources),
      networks: normalizeNetworks(context?.network_context),
      capabilities: normalizeCapabilities(context?.capabilities),
      experience: normalizeExperience(context?.experience),
    }),
    [
      founderName,
      context?.resources,
      context?.network_context,
      context?.capabilities,
      context?.experience,
    ]
  );

  useEffect(() => {
    setAdditionalNotes(savedAdditionalNotes);
  }, [savedAdditionalNotes]);

  useEffect(() => {
    if (savedSynthesis) {
      setSynthesis(savedSynthesis);
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
        const result = await generateAssetReveal(normalizedAssets, nodeKey);

        setSynthesis(result);
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

    void generate();
  }, [
    rawContext.isHydrated,
    savedSynthesis,
    normalizedAssets,
    nodeKey,
    generationAttempt,
  ]);

  async function handleSubmit() {
    if (!synthesis.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const existingAssessment = getAdditionalAssessment(
        context?.additional_assessment
      );

      const existingResources = isRecord(existingAssessment.resources)
        ? existingAssessment.resources
        : {};

      const trimmedNotes = additionalNotes.trim();

      const nextResources: ResourceAssessmentAddition = {
        ...existingResources,
      };

      if (trimmedNotes) {
        nextResources.additional_notes = trimmedNotes;
      } else {
        delete nextResources.additional_notes;
      }

      const nextAssessment: AdditionalAssessment = {
        ...existingAssessment,
      };

      if (Object.keys(nextResources).length > 0) {
        nextAssessment.resources = nextResources;
      } else {
        delete nextAssessment.resources;
      }

      const result = await updateUserProgramContext({
        additional_assessment: nextAssessment,
      });

      userContextActions.updateContextLocally(result.userContext);

      await onComplete({
        synthesis: synthesis.trim(),
        confirmed: true,
        additional_assessment: nextAssessment,
        completed: true,
      });
    } catch (err) {
      console.error('[ASSET REVEAL COMPLETE]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your reflection.'
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
            Looking across what you already have.
          </h2>

          <p className="text-lg leading-8 text-muted-foreground">
            You explored your resources, connections, capabilities, and
            experience separately. Now we&apos;re looking at them together to
            see what your starting position might make possible.
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
    <div className="w-full max-w-3xl space-y-10 pb-12 animate-in fade-in duration-300">
      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          What we notice
        </p>

        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {founderName
            ? `${founderName}, you are not starting from zero.`
            : node.title || 'You are not starting from zero.'}
        </h2>

        <p className="text-lg leading-8 text-muted-foreground">
          You looked at each part of what you already have separately.
          Looking at them together reveals something different.
        </p>
      </div>

      {/* AI synthesis with text-to-speech playback */}
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <SpeechContent
          textToRead={synthesis}
          showControls="always"
          controlsPosition="top-right"
        >
          <div className="space-y-4">
            <p className="pr-16 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              The leverage we see
            </p>

            <p className="text-base leading-7 text-foreground sm:text-lg sm:leading-8">
              {synthesis}
            </p>
          </div>
        </SpeechContent>
      </section>

      {/* Why this matters */}
      <section className="space-y-3 border-t border-border pt-7">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Why we start here
        </p>

        <h3 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
          You are not starting from zero.
        </h3>

        <p className="leading-7 text-muted-foreground">
          You don&apos;t need everything before you begin. You need to
          understand what you can use now, what you can learn as you go, and
          what genuinely needs attention. Your starting point is something to
          work with, not a checklist you must complete.
        </p>
      </section>

      {/* Additional assessment for resources */}
      <section className="space-y-4 border-t border-border pt-7">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Your reflection
          </p>

          <h3 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
            Is there something important we&apos;re missing?
          </h3>

          <p className="leading-7 text-muted-foreground">
            This is one way of connecting what you shared about your resources,
            connections, capabilities, and experience. You may know of other
            strengths, limitations, or support that would complete the picture.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="resources-additional-notes"
            className="text-sm font-medium text-foreground"
          >
            Anything else we should know about what you have to work with?
            <span className="ml-2 font-normal text-muted-foreground">
              (Optional)
            </span>
          </label>

          <SpeechTextarea
            id="resources-additional-notes"
            value={additionalNotes}
            onChange={(event) => setAdditionalNotes(event.target.value)}
            placeholder="Something else I can draw on, or a limitation I need to work around, is..."
            rows={4}
            disabled={isSubmitting}
            className="resize-y text-base leading-7"
          />

          <p className="text-sm leading-6 text-muted-foreground">
            You can leave this blank if nothing else comes to mind. You can
            add to it later.
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
          disabled={!synthesis.trim() || isSubmitting}
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