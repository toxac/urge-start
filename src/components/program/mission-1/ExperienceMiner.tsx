'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Pencil,
  Plus,
  SkipForward,
  Sparkles,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

import { updateUserProgramContext } from '@/actions/user-context';
import { extractExperienceTags } from '@/actions/responses/mission1';
import {
  $userContext,
  userContextActions,
} from '@/lib/stores/user-context';
import type {
  CapabilitiesContext,
  ExperienceBucketEntry,
  ExperienceBucketKey,
  ExperienceContext,
  ExperienceTag,
} from '@/lib/types/ai';

type ExperienceBucketConfig = {
  key: ExperienceBucketKey;
  shortLabel: string;
  title: string;
  whyItMatters: string;
  prompt: string;
  helperText: string;
  placeholder: string;
};

const EXPERIENCE_BUCKETS: ExperienceBucketConfig[] = [
  {
    key: 'work_industry',
    shortLabel: 'Workplaces',
    title: 'Workplaces & Industries',
    whyItMatters:
      'Even an entry-level job, internship, or family business lets you see how money moves, where time gets wasted, and which daily tools frustrate people.',
    prompt: 'What industries, workplaces, or operations have you seen from the inside?',
    helperText:
      'Think about jobs, labs, internships, or businesses you have worked in or around. What goes on behind the scenes that outsiders rarely see?',
    placeholder:
      'For example: I work as a junior backend dev at a SaaS company, and in university I worked in a computer vision lab where we wasted hours fixing broken sensor scripts...',
  },
  {
    key: 'customers_served',
    shortLabel: 'People Served',
    title: 'People & Customers Served',
    whyItMatters:
      'Knowing how a specific group of people thinks, complains, buys, or makes decisions gives you a head start in spotting real needs.',
    prompt: 'What specific groups of people have you helped, served, or dealt with repeatedly?',
    helperText:
      'These do not have to be paying customers—they could be clients, students, patients, event organizers, or coworkers whose requests you handled regularly.',
    placeholder:
      'For example: As student body president, I dealt constantly with campus club organizers trying to get budgets approved and administrators worried about compliance...',
  },
  {
    key: 'communities',
    shortLabel: 'Communities',
    title: 'Communities & Circles',
    whyItMatters:
      'Subcultures, hobby groups, local clubs, and online forums all have shared habits and recurring annoyances that outsiders overlook.',
    prompt: 'What communities, hobbies, or groups are you genuinely part of?',
    helperText:
      'Where do you spend your free time or hang out online? What do people in those circles constantly complain about or cobble together manually?',
    placeholder:
      'For example: I spend weekends in maker spaces and ESP32 forums—most hardware hobbyists love building circuits, but almost everyone gets stuck building a clean web dashboard...',
  },
  {
    key: 'lived_friction',
    shortLabel: 'Lived Problems',
    title: 'Problems & Setbacks Lived Through',
    whyItMatters:
      'Living through a frustrating process, constraint, or failure yourself gives you firsthand proof of what is broken and what you wish existed.',
    prompt: 'What problems or setbacks have you personally struggled through?',
    helperText:
      'Think about transitions, bureaucratic headaches, health or money constraints, or projects that went sideways. What made it painful, and what did it teach you?',
    placeholder:
      'For example: Moving to a new city for my first full-time job—navigating tax deductions, renting without credit history, and budgeting on a junior salary...',
  },
];

function hydrateExperienceEntries(
  rawExperience: unknown,
  progressPayload: Record<string, unknown>
): ExperienceBucketEntry[] {
  const ctx = rawExperience as Record<string, unknown> | null | undefined;
  const payloadExp = progressPayload?.experience as Record<string, unknown> | null | undefined;

  if (ctx && Array.isArray(ctx.entries)) {
    return ctx.entries as ExperienceBucketEntry[];
  }
  if (payloadExp && Array.isArray(payloadExp.entries)) {
    return payloadExp.entries as ExperienceBucketEntry[];
  }

  // Backward compatibility with legacy { items: [{ id, title, evidence }] }
  const legacyItems = Array.isArray(ctx?.items)
    ? ctx.items
    : Array.isArray(payloadExp?.items)
      ? payloadExp.items
      : [];

  if (legacyItems.length > 0) {
    return [
      {
        experienceKey: 'custom',
        rawUserInput: legacyItems
          .map((item: { title?: string; evidence?: string }) =>
            `${item.title ?? ''}: ${item.evidence ?? ''}`.trim()
          )
          .join('\n\n'),
        tags: legacyItems
          .filter((item: { title?: unknown }) => typeof item.title === 'string')
          .map((item: { title: string }) => ({ name: item.title })),
      },
    ];
  }

  return [];
}

function getCapabilityTagPreview(rawCapabilities: unknown): string[] {
  const ctx = rawCapabilities as Record<string, unknown> | null | undefined;
  if (!ctx) return [];

  if (Array.isArray((ctx as CapabilitiesContext).entries)) {
    return (ctx as CapabilitiesContext).entries
      .flatMap((entry) => entry.tags?.map((t) => t.name) ?? [])
      .filter(Boolean)
      .slice(0, 6);
  }

  if (Array.isArray(ctx.items)) {
    return ctx.items
      .map((item: { title?: unknown }) =>
        typeof item.title === 'string' ? item.title : ''
      )
      .filter(Boolean)
      .slice(0, 6);
  }

  return [];
}

export function ExperienceMiner({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);
  const hasInitialized = useRef(false);

  const [entries, setEntries] = useState<ExperienceBucketEntry[]>([]);
  const [stage, setStage] = useState<'capture' | 'review'>('capture');
  const [activeBucketIndex, setActiveBucketIndex] = useState(0);

  // Active card input state
  const [draftText, setDraftText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastCapturedBanner, setLastCapturedBanner] = useState<{
    bucketTitle: string;
    tags: ExperienceTag[];
  } | null>(null);

  // Review screen inline editing state
  const [newTagInputs, setNewTagInputs] = useState<Record<string, string>>({});
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customDraftText, setCustomDraftText] = useState('');
  const [isExtractingCustom, setIsExtractingCustom] = useState(false);

  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentBucket = EXPERIENCE_BUCKETS[activeBucketIndex];

  const capabilityBridgeTags = useMemo(
    () => getCapabilityTagPreview(contextState.userContext?.capabilities),
    [contextState.userContext?.capabilities]
  );

  // Hydrate saved entries from userContext store (or progress payload) once hydrated
  useEffect(() => {
    if (!contextState.isHydrated || hasInitialized.current) return;
    hasInitialized.current = true;

    const initialEntries = hydrateExperienceEntries(
      contextState.userContext?.experience,
      (progress.payload ?? {}) as Record<string, unknown>
    );

    setEntries(initialEntries);

    const isCompleted = progress.completed === true;
    const completedKeys = new Set(initialEntries.map((e) => e.experienceKey));
    const firstIncompleteIdx = EXPERIENCE_BUCKETS.findIndex(
      (b) => !completedKeys.has(b.key)
    );

    if (isCompleted || (initialEntries.length > 0 && firstIncompleteIdx === -1)) {
      setStage('review');
    } else if (firstIncompleteIdx >= 0) {
      setActiveBucketIndex(firstIncompleteIdx);
      const existing = initialEntries.find(
        (e) => e.experienceKey === EXPERIENCE_BUCKETS[firstIncompleteIdx].key
      );
      setDraftText(existing?.rawUserInput ?? '');
      setStage('capture');
    }
  }, [contextState.isHydrated, contextState.userContext?.experience, progress]);

  function goToBucket(idx: number, currentEntries = entries) {
    const target = EXPERIENCE_BUCKETS[idx];
    if (!target) return;

    const existing = currentEntries.find(
      (e) => e.experienceKey === target.key
    );
    setActiveBucketIndex(idx);
    setDraftText(existing?.rawUserInput ?? '');
    setError(null);
    setStage('capture');
  }

  async function persistEntries(nextEntries: ExperienceBucketEntry[]) {
    const experiencePayload: ExperienceContext = {
      entries: nextEntries,
    };

    const result = await updateUserProgramContext({
      experience: experiencePayload,
    });

    userContextActions.updateContextLocally(result.userContext);
    setEntries(nextEntries);
  }

  function advanceAfterBucket(
    currentIdx: number,
    updatedEntries: ExperienceBucketEntry[]
  ) {
    const completedKeys = new Set(updatedEntries.map((e) => e.experienceKey));
    const nextUnanswered = EXPERIENCE_BUCKETS.findIndex(
      (b, idx) => idx > currentIdx && !completedKeys.has(b.key)
    );

    if (nextUnanswered !== -1) {
      goToBucket(nextUnanswered, updatedEntries);
    } else if (currentIdx < EXPERIENCE_BUCKETS.length - 1) {
      goToBucket(currentIdx + 1, updatedEntries);
    } else {
      setStage('review');
    }
  }

  async function handleSaveAndNext() {
    const trimmed = draftText.trim();
    if (trimmed.length < 15) {
      setError(
        'Please share a bit more detail (at least a couple of sentences) so we can capture your experience accurately.'
      );
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const existingEntry = entries.find(
        (e) => e.experienceKey === currentBucket.key
      );

      let extractedTags = existingEntry?.tags ?? [];
      if (
        !existingEntry ||
        existingEntry.rawUserInput.trim() !== trimmed ||
        extractedTags.length === 0
      ) {
        extractedTags = await extractExperienceTags(
          {
            bucketKey: currentBucket.key,
            bucketTitle: currentBucket.title,
            rawUserInput: trimmed,
          },
          nodeKey
        );
      }

      const nextEntry: ExperienceBucketEntry = {
        experienceKey: currentBucket.key,
        rawUserInput: trimmed,
        tags: extractedTags,
      };

      const filtered = entries.filter(
        (e) => e.experienceKey !== currentBucket.key
      );
      const nextEntries = [...filtered, nextEntry];

      await persistEntries(nextEntries);

      setLastCapturedBanner({
        bucketTitle: currentBucket.title,
        tags: extractedTags,
      });

      advanceAfterBucket(activeBucketIndex, nextEntries);
    } catch (err) {
      console.error('[EXPERIENCE CAPTURE SAVE]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong capturing your response. Please try again.'
      );
    } finally {
      setIsExtracting(false);
    }
  }

  function handleSkipBucket() {
    setError(null);
    setLastCapturedBanner(null);

    if (activeBucketIndex < EXPERIENCE_BUCKETS.length - 1) {
      goToBucket(activeBucketIndex + 1);
    } else {
      if (entries.length === 0) {
        setError('Please answer at least one experience area before reviewing.');
        return;
      }
      setStage('review');
    }
  }

  async function handleRemoveTag(experienceKey: string, tagIndex: number) {
    const nextEntries = entries.map((entry) => {
      if (entry.experienceKey !== experienceKey) return entry;
      return {
        ...entry,
        tags: entry.tags.filter((_, idx) => idx !== tagIndex),
      };
    });

    try {
      await persistEntries(nextEntries);
    } catch (err) {
      console.error('[REMOVE EXPERIENCE TAG]', err);
    }
  }

  async function handleAddTag(experienceKey: string) {
    const rawTag = (newTagInputs[experienceKey] ?? '').trim();
    if (!rawTag) return;

    const nextEntries = entries.map((entry) => {
      if (entry.experienceKey !== experienceKey) return entry;
      const alreadyExists = entry.tags.some(
        (t) => t.name.toLowerCase() === rawTag.toLowerCase()
      );
      if (alreadyExists) return entry;
      return {
        ...entry,
        tags: [...entry.tags, { name: rawTag }],
      };
    });

    setNewTagInputs((prev) => ({ ...prev, [experienceKey]: '' }));

    try {
      await persistEntries(nextEntries);
    } catch (err) {
      console.error('[ADD EXPERIENCE TAG]', err);
    }
  }

  async function handleSaveCustomEntry() {
    const trimmed = customDraftText.trim();
    if (trimmed.length < 15) {
      setError('Please write at least a couple of sentences describing this experience.');
      return;
    }

    setIsExtractingCustom(true);
    setError(null);

    const customKey = `custom_${Date.now()}`;

    try {
      const extractedTags = await extractExperienceTags(
        {
          bucketKey: customKey,
          bucketTitle: 'Additional Experience',
          rawUserInput: trimmed,
        },
        nodeKey
      );

      const nextEntries: ExperienceBucketEntry[] = [
        ...entries,
        {
          experienceKey: customKey,
          rawUserInput: trimmed,
          tags: extractedTags,
        },
      ];

      await persistEntries(nextEntries);
      setCustomDraftText('');
      setIsAddingCustom(false);
    } catch (err) {
      console.error('[CUSTOM EXPERIENCE SAVE]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save your additional experience.'
      );
    } finally {
      setIsExtractingCustom(false);
    }
  }

  async function handleCompleteNode() {
    if (entries.length === 0 || isCompleting) return;

    setIsCompleting(true);
    setError(null);

    try {
      await persistEntries(entries);

      await onComplete({
        experience: { entries },
        completed: true,
      });
    } catch (err) {
      console.error('[EXPERIENCE MINER COMPLETE]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong completing this step.'
      );
      setIsCompleting(false);
    }
  }

  if (!contextState.isHydrated) {
    return (
      <div className="flex items-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading your experience inventory...</span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STAGE 2: REVIEW & CONFIRM EXTRACTED EXPERIENCE TERRITORIES
  // ---------------------------------------------------------------------------
  if (stage === 'review') {
    const orderedEntries = [
      ...EXPERIENCE_BUCKETS.map((b) =>
        entries.find((e) => e.experienceKey === b.key)
      ).filter((e): e is ExperienceBucketEntry => Boolean(e)),
      ...entries.filter(
        (e) => !EXPERIENCE_BUCKETS.some((b) => b.key === e.experienceKey)
      ),
    ];

    return (
      <div className="w-full max-w-3xl space-y-10 pb-16 animate-in fade-in duration-300">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Your Experience Territory
          </p>

          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Here is the ground you already know.
          </h1>

          <p className="text-lg leading-8 text-muted-foreground">
            We pulled out the environments, groups, and problem spaces from your stories.
            Remove anything that feels off, add territories we missed, or edit your original notes.
          </p>
        </div>

        <div className="space-y-6">
          {orderedEntries.map((entry) => {
            const bucketMeta = EXPERIENCE_BUCKETS.find(
              (b) => b.key === entry.experienceKey
            );
            const displayTitle = bucketMeta?.title ?? 'Additional Experience';
            const bucketIndex = EXPERIENCE_BUCKETS.findIndex(
              (b) => b.key === entry.experienceKey
            );

            return (
              <div
                key={entry.experienceKey}
                className="rounded-2xl border border-border bg-card p-6 space-y-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    {displayTitle}
                  </h2>

                  {bucketIndex >= 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setLastCapturedBanner(null);
                        goToBucket(bucketIndex);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit story
                    </button>
                  )}
                </div>

                {/* Preserved raw founder words */}
                <blockquote className="border-l-2 border-border pl-4 text-sm leading-6 text-muted-foreground italic whitespace-pre-wrap">
                  &ldquo;{entry.rawUserInput}&rdquo;
                </blockquote>

                {/* Extracted & founder-editable territory tags */}
                <div className="space-y-3 pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Territories &amp; Domains
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag, idx) => (
                      <span
                        key={`${tag.name}-${idx}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-foreground"
                      >
                        {tag.name}
                        <button
                          type="button"
                          aria-label={`Remove ${tag.name}`}
                          onClick={() =>
                            void handleRemoveTag(entry.experienceKey, idx)
                          }
                          className="rounded-full p-0.5 text-muted-foreground transition hover:bg-primary/20 hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Inline add tag input */}
                  <div className="flex max-w-sm items-center gap-2 pt-1">
                    <Input
                      value={newTagInputs[entry.experienceKey] ?? ''}
                      onChange={(e) =>
                        setNewTagInputs((prev) => ({
                          ...prev,
                          [entry.experienceKey]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleAddTag(entry.experienceKey);
                        }
                      }}
                      placeholder="Add another territory..."
                      className="h-9 text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleAddTag(entry.experienceKey)}
                      disabled={!(newTagInputs[entry.experienceKey] ?? '').trim()}
                      className="h-9 shrink-0 gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Optional Custom Experience Area */}
        {isAddingCustom ? (
          <div className="rounded-2xl border border-primary/40 bg-primary/[0.03] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold">
                Add another environment or lived experience
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCustom(false);
                  setCustomDraftText('');
                  setError(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <SpeechTextarea
              value={customDraftText}
              onChange={(e) => setCustomDraftText(e.target.value)}
              placeholder="Describe another industry, group, or problem you know from the inside..."
              rows={4}
              disabled={isExtractingCustom}
              className="resize-y text-base leading-7"
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddingCustom(false)}
                disabled={isExtractingCustom}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleSaveCustomEntry()}
                disabled={isExtractingCustom || customDraftText.trim().length < 15}
                className="gap-2"
              >
                {isExtractingCustom ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extract &amp; add
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingCustom(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-sm font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Another environment or problem you know well? Add another story
          </button>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => goToBucket(0)}
            disabled={isCompleting}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Revisit prompts
          </Button>

          <Button
            type="button"
            onClick={() => void handleCompleteNode()}
            disabled={entries.length === 0 || isCompleting}
            className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
          >
            {isCompleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Confirm &amp; continue
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STAGE 1: PROGRESSIVE SINGLE-CARD CAPTURE
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full max-w-3xl space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Header & Bridge from Capabilities */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {node.title || 'What have you already lived through?'}
        </p>

        {capabilityBridgeTags.length > 0 && (
          <div className="rounded-xl border border-border/80 bg-muted/40 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              You mapped how you operate ({capabilityBridgeTags.join(', ')}). Now look at <span className="text-foreground font-medium">where</span> you have spent enough time to see what is broken from the inside.
            </p>
          </div>
        )}

        {/* Stepper Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {EXPERIENCE_BUCKETS.map((bucket, idx) => {
            const isCompletedBucket = entries.some(
              (e) => e.experienceKey === bucket.key
            );
            const isCurrent = idx === activeBucketIndex;

            return (
              <button
                key={bucket.key}
                type="button"
                onClick={() => {
                  if (!isExtracting) {
                    setLastCapturedBanner(null);
                    goToBucket(idx);
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : isCompletedBucket
                      ? 'bg-primary/15 text-foreground hover:bg-primary/25'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {isCompletedBucket && !isCurrent && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
                <span>
                  {idx + 1}. {bucket.shortLabel}
                </span>
              </button>
            );
          })}

          {entries.length > 0 && (
            <button
              type="button"
              onClick={() => setStage('review')}
              disabled={isExtracting}
              className="ml-auto text-xs font-medium text-primary hover:underline"
            >
              Review saved ({entries.length})
            </button>
          )}
        </div>
      </div>

      {/* Subtle confirmation banner from previous card */}
      {lastCapturedBanner && lastCapturedBanner.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3 text-xs text-muted-foreground animate-in fade-in duration-200">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            Saved <strong className="text-foreground">{lastCapturedBanner.bucketTitle}</strong>:
          </span>
          {lastCapturedBanner.tags.map((t, i) => (
            <span
              key={i}
              className="rounded-full bg-background px-2.5 py-0.5 font-medium text-foreground border border-border"
            >
              {t.name}
            </span>
          ))}
        </div>
      )}

      {/* Active Single Experience Card */}
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Arena {activeBucketIndex + 1} of {EXPERIENCE_BUCKETS.length} ·{' '}
            {currentBucket.title}
          </span>

          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            {currentBucket.prompt}
          </h1>

          {/* Why this matters callout */}
          <div className="rounded-xl bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
            <span className="font-semibold text-foreground">Why we ask: </span>
            {currentBucket.whyItMatters}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm leading-6 text-muted-foreground">
            {currentBucket.helperText}
          </p>

          <SpeechTextarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder={currentBucket.placeholder}
            rows={6}
            disabled={isExtracting}
            className="resize-y text-base leading-7"
          />

          <p className="text-xs text-muted-foreground">
            You can type or tap the microphone icon to speak naturally. Your answer saves automatically when you move forward.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Navigation Controls */}
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {activeBucketIndex > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setLastCapturedBanner(null);
                  goToBucket(activeBucketIndex - 1);
                }}
                disabled={isExtracting}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={handleSkipBucket}
              disabled={isExtracting}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="h-4 w-4" />
              Skip for now
            </Button>
          </div>

          <Button
            type="button"
            onClick={() => void handleSaveAndNext()}
            disabled={isExtracting || draftText.trim().length < 15}
            className="h-11 gap-2 rounded-full px-7 text-base shadow-sm"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Capturing territory...
              </>
            ) : (
              <>
                {activeBucketIndex === EXPERIENCE_BUCKETS.length - 1
                  ? 'Save & review all'
                  : 'Save & next'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}