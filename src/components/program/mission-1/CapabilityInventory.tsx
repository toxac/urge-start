'use client';

import { useEffect, useRef, useState } from 'react';
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
import { extractCapabilityTags } from '@/actions/responses/mission1';
import {
  $userContext,
  userContextActions,
} from '@/lib/stores/user-context';
import type {
  CapabilitiesContext,
  CapabilityBucketEntry,
  CapabilityBucketKey,
  CapabilityTag,
} from '@/lib/types/ai';

type CapabilityBucketConfig = {
  key: CapabilityBucketKey;
  shortLabel: string;
  title: string;
  whyItMatters: string;
  prompt: string;
  helperText: string;
  placeholder: string;
};

const CAPABILITY_BUCKETS: CapabilityBucketConfig[] = [
  {
    key: 'making',
    shortLabel: 'Making',
    title: 'Making & Inventing',
    whyItMatters:
      'Starting something means turning rough ideas into tangible things—whether that is software, hardware, spreadsheets, designs, or practical workarounds.',
    prompt: 'What do you actually know how to make, build, or fix?',
    helperText:
      'Do not just think about your job title. Think about what you build at work, tinker with on weekends, repair when it breaks, or rig together when standard tools fail.',
    placeholder:
      'For example: At work I build web backends, and on weekends I solder microcontroller circuits and connect sensors to dashboards...',
  },
  {
    key: 'people',
    shortLabel: 'People',
    title: 'People & Communication',
    whyItMatters:
      'Before a business has customers or revenue, it involves talking to strangers, listening closely, and getting people aligned.',
    prompt: 'How do you interact with and move other people?',
    helperText:
      'Are you comfortable approaching strangers? Can you listen until you hear what someone is really struggling with, explain complex things simply, or bring disagreeing groups to a compromise?',
    placeholder:
      'For example: I enjoy talking to strangers at events, and I am usually the person who translates technical details for non-technical teammates...',
  },
  {
    key: 'uncertainty',
    shortLabel: 'Uncertainty',
    title: 'Navigating Uncertainty & Pressure',
    whyItMatters:
      'Early-stage work rarely comes with clear instructions. Knowing both how you create order and where high stakes make you freeze helps you choose the right path.',
    prompt: 'How do you handle chaos, high pressure, or managing risks?',
    helperText:
      'When things go off track or you have to decide with incomplete information, what is your natural instinct? Are you calm under fire, good at spotting roadblocks early, or do you tend to overthink when financial risk feels high? Honest answers here are invaluable.',
    placeholder:
      'For example: When deadlines and rules are clear I can organize huge events, but when financial risk is ambiguous I tend to overthink...',
  },
  {
    key: 'learning',
    shortLabel: 'Learning',
    title: 'Self-Direction & Learning',
    whyItMatters:
      'You will constantly run into problems nobody trained you for. Your ability to teach yourself without waiting for permission is one of your strongest assets.',
    prompt: 'What can you teach yourself, and how do you figure things out?',
    helperText:
      'Think of a time you had to learn an unfamiliar tool, craft, or subject completely on your own to solve a real problem. How did you approach it?',
    placeholder:
      'For example: My degree was mostly theory, so I taught myself embedded systems by digging through open-source repos to build a prototype...',
  },
];

function hydrateEntriesFromContext(
  rawCapabilities: unknown,
  progressPayload: Record<string, unknown>
): CapabilityBucketEntry[] {
  const ctx = rawCapabilities as Record<string, unknown> | null | undefined;
  const payloadCap = progressPayload?.capabilities as Record<string, unknown> | null | undefined;

  if (ctx && Array.isArray(ctx.entries)) {
    return ctx.entries as CapabilityBucketEntry[];
  }
  if (payloadCap && Array.isArray(payloadCap.entries)) {
    return payloadCap.entries as CapabilityBucketEntry[];
  }

  // Backward compatibility with legacy { items: [{ id, title, evidence }] }
  const legacyItems = Array.isArray(ctx?.items)
    ? ctx.items
    : Array.isArray(payloadCap?.items)
      ? payloadCap.items
      : [];

  if (legacyItems.length > 0) {
    return [
      {
        capabilityKey: 'custom',
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

export function CapabilityInventory({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);
  const hasInitialized = useRef(false);

  const [entries, setEntries] = useState<CapabilityBucketEntry[]>([]);
  const [stage, setStage] = useState<'capture' | 'review'>('capture');
  const [activeBucketIndex, setActiveBucketIndex] = useState(0);

  // Active card input state
  const [draftText, setDraftText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastCapturedBanner, setLastCapturedBanner] = useState<{
    bucketTitle: string;
    tags: CapabilityTag[];
  } | null>(null);

  // Review screen inline editing state
  const [newTagInputs, setNewTagInputs] = useState<Record<string, string>>({});
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customDraftText, setCustomDraftText] = useState('');
  const [isExtractingCustom, setIsExtractingCustom] = useState(false);

  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentBucket = CAPABILITY_BUCKETS[activeBucketIndex];

  // Hydrate saved entries and determine starting step
  useEffect(() => {
    if (!contextState.isHydrated || hasInitialized.current) return;
    hasInitialized.current = true;

    const initialEntries = hydrateEntriesFromContext(
      contextState.userContext?.capabilities,
      (progress.payload ?? {}) as Record<string, unknown>
    );

    setEntries(initialEntries);

    const isCompleted = progress.completed === true;
    const completedKeys = new Set(initialEntries.map((e) => e.capabilityKey));
    const firstIncompleteIdx = CAPABILITY_BUCKETS.findIndex(
      (b) => !completedKeys.has(b.key)
    );

    if (isCompleted || (initialEntries.length > 0 && firstIncompleteIdx === -1)) {
      setStage('review');
    } else if (firstIncompleteIdx >= 0) {
      setActiveBucketIndex(firstIncompleteIdx);
      const existing = initialEntries.find(
        (e) => e.capabilityKey === CAPABILITY_BUCKETS[firstIncompleteIdx].key
      );
      setDraftText(existing?.rawUserInput ?? '');
      setStage('capture');
    }
  }, [contextState.isHydrated, contextState.userContext?.capabilities, progress]);

  function goToBucket(idx: number, currentEntries = entries) {
    const target = CAPABILITY_BUCKETS[idx];
    if (!target) return;

    const existing = currentEntries.find(
      (e) => e.capabilityKey === target.key
    );
    setActiveBucketIndex(idx);
    setDraftText(existing?.rawUserInput ?? '');
    setError(null);
    setStage('capture');
  }

  async function persistEntries(nextEntries: CapabilityBucketEntry[]) {
    const capabilitiesPayload: CapabilitiesContext = {
      entries: nextEntries,
    };

    const result = await updateUserProgramContext({
      capabilities: capabilitiesPayload,
    });

    userContextActions.updateContextLocally(result.userContext);
    setEntries(nextEntries);
  }

  function advanceAfterBucket(
    currentIdx: number,
    updatedEntries: CapabilityBucketEntry[]
  ) {
    const completedKeys = new Set(updatedEntries.map((e) => e.capabilityKey));
    const nextUnanswered = CAPABILITY_BUCKETS.findIndex(
      (b, idx) => idx > currentIdx && !completedKeys.has(b.key)
    );

    if (nextUnanswered !== -1) {
      goToBucket(nextUnanswered, updatedEntries);
    } else if (currentIdx < CAPABILITY_BUCKETS.length - 1) {
      goToBucket(currentIdx + 1, updatedEntries);
    } else {
      setStage('review');
    }
  }

  async function handleSaveAndNext() {
    const trimmed = draftText.trim();
    if (trimmed.length < 15) {
      setError(
        'Please share a bit more detail (at least a couple of sentences) so we can capture your strengths accurately.'
      );
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const existingEntry = entries.find(
        (e) => e.capabilityKey === currentBucket.key
      );

      // Re-extract only if text changed or no tags exist yet
      let extractedTags = existingEntry?.tags ?? [];
      if (
        !existingEntry ||
        existingEntry.rawUserInput.trim() !== trimmed ||
        extractedTags.length === 0
      ) {
        extractedTags = await extractCapabilityTags(
          {
            bucketKey: currentBucket.key,
            bucketTitle: currentBucket.title,
            rawUserInput: trimmed,
          },
          nodeKey
        );
      }

      const nextEntry: CapabilityBucketEntry = {
        capabilityKey: currentBucket.key,
        rawUserInput: trimmed,
        tags: extractedTags,
      };

      const filtered = entries.filter(
        (e) => e.capabilityKey !== currentBucket.key
      );
      const nextEntries = [...filtered, nextEntry];

      await persistEntries(nextEntries);

      setLastCapturedBanner({
        bucketTitle: currentBucket.title,
        tags: extractedTags,
      });

      advanceAfterBucket(activeBucketIndex, nextEntries);
    } catch (err) {
      console.error('[CAPABILITY CAPTURE SAVE]', err);
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

    if (activeBucketIndex < CAPABILITY_BUCKETS.length - 1) {
      goToBucket(activeBucketIndex + 1);
    } else {
      if (entries.length === 0) {
        setError('Please answer at least one capability area before reviewing.');
        return;
      }
      setStage('review');
    }
  }

  // Review stage: remove a single tag chip
  async function handleRemoveTag(capabilityKey: string, tagIndex: number) {
    const nextEntries = entries.map((entry) => {
      if (entry.capabilityKey !== capabilityKey) return entry;
      return {
        ...entry,
        tags: entry.tags.filter((_, idx) => idx !== tagIndex),
      };
    });

    try {
      await persistEntries(nextEntries);
    } catch (err) {
      console.error('[REMOVE CAPABILITY TAG]', err);
    }
  }

  // Review stage: add a custom tag chip to an existing entry
  async function handleAddTag(capabilityKey: string) {
    const rawTag = (newTagInputs[capabilityKey] ?? '').trim();
    if (!rawTag) return;

    const nextEntries = entries.map((entry) => {
      if (entry.capabilityKey !== capabilityKey) return entry;
      const alreadyExists = entry.tags.some(
        (t) => t.name.toLowerCase() === rawTag.toLowerCase()
      );
      if (alreadyExists) return entry;
      return {
        ...entry,
        tags: [...entry.tags, { name: rawTag }],
      };
    });

    setNewTagInputs((prev) => ({ ...prev, [capabilityKey]: '' }));

    try {
      await persistEntries(nextEntries);
    } catch (err) {
      console.error('[ADD CAPABILITY TAG]', err);
    }
  }

  // Review stage: save an additional custom bucket
  async function handleSaveCustomEntry() {
    const trimmed = customDraftText.trim();
    if (trimmed.length < 15) {
      setError('Please write at least a couple of sentences describing this ability.');
      return;
    }

    setIsExtractingCustom(true);
    setError(null);

    const customKey = `custom_${Date.now()}`;

    try {
      const extractedTags = await extractCapabilityTags(
        {
          bucketKey: customKey,
          bucketTitle: 'Additional Capability',
          rawUserInput: trimmed,
        },
        nodeKey
      );

      const nextEntries: CapabilityBucketEntry[] = [
        ...entries,
        {
          capabilityKey: customKey,
          rawUserInput: trimmed,
          tags: extractedTags,
        },
      ];

      await persistEntries(nextEntries);
      setCustomDraftText('');
      setIsAddingCustom(false);
    } catch (err) {
      console.error('[CUSTOM CAPABILITY SAVE]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save your additional capability.'
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
        capabilities: { entries },
        completed: true,
      });
    } catch (err) {
      console.error('[CAPABILITY INVENTORY COMPLETE]', err);
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
        <span>Loading your capability inventory...</span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STAGE 2: REVIEW & CONFIRM EXTRACTED CAPABILITIES
  // ---------------------------------------------------------------------------
  if (stage === 'review') {
    const orderedEntries = [
      ...CAPABILITY_BUCKETS.map((b) =>
        entries.find((e) => e.capabilityKey === b.key)
      ).filter((e): e is CapabilityBucketEntry => Boolean(e)),
      ...entries.filter(
        (e) => !CAPABILITY_BUCKETS.some((b) => b.key === e.capabilityKey)
      ),
    ];

    return (
      <div className="w-full max-w-3xl space-y-10 pb-16 animate-in fade-in duration-300">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Your Capability Mirror
          </p>

          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Here is what you bring to the table.
          </h1>

          <p className="text-lg leading-8 text-muted-foreground">
            We pulled out the core capabilities and tendencies from your stories.
            Remove anything that feels off, add tags we missed, or edit your original notes.
          </p>
        </div>

        <div className="space-y-6">
          {orderedEntries.map((entry) => {
            const bucketMeta = CAPABILITY_BUCKETS.find(
              (b) => b.key === entry.capabilityKey
            );
            const displayTitle = bucketMeta?.title ?? 'Additional Strength';
            const bucketIndex = CAPABILITY_BUCKETS.findIndex(
              (b) => b.key === entry.capabilityKey
            );

            return (
              <div
                key={entry.capabilityKey}
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

                {/* Extracted & founder-editable tags */}
                <div className="space-y-3 pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Extracted Capabilities
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
                            void handleRemoveTag(entry.capabilityKey, idx)
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
                      value={newTagInputs[entry.capabilityKey] ?? ''}
                      onChange={(e) =>
                        setNewTagInputs((prev) => ({
                          ...prev,
                          [entry.capabilityKey]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleAddTag(entry.capabilityKey);
                        }
                      }}
                      placeholder="Add another capability..."
                      className="h-9 text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleAddTag(entry.capabilityKey)}
                      disabled={!(newTagInputs[entry.capabilityKey] ?? '').trim()}
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

        {/* Optional Custom Capability Area */}
        {isAddingCustom ? (
          <div className="rounded-2xl border border-primary/40 bg-primary/[0.03] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold">
                Add another ability or habit
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
              placeholder="Describe another strength, craft, or habit you rely on..."
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
                    Extract & add
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
            Something else you rely on? Add another story
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
                Confirm & continue
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
      {/* Header */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {node.title || 'What can you already do?'}
        </p>

        {/* Stepper Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {CAPABILITY_BUCKETS.map((bucket, idx) => {
            const isCompletedBucket = entries.some(
              (e) => e.capabilityKey === bucket.key
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

      {/* Active Single Capability Card */}
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Area {activeBucketIndex + 1} of {CAPABILITY_BUCKETS.length} ·{' '}
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
                Capturing strengths...
              </>
            ) : (
              <>
                {activeBucketIndex === CAPABILITY_BUCKETS.length - 1
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