'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  ArrowRight,
  Bell,
  Check,
  Compass,
  Loader2,
  PackageOpen,
  Pencil,
  Plus,
  Sparkles,
  Users,
  Wrench,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveUserTasks } from '@/actions/tasks';
import { generateGapTasks } from '@/actions/responses/mission1';
import { $progress } from '@/lib/stores/progress';
import { $userContext } from '@/lib/stores/user-context';
import type {
  CapabilitiesContext,
  ExperienceContext,
  GapTaskOption,
  GapTaskPillar,
  GapTasksInput,
} from '@/lib/types/ai';

type GapActionPayload = {
  generatedOptions?: GapTaskOption[];
  customOptions?: GapTaskOption[];
  selectedTaskIds?: string[];
  nudges?: Record<string, boolean>;
  tasks?: unknown[];
  completed?: boolean;
};

const MAX_SELECTED_TASKS = 3;

const PILLAR_META: Record<
  GapTaskPillar,
  { label: string; icon: typeof Wrench }
> = {
  network: { label: 'Connections', icon: Users },
  resources: { label: 'Resources', icon: PackageOpen },
  capabilities: { label: 'Capabilities', icon: Wrench },
  experience: { label: 'Experience', icon: Compass },
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

function normalizeResources(value: unknown): GapTasksInput['resources'] {
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

function normalizeNetworks(value: unknown): GapTasksInput['networks'] {
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
): GapTasksInput['capabilities'] {
  if (!isRecord(value)) return [];

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

function normalizeExperience(value: unknown): GapTasksInput['experience'] {
  if (!isRecord(value)) return [];

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

export function GapAction({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);
  const contextState = useStore($userContext);
  const hasGeneratedRef = useRef(false);

  const saved = (progress.payload ?? {}) as GapActionPayload;

  const savedGeneratedOptions = Array.isArray(saved.generatedOptions)
    ? saved.generatedOptions
    : [];
  const savedCustomOptions = Array.isArray(saved.customOptions)
    ? saved.customOptions
    : [];
  const savedSelectedIds = Array.isArray(saved.selectedTaskIds)
    ? saved.selectedTaskIds.filter((id): id is string => typeof id === 'string')
    : [];

  const context = contextState.userContext;
  const profile = contextState.profile;

  const founderName =
    profile?.display_name?.trim() || profile?.username?.trim() || null;

  // Pull AssetReveal synthesis and optional notes
  const revealPayload = (progressState.payloads?.['m1-q2-reveal'] ?? {}) as {
    synthesis?: string;
  };
  const revealSynthesis =
    typeof revealPayload.synthesis === 'string'
      ? revealPayload.synthesis
      : '';

  const additionalAssessment = isRecord(context?.additional_assessment)
    ? context.additional_assessment
    : {};
  const resourceAddition = isRecord(additionalAssessment.resources)
    ? additionalAssessment.resources
    : {};
  const additionalNotes =
    typeof resourceAddition.additional_notes === 'string'
      ? resourceAddition.additional_notes
      : '';

  const [generatedOptions, setGeneratedOptions] = useState<GapTaskOption[]>(
    savedGeneratedOptions
  );
  const [customOptions, setCustomOptions] =
    useState<GapTaskOption[]>(savedCustomOptions);
  const [selectedTaskIds, setSelectedTaskIds] =
    useState<string[]>(savedSelectedIds);
  const [nudges, setNudges] = useState<Record<string, boolean>>(
    isRecord(saved.nudges) ? (saved.nudges as Record<string, boolean>) : {}
  );

  // Custom action form state
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  const [isEditingAfterCompletion, setIsEditingAfterCompletion] =
    useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHydrated = progressState.isHydrated && contextState.isHydrated;
  const completed = saved.completed === true && !isEditingAfterCompletion;

  const generationInput = useMemo<GapTasksInput>(
    () => ({
      userName: founderName ?? undefined,
      resources: normalizeResources(context?.resources),
      networks: normalizeNetworks(context?.network_context),
      capabilities: normalizeCapabilities(context?.capabilities),
      experience: normalizeExperience(context?.experience),
      revealSynthesis: revealSynthesis || undefined,
      additionalNotes: additionalNotes || undefined,
    }),
    [
      founderName,
      context?.resources,
      context?.network_context,
      context?.capabilities,
      context?.experience,
      revealSynthesis,
      additionalNotes,
    ]
  );

  // Sync saved options if progress hydrates after mount
  useEffect(() => {
    if (savedGeneratedOptions.length > 0 && generatedOptions.length === 0) {
      setGeneratedOptions(savedGeneratedOptions);
    }
    if (savedCustomOptions.length > 0 && customOptions.length === 0) {
      setCustomOptions(savedCustomOptions);
    }
    if (savedSelectedIds.length > 0 && selectedTaskIds.length === 0) {
      setSelectedTaskIds(savedSelectedIds);
    }
  }, [savedGeneratedOptions, savedCustomOptions, savedSelectedIds]);

  // Generate 4 tailored tasks once stores are hydrated and no cached options exist
  useEffect(() => {
    if (!isHydrated) return;
    if (savedGeneratedOptions.length > 0 || generatedOptions.length > 0) return;
    if (hasGeneratedRef.current) return;

    hasGeneratedRef.current = true;
    setIsGenerating(true);
    setError(null);

    async function loadSuggestions() {
      try {
        const tasks = await generateGapTasks(generationInput, nodeKey);
        setGeneratedOptions(tasks);
      } catch (err) {
        console.error('[GAP ACTION GENERATE]', err);
        hasGeneratedRef.current = false;
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong preparing your action ideas.'
        );
      } finally {
        setIsGenerating(false);
      }
    }

    void loadSuggestions();
  }, [
    isHydrated,
    savedGeneratedOptions.length,
    generatedOptions.length,
    generationInput,
    nodeKey,
    generationAttempt,
  ]);

  const allOptions = useMemo(
    () => [...generatedOptions, ...customOptions],
    [generatedOptions, customOptions]
  );

  const selectedOptions = useMemo(
    () =>
      selectedTaskIds
        .map((id) => allOptions.find((opt) => opt.id === id))
        .filter((opt): opt is GapTaskOption => Boolean(opt)),
    [selectedTaskIds, allOptions]
  );

  const canContinue =
    selectedTaskIds.length >= 1 &&
    selectedTaskIds.length <= MAX_SELECTED_TASKS;

  function toggleTask(taskId: string) {
    setSelectedTaskIds((current) => {
      if (current.includes(taskId)) {
        return current.filter((id) => id !== taskId);
      }
      if (current.length >= MAX_SELECTED_TASKS) return current;
      return [...current, taskId];
    });
  }

  function toggleNudge(taskId: string) {
    setNudges((current) => ({
      ...current,
      [taskId]: !current[taskId],
    }));
  }

  function handleAddCustomAction() {
    const trimmedTitle = customTitle.trim();
    const trimmedDesc = customDescription.trim();
    if (!trimmedTitle) return;

    const newTask: GapTaskOption = {
      id: `custom_action_${Date.now()}`,
      pillar: 'capabilities',
      assetReference: 'Your own move',
      title: trimmedTitle,
      description:
        trimmedDesc ||
        'A concrete preparatory move you chose from your own inventory.',
      isCustom: true,
    };

    setCustomOptions((prev) => [...prev, newTask]);

    if (selectedTaskIds.length < MAX_SELECTED_TASKS) {
      setSelectedTaskIds((prev) => [...prev, newTask.id]);
    }

    setCustomTitle('');
    setCustomDescription('');
    setIsAddingCustom(false);
  }

  async function handleSave() {
    if (!canContinue || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const tasksToPersist = selectedOptions.map((item) => ({
        title: item.title,
        description: item.description,
        task_type: 'general' as const,
        source_node_key: nodeKey,
        is_nudge_enabled: nudges[item.id] ?? false,
        metadata: {
          gap_action_id: item.id,
          pillar: item.pillar,
          asset_reference: item.assetReference,
          is_custom: Boolean(item.isCustom),
          recurrence: 'once',
          quest: 'm1-q2',
        },
      }));

      const result = await saveUserTasks(tasksToPersist);

      await onComplete({
        generatedOptions,
        customOptions,
        selectedTaskIds,
        nudges,
        tasks: result.tasks,
        completed: true,
      });

      setIsEditingAfterCompletion(false);
    } catch (err) {
      console.error('[GAP ACTION SAVE]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your actions. Please try again.'
      );
      setIsSubmitting(false);
    }
  }

  // 1. Hydration Guard
  if (!isHydrated) {
    return (
      <div className="flex items-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading your asset inventory...</span>
      </div>
    );
  }

  // 2. Generating Tailored Moves State
  if (isGenerating || (generatedOptions.length === 0 && !error)) {
    return (
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            CARRY THIS FORWARD
          </p>

          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title || 'Put what you have to work'}
          </h1>

          <p className="text-lg leading-8 text-muted-foreground">
            Looking at the connections, resources, capabilities, and lived
            experience you mapped out to suggest a few grounded moves for this
            week.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Matching small actions to your starting assets...</span>
        </div>
      </div>
    );
  }

  // 3. Completed / Revisit State
  if (completed) {
    return (
      <div className="w-full max-w-4xl space-y-8 animate-in fade-in duration-300">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            YOUR CHOSEN MOVES
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {founderName
              ? `${founderName}, these moves are in your task list.`
              : 'Your starting moves are in your task list.'}
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Small, real-world steps grounded in what you already have. You can
            check them off in your tasks as you go.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {selectedOptions.map((item) => {
            const meta = PILLAR_META[item.pillar] ?? PILLAR_META.capabilities;
            const Icon = meta.icon;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-card p-5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {meta.label}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {item.assetReference}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <h2 className="font-semibold leading-snug">{item.title}</h2>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsEditingAfterCompletion(true)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
            Edit choices
          </Button>

          <Button
            onClick={() =>
              onComplete({
                generatedOptions,
                customOptions,
                selectedTaskIds,
                nudges,
                completed: true,
              })
            }
            className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
          >
            Continue to Quest 3
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // 4. Active Selection State
  return (
    <div className="w-full max-w-4xl space-y-8 pb-16 animate-in fade-in duration-300">
      <header className="max-w-3xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          CARRY THIS FORWARD
        </p>

        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {founderName
            ? `Put what you have to work, ${founderName}.`
            : node.title || 'Put what you have to work.'}
        </h1>

        <p className="text-lg leading-8 text-muted-foreground">
          An inventory on paper only becomes leverage when you use it. Based on
          your connections, resources, capabilities, and lived experience, we
          put together four low-stakes moves for this week.
        </p>

        <p className="text-base leading-7 text-muted-foreground">
          Choose <strong className="font-medium text-foreground">1 to 3</strong>{' '}
          actions you are genuinely willing to do this week—or add your own.
          They will be saved straight to your task list.
        </p>
      </header>

      {error && generatedOptions.length === 0 && (
        <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null);
              hasGeneratedRef.current = false;
              setGenerationAttempt((a) => a + 1);
            }}
          >
            Try generating again
          </Button>
        </div>
      )}

      {/* Tailored Action Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {allOptions.map((item) => {
          const selected = selectedTaskIds.includes(item.id);
          const nudgeEnabled = nudges[item.id] ?? false;
          const meta = PILLAR_META[item.pillar] ?? PILLAR_META.capabilities;
          const Icon = meta.icon;

          return (
            <article
              key={item.id}
              className={[
                'flex flex-col justify-between overflow-hidden rounded-2xl border transition-all',
                selected
                  ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => toggleTask(item.id)}
                disabled={
                  isSubmitting ||
                  (!selected && selectedTaskIds.length >= MAX_SELECTED_TASKS)
                }
                aria-pressed={selected}
                className="flex flex-1 flex-col items-start p-5 text-left disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      {meta.label}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                      <Sparkles className="h-3 w-3 text-primary" />
                      {item.assetReference}
                    </span>
                  </div>

                  <span
                    className={[
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40 text-transparent',
                    ].join(' ')}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                </div>

                <h2 className="mt-4 font-heading text-lg font-semibold leading-snug text-foreground">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </button>

              {selected && (
                <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Remind me about this
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleNudge(item.id)}
                    disabled={isSubmitting}
                    aria-label={`Toggle reminder for ${item.title}`}
                    aria-pressed={nudgeEnabled}
                    className={[
                      'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                      nudgeEnabled ? 'bg-primary' : 'bg-muted',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform',
                        nudgeEnabled ? 'translate-x-6' : 'translate-x-1',
                      ].join(' ')}
                    />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Optional Custom Action Builder */}
      {isAddingCustom ? (
        <div className="rounded-2xl border border-primary/40 bg-primary/[0.03] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold">
              Add your own preparatory action
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAddingCustom(false);
                setCustomTitle('');
                setCustomDescription('');
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <Input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="What concrete step will you take? (e.g., Message my old lab lead)"
              maxLength={140}
              className="h-11 text-base"
            />

            <SpeechTextarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Optional details: which asset does this use, and what will you ask or test?"
              rows={3}
              className="resize-y text-sm leading-6"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddingCustom(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddCustomAction}
              disabled={!customTitle.trim()}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add action
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingCustom(true)}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-sm font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Have a specific move in mind? Add your own action
        </button>
      )}

      <div className="rounded-xl border border-dashed border-border p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          You don&apos;t have to do everything today. A single small conversation
          or observation in the real world will teach you more than planning on
          paper.
        </p>
      </div>

      {error && generatedOptions.length > 0 && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedTaskIds.length === 0
            ? 'Choose 1–3 actions to add to your task list.'
            : `${selectedTaskIds.length} of ${MAX_SELECTED_TASKS} actions selected.`}
        </p>

        <Button
          onClick={handleSave}
          disabled={!canContinue || isSubmitting}
          className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving to tasks...
            </>
          ) : (
            <>
              Save my actions
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default GapAction;