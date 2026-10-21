
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Lightbulb,
  Plus,
  Save,
  Sparkles,
  X,
} from 'lucide-react';

import { getObservations } from '@/actions/observations';
import { saveUserTasks } from '@/actions/tasks';
import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import type {
    ProblemObservationFocus,
    UserObservation,
} from '@/lib/types/observations';
import { ProblemObservationForm } from '@/components/program/common/ProblemObservationForm';
import type { CreateUserTaskInput } from '@/lib/types/tasks';
import { getNextNodeKey } from '@/lib/program/navigation';
import { programStateActions } from '@/lib/stores/program-state';

type Focus = ProblemObservationFocus;

function normalizeFocus(value: string | null | undefined): Focus {
    switch (value) {
        case 'people':
            return 'zone_of_influence';
        case 'changes':
        case 'markets':
            return 'market_trends';
        case 'personal':
        case 'zone_of_influence':
        case 'market_trends':
        case 'lived_experience':
            return value;
        default:
            return 'personal';
    }
}

type PromptCard = {
    id: string;
    title: string;
    focus: Focus;
    kind: 'notice' | 'ask';
    resourceSlug: string;
    description: string;
};

type LocalTask = {
    id: string;
    title: string;
    focus: Focus;
};

const PROMPTS: PromptCard[] = [
    {
        id: 'personal-frustration',
        title: 'What frustrated you today?',
        focus: 'personal',
        kind: 'notice',
        resourceSlug: 'noticing-your-own-frustrations',
        description:
            'Notice repeated friction, wasted time, unnecessary effort, or things that cost more than they should.',
    },
    {
        id: 'people-complaints',
        title: 'What did someone around you complain about?',
        focus: 'zone_of_influence',
        kind: 'notice',
        resourceSlug: 'listening-for-complaints',
        description:
            'Listen for things people bring up repeatedly, especially when they have already tried to fix them.',
    },
    {
        id: 'people-struggle',
        title: 'What did you see someone struggle with?',
        focus: 'zone_of_influence',
        kind: 'notice',
        resourceSlug: 'spotting-everyday-struggles',
        description:
            'Watch where people pause, repeat steps, ask for help, or invent workarounds.',
    },
    {
        id: 'changes',
        title: "What's changing that might create new problems?",
        focus: 'market_trends',
        kind: 'notice',
        resourceSlug: 'noticing-change',
        description:
            'Look for new habits, technologies, rules, or expectations that make old ways harder.',
    },
    {
        id: 'markets',
        title: 'What problems are showing up in a place you’re curious about?',
        focus: 'market_trends',
        kind: 'notice',
        resourceSlug: 'noticing-problems-in-markets',
        description:
            'Choose a field or community you are curious about and pay attention to what repeatedly gets in the way.',
    },
    {
        id: 'ask-annoyance',
        title: "Ask someone: what's annoyed you this week?",
        focus: 'zone_of_influence',
        kind: 'ask',
        resourceSlug: 'asking-about-frustrations',
        description:
            'Ask someone about a recent frustration. Listen to the story before suggesting a solution.',
    },
    {
        id: 'ask-easier',
        title: 'Ask someone: what do you wish was easier?',
        focus: 'zone_of_influence',
        kind: 'ask',
        resourceSlug: 'asking-what-could-be-easier',
        description:
            'Invite someone to describe a task they wish took less time, effort, money, or coordination.',
    },
];

const FOCUS_LABELS: Record<Focus, string> = {
    personal: 'Your everyday life',
    zone_of_influence: 'People and places you know',
    market_trends: 'What’s changing around you',
    lived_experience: 'What you know and can do',
};

const labelClass = 'mb-1.5 block text-sm font-medium text-foreground';

const inputClass =
    'w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-[#FF502F] focus:ring-2 focus:ring-[#FF502F]/15';

function getObservationConfig(metadata: unknown): {
    minimum_count: number;
    soft_target: number;
} {
    if (
        typeof metadata !== 'object' ||
        metadata === null ||
        Array.isArray(metadata)
    ) {
        return { minimum_count: 3, soft_target: 10 };
    }

    const observation = (metadata as Record<string, unknown>).observation;

    if (
        typeof observation !== 'object' ||
        observation === null ||
        Array.isArray(observation)
    ) {
        return { minimum_count: 3, soft_target: 10 };
    }

    const config = observation as Record<string, unknown>;

    return {
        minimum_count:
            typeof config.minimum_count === 'number' ? config.minimum_count : 3,
        soft_target:
            typeof config.soft_target === 'number' ? config.soft_target : 10,
    };
}


export function ObservationCapture({
    node,
    nodeKey,
    progress,
    onComplete,
}: NodeComponentProps) {
    const [observations, setObservations] = useState<UserObservation[]>([]);
    const [localTasks, setLocalTasks] = useState<LocalTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingTask, setSavingTask] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [activePrompt, setActivePrompt] = useState<PromptCard | null>(null);
    const [editingObservation, setEditingObservation] =
        useState<UserObservation | null>(null);

    const [captureOpen, setCaptureOpen] = useState(false);
    const [taskOpen, setTaskOpen] = useState(false);
    const [hintsOpen, setHintsOpen] = useState(false);
    const [showAllPrompts, setShowAllPrompts] = useState(false);

    const [focus, setFocus] = useState<Focus>('personal');

    const [taskTitle, setTaskTitle] = useState('');
    const [taskFocus, setTaskFocus] = useState<Focus>('personal');

    const isCompleted = progress.completed === true;

    const observationConfig = getObservationConfig(node.metadata);

    const minimumCount = observationConfig.minimum_count;
    const softTarget = observationConfig.soft_target;

    const refreshObservations = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const rows = await getObservations();

            setObservations(
                rows.filter(
                    (row) =>
                        row.type === 'observation' &&
                        row.domain === 'problem',
                ),
            );
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : 'Could not load observations.',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshObservations();
    }, [refreshObservations]);

    const sortedObservations = useMemo(
        () =>
            [...observations].sort((a, b) => {
                const aTime = a.updated_at ?? a.created_at ?? '';
                const bTime = b.updated_at ?? b.created_at ?? '';

                return bTime.localeCompare(aTime);
            }),
        [observations],
    );

    const startCapture = (
        prompt?: PromptCard,
        observation?: UserObservation,
    ) => {
        setError(null);
        setNotice(null);
        setActivePrompt(prompt ?? null);
        setEditingObservation(observation ?? null);
        setFocus(
            observation
                ? normalizeFocus(observation.focus)
                : prompt?.focus ?? 'personal',
        );
        setCaptureOpen(true);
    };

    const handleSaveTask = async () => {
        if (!taskTitle.trim()) {
            setError(
                'Give the task a short title so you remember what to look for.',
            );
            return;
        }

        setSavingTask(true);
        setError(null);

        try {
            const input: CreateUserTaskInput = {
                title: taskTitle.trim(),
                description: `Notice and record a problem. Focus: ${FOCUS_LABELS[taskFocus]}.`,
                task_type: 'practice',
                source_node_key: nodeKey,
                is_nudge_enabled: false,
                metadata: {
                    purpose: 'planned_observation',
                    focus: taskFocus,
                    node_key: nodeKey,
                },
            };

            const result = await saveUserTasks([input]);
            const created = result.tasks?.[0];

            setLocalTasks((current) => [
                {
                    id: created?.id ?? `${Date.now()}`,
                    title: taskTitle.trim(),
                    focus: taskFocus,
                },
                ...current,
            ]);

            setTaskTitle('');
            setTaskOpen(false);

            setNotice(
                'Added to your plan. When you notice something, record it as an observation.',
            );
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : 'Could not save this task.',
            );
        } finally {
            setSavingTask(false);
        }
    };

    const handleContinue = async () => {
        if (isCompleted) {
            const nextNodeKey = getNextNodeKey(nodeKey);

            if (nextNodeKey) {
                programStateActions.setCurrentNode(nextNodeKey);
            }

            return;
        }

        await onComplete({
            observation_count: observations.length,
        });
    };

    const openResource = (slug: string) => {
        // Resource route will be implemented separately.
        window.open(
            `/resources/${slug}`,
            '_blank',
            'noopener,noreferrer',
        );
    };

    const shownPrompts = showAllPrompts
        ? PROMPTS
        : PROMPTS.slice(0, 4);

    return (
        <div className="w-full animate-in fade-in duration-500">
            <div className="mx-auto w-full max-w-4xl space-y-8 pb-8">
                <header className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#FF502F]">
                        MISSION 2 · NOTICE PROBLEMS
                    </p>

                    <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        What are you noticing?
                    </h1>

                    <p className="max-w-3xl text-lg leading-7 text-muted-foreground">
                        Come back whenever you see, hear, or live through
                        something annoying, slow, expensive, or broken. A
                        sentence is enough. You can add detail later.
                    </p>

                    <p className="text-sm text-muted-foreground">
                        Noticing works better over several days than in one
                        sitting. Most people take about a week.
                    </p>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                    >
                        {error}
                    </div>
                )}

                {notice && (
                    <div
                        role="status"
                        className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground"
                    >
                        <Check className="mt-0.5 size-4 shrink-0 text-[#FF502F]" />
                        {notice}
                    </div>
                )}

                {/* Prompt cards */}
                <section className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">
                                Try one of these prompts
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Choose a lens. Capture something now or plan to
                                look for it later.
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setHintsOpen(true)}
                            className="gap-2"
                        >
                            <Sparkles className="size-4" />
                            Get hints
                        </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {shownPrompts.map((prompt) => (
                            <article
                                key={prompt.id}
                                className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
                            >
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                            {FOCUS_LABELS[prompt.focus]}
                                        </span>

                                        {prompt.kind === 'ask' && (
                                            <span className="rounded-full bg-[#FF502F]/10 px-2.5 py-1 text-xs font-medium text-[#FF502F]">
                                                Real-world ask
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-semibold leading-6">
                                        {prompt.title}
                                    </h3>

                                    <p className="text-sm leading-6 text-muted-foreground">
                                        {prompt.description}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5"
                                        onClick={() =>
                                            openResource(prompt.resourceSlug)
                                        }
                                    >
                                        <BookOpen className="size-4" />
                                        How to
                                    </Button>

                                    <Button
                                        type="button"
                                        size="sm"
                                        className="gap-1.5 bg-[#FF502F] text-white hover:bg-[#E94729]"
                                        onClick={() => startCapture(prompt)}
                                    >
                                        <Plus className="size-4" />
                                        Add observation
                                    </Button>

                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setTaskFocus(prompt.focus);
                                            setTaskTitle(prompt.title);
                                            setTaskOpen(true);
                                            setError(null);
                                        }}
                                    >
                                        Plan to notice
                                    </Button>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="flex justify-center">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                                setShowAllPrompts((value) => !value)
                            }
                            className="gap-2 text-muted-foreground"
                        >
                            {showAllPrompts
                                ? 'Show fewer prompts'
                                : 'Show all seven prompts'}
                            <ChevronDown
                                className={`size-4 transition-transform ${showAllPrompts ? 'rotate-180' : ''
                                    }`}
                            />
                        </Button>
                    </div>
                </section>

                {/* Planned tasks */}
                <section className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">
                                Things I plan to notice
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Save an intention if you can’t investigate it
                                right now. Come back and record what you notice.
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                                setTaskTitle('');
                                setTaskFocus('personal');
                                setTaskOpen(true);
                                setError(null);
                            }}
                        >
                            <Plus className="size-4" />
                            Add a plan
                        </Button>
                    </div>

                    {localTasks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                            Nothing planned yet. Save something to look for
                            and return to it later.
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {localTasks.map((task) => (
                                <li
                                    key={task.id}
                                    className="flex items-start gap-3 rounded-xl border border-border px-3.5 py-3"
                                >
                                    <CircleHelp className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">
                                            {task.title}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {FOCUS_LABELS[task.focus]}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Observations */}
                <section className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">
                                Your observations
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {observations.length} saved · {minimumCount} to
                                continue · around {softTarget} gives you more to
                                compare
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => startCapture()}
                            className="gap-2"
                        >
                            <Plus className="size-4" />
                            Quick capture
                        </Button>
                    </div>

                    {loading ? (
                        <div className="rounded-xl border border-border p-5 text-sm text-muted-foreground">
                            Loading your observations…
                        </div>
                    ) : sortedObservations.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                            <Lightbulb className="mx-auto size-7 text-[#FF502F]" />
                            <p className="mt-3 font-medium">
                                Your observations will collect here.
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Start with one small thing you noticed. It
                                doesn’t need to be a business idea.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sortedObservations.map((observation) => (
                                <button
                                    type="button"
                                    key={observation.id}
                                    onClick={() =>
                                        startCapture(undefined, observation)
                                    }
                                    className="flex w-full items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 text-left transition hover:border-[#FF502F]/50 hover:bg-muted/20"
                                >
                                    <span className="min-w-0 space-y-1">
                                        <span className="block font-medium">
                                            {observation.title}
                                        </span>

                                        <span className="block line-clamp-2 text-sm leading-6 text-muted-foreground">
                                            {observation.content}
                                        </span>

                                        <span className="mt-1 inline-flex rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                            {FOCUS_LABELS[normalizeFocus(observation.focus)]}
                                        </span>
                                    </span>

                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {observation.updated_at
                                            ? new Date(
                                                observation.updated_at,
                                            ).toLocaleDateString()
                                            : ''}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {observations.length >= softTarget && (
                        <p className="text-sm text-muted-foreground">
                            You have a good collection to work with. You can
                            keep adding observations after moving on.
                        </p>
                    )}
                </section>

                {/* Completion */}
                <footer className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        {observations.length < minimumCount
                            ? `Add ${minimumCount - observations.length
                            } more observation${minimumCount - observations.length === 1
                                ? ''
                                : 's'
                            } before continuing.`
                            : 'You have enough to move forward. You can keep noticing after you continue.'}
                    </p>

                    <Button
                        type="button"
                        onClick={handleContinue}
                        disabled={
                            loading ||
                            (!isCompleted &&
                                observations.length < minimumCount)
                        }
                        className="gap-2 bg-[#FF502F] text-white hover:bg-[#E94729]"
                    >
                        {isCompleted ? 'Continue' : 'Complete this step'}
                        <ArrowRight className="size-4" />
                    </Button>
                </footer>
            </div>

            {/* Observation capture dialog */}
            {captureOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setCaptureOpen(false);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="observation-dialog-title"
                        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-background p-5 shadow-xl sm:rounded-2xl sm:p-6"
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#FF502F]">
                                    {editingObservation ? 'EDIT OBSERVATION' : 'QUICK CAPTURE'}
                                </p>
                                <h2 id="observation-dialog-title" className="mt-1 text-xl font-semibold">
                                    {editingObservation ? 'Add details to your observation' : 'What did you notice?'}
                                </h2>
                                {activePrompt && (
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {activePrompt.title}
                                    </p>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Close"
                                onClick={() => setCaptureOpen(false)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>

                        <ProblemObservationForm
                            focus={focus}
                            observation={editingObservation}
                            sourceNodeKey={nodeKey}
                            onCancel={() => setCaptureOpen(false)}
                            onSaved={(savedObservation) => {
                                setCaptureOpen(false);
                                setNotice(
                                    editingObservation
                                        ? 'Observation updated.'
                                        : 'Observation saved.',
                                );
                                setEditingObservation(null);
                                setActivePrompt(null);
                                setObservations((current) => {
                                    const withoutSaved = current.filter(
                                        (item) => item.id !== savedObservation.id,
                                    );
                                    return [savedObservation, ...withoutSaved];
                                });
                                void refreshObservations();
                            }}
                        />
                    </section>
                </div>
            )}

            {/* Planned task dialog */}
            {taskOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setTaskOpen(false);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="task-dialog-title"
                        className="w-full max-w-lg rounded-t-2xl border border-border bg-background p-5 shadow-xl sm:rounded-2xl sm:p-6"
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#FF502F]">
                                    PLAN FOR LATER
                                </p>
                                <h2
                                    id="task-dialog-title"
                                    className="mt-1 text-xl font-semibold"
                                >
                                    What do you want to notice?
                                </h2>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Close"
                                onClick={() => setTaskOpen(false)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label
                                    className={labelClass}
                                    htmlFor="planned-task-title"
                                >
                                    What will you look for?
                                </label>
                                <input
                                    id="planned-task-title"
                                    className={inputClass}
                                    maxLength={180}
                                    value={taskTitle}
                                    onChange={(event) =>
                                        setTaskTitle(event.target.value)
                                    }
                                    placeholder="e.g. Notice how small shops handle deliveries"
                                />
                            </div>

                            <div>
                                <label
                                    className={labelClass}
                                    htmlFor="planned-task-focus"
                                >
                                    Focus
                                </label>
                                <select
                                    id="planned-task-focus"
                                    className={inputClass}
                                    value={taskFocus}
                                    onChange={(event) =>
                                        setTaskFocus(event.target.value as Focus)
                                    }
                                >
                                    {Object.entries(FOCUS_LABELS).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            <p className="text-sm leading-6 text-muted-foreground">
                                This saves a task, not an observation. When you
                                find something, come back and record what happened.
                            </p>

                            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setTaskOpen(false)}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="button"
                                    disabled={savingTask}
                                    onClick={handleSaveTask}
                                    className="gap-2 bg-[#FF502F] text-white hover:bg-[#E94729]"
                                >
                                    <Save className="size-4" />
                                    {savingTask ? 'Saving…' : 'Save plan'}
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* First-pass hints dialog: static suggestions, no AI or persistence yet */}
            {hintsOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setHintsOpen(false);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="hints-dialog-title"
                        className="w-full max-w-xl rounded-t-2xl border border-border bg-background p-5 shadow-xl sm:rounded-2xl sm:p-6"
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#FF502F]">
                                    A LITTLE DIRECTION
                                </p>
                                <h2
                                    id="hints-dialog-title"
                                    className="mt-1 text-xl font-semibold"
                                >
                                    Places you could look
                                </h2>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Close"
                                onClick={() => setHintsOpen(false)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>

                        <p className="text-sm leading-6 text-muted-foreground">
                            These are starting points, not conclusions. Personalised
                            hints and saved hint history will be connected in a later pass.
                        </p>

                        <div className="mt-4 space-y-3">
                            {[
                                {
                                    title: 'A routine you repeat',
                                    body: 'Choose one ordinary task you do every week. Notice where you wait, repeat a step, or depend on someone else.',
                                },
                                {
                                    title: 'A person doing work you know',
                                    body: 'Watch or ask someone about a task they handle regularly. What takes more effort than it should?',
                                },
                                {
                                    title: 'A place you visit often',
                                    body: 'Pay attention to a shop, office, service, or community space. What do people have to work around?',
                                },
                            ].map((hint) => (
                                <article
                                    key={hint.title}
                                    className="rounded-xl border border-border p-4"
                                >
                                    <h3 className="font-medium">{hint.title}</h3>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        {hint.body}
                                    </p>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={() => {
                                            setTaskTitle(hint.title);
                                            setTaskFocus('personal');
                                            setHintsOpen(false);
                                            setTaskOpen(true);
                                        }}
                                    >
                                        Plan to try this
                                    </Button>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
