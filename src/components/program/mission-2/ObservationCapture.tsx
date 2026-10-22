
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  CalendarPlus,
  CheckCircle2,
  CircleDashed,
  Lightbulb,
  PencilLine,
  Save,
  Trash2,
  X,
} from 'lucide-react';

import { deleteObservation, getObservations } from '@/actions/observations';
import { saveUserTasks } from '@/actions/tasks';
import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import type {
    ProblemObservationFocus,
    UserObservation,
} from '@/lib/types/observations';
import { ProblemObservationForm } from '@/components/program/common/ProblemObservationForm';
import { ObservedProblemExtractionForm } from '@/components/program/common/ObservedProblemExtractionForm';
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
    resourceSlug: string;
    description: string;
};

const PROMPTS: PromptCard[] = [
    {
        id: 'personal',
        title: 'What frustrates you in your everyday life?',
        focus: 'personal',
        resourceSlug: 'noticing-your-own-frustrations',
        description:
            'Pay attention to things that waste your time, take more effort than they should, cost more than expected, or make a simple task unnecessarily difficult. Notice what keeps happening, even if you have come to accept it as normal.',
    },
    {
        id: 'zone-of-influence',
        title: 'What do people around you struggle with?',
        focus: 'zone_of_influence',
        resourceSlug: 'listening-for-complaints',
        description:
            'Listen when friends, family, colleagues, shopkeepers, or people in your community describe a frustrating experience. Look for repeated workarounds, confusing processes, delays, or tasks that take more effort than they should. When appropriate, ask about a recent experience.',
    },
    {
        id: 'market-trends',
        title: "What changes are creating new needs or problems?",
        focus: 'market_trends',
        resourceSlug: 'noticing-change',
        description:
            'Notice changes in technology, habits, prices, rules, expectations, or the way people live and work. Consider who is affected, what has become more difficult, and what people now have to do differently.',
    },
    {
        id: 'lived-experience',
        title: 'What can your own experience help you notice?',
        focus: 'lived_experience',
        resourceSlug: 'noticing-problems-from-your-experience',
        description:
            'Think about the work you have done, skills you have developed, communities you understand, and situations you have experienced firsthand. What have you learned to work around? What do you understand because you have been there yourself?',
    },
];

const FOCUS_LABELS: Record<Focus, string> = {
    personal: 'Your everyday life',
    zone_of_influence: 'People and places you know',
    market_trends: 'What’s changing around you',
    lived_experience: 'What you know and can do',
};

type ObservationReadiness = 'Just noticed' | 'Needs a little more detail' | 'Observation Complete';

function getObservationReadiness(observation: UserObservation): ObservationReadiness {
    const raw = observation.problem_details;
    const details = raw && typeof raw === 'object' && !Array.isArray(raw)
        ? raw as Record<string, unknown>
        : {};

    const detailFields = [
        'who',
        'where',
        'when',
        'workaround',
        'current_option',
        'cost',
        'frequency',
        'why_unsolved',
    ];
    const answeredCount = detailFields.filter((field) =>
        typeof details[field] === 'string' && (details[field] as string).trim().length > 0,
    ).length + (typeof details.can_reach === 'boolean' ? 1 : 0);

    if (answeredCount === 0) return 'Just noticed';
    if (answeredCount === detailFields.length + 1) return 'Observation Complete';
    return 'Needs a little more detail';
}

function getReadinessPresentation(status: ObservationReadiness) {
    switch (status) {
        case 'Observation Complete':
            return { icon: CheckCircle2, className: 'text-emerald-600', label: status };
        case 'Needs a little more detail':
            return { icon: PencilLine, className: 'text-amber-600', label: status };
        default:
            return { icon: CircleDashed, className: 'text-muted-foreground', label: status };
    }
}

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
        return { minimum_count: 5, soft_target: 10 };
    }

    const observation = (metadata as Record<string, unknown>).observation;

    if (
        typeof observation !== 'object' ||
        observation === null ||
        Array.isArray(observation)
    ) {
        return { minimum_count: 5, soft_target: 10 };
    }

    const config = observation as Record<string, unknown>;

    return {
        minimum_count:
            typeof config.minimum_count === 'number'
                ? Math.max(5, config.minimum_count)
                : 5,
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
    const [loading, setLoading] = useState(true);
    const [savingTask, setSavingTask] = useState(false);
    const [deletingObservationId, setDeletingObservationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [activePrompt, setActivePrompt] = useState<PromptCard | null>(null);
    const [editingObservation, setEditingObservation] =
        useState<UserObservation | null>(null);

    const [captureOpen, setCaptureOpen] = useState(false);
    const [taskOpen, setTaskOpen] = useState(false);

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

    const completeObservationCount = useMemo(
        () => observations.filter(
            (observation) => getObservationReadiness(observation) === 'Observation Complete',
        ).length,
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
                description: `Look for an everyday problem in this area and record what you notice. Focus: ${FOCUS_LABELS[taskFocus]}. This task is a reminder to observe; it is not an observation yet.`,
                task_type: 'practice',
                source_node_key: nodeKey,
                is_nudge_enabled: false,
                metadata: {
                    purpose: 'planned_observation',
                    focus: taskFocus,
                    node_key: nodeKey,
                },
            };

            await saveUserTasks([input]);

            setTaskTitle('');
            setTaskOpen(false);

            setNotice(
                'Added to your tasks. When you notice something, come back and record it as an observation.',
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

    const handleDeleteObservation = async (observation: UserObservation) => {
        const confirmed = window.confirm(
            `Delete “${observation.title}”? This cannot be undone.`,
        );
        if (!confirmed) return;

        setDeletingObservationId(observation.id);
        setError(null);
        setNotice(null);

        try {
            await deleteObservation(observation.id);
            setObservations((current) =>
                current.filter((item) => item.id !== observation.id),
            );
            if (editingObservation?.id === observation.id) {
                setCaptureOpen(false);
                setEditingObservation(null);
            }
            setNotice('Observation deleted.');
        } catch (e) {
            setError(
                e instanceof Error ? e.message : 'Could not delete this observation.',
            );
        } finally {
            setDeletingObservationId(null);
        }
    };

    const handleContinue = async () => {
        if (completeObservationCount < minimumCount) {
            setError(
                `Complete at least ${minimumCount} observations before continuing. ` +
                `You have ${completeObservationCount} complete so far. Open any observation marked “Needs a little more detail” and fill in the remaining fields.`,
            );
            return;
        }

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


    return (
        <div className="w-full animate-in fade-in duration-500">
            <div className="mx-auto w-full max-w-4xl space-y-8 pb-8">
                <header className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#FF502F]">
                        MISSION 2 · NOTICE WHAT COULD BE BETTER
                    </p>

                    <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        What are you noticing?
                    </h1>

                    <p className="max-w-3xl text-lg leading-7 text-muted-foreground">
                        Come back whenever you see, hear, or experience something frustrating, slow, expensive, or broken. A sentence is enough. You can add detail later.
                    </p>

                    <p className="text-sm text-muted-foreground">
                        Noticing works better over time. Give yourself a week or two—or longer if you need it—and come back whenever you notice something worth recording.
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

                {/* Four observation sources */}
                <section className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">
                            Four ways to notice
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Choose the perspective that feels useful. Record something now, or add it to your tasks so you remember to look for it over the coming days or weeks.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {PROMPTS.map((prompt) => (
                            <article
                                key={prompt.id}
                                className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
                            >
                                <div className="space-y-2">
                                    <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                        {FOCUS_LABELS[prompt.focus]}
                                    </span>
                                    <h3 className="font-semibold leading-6">{prompt.title}</h3>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        {prompt.description}
                                    </p>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                                        onClick={() => openResource(prompt.resourceSlug)}
                                    >
                                        <BookOpen className="size-3.5" />
                                        Read the guide
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 border-t border-border pt-3">
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="flex-1 gap-1.5 bg-[#FF502F] text-white hover:bg-[#E94729]"
                                        onClick={() => startCapture(prompt)}
                                    >
                                        Record an observation
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        aria-label={`Add task: ${prompt.title}`}
                                        title="Add to tasks"
                                        onClick={() => {
                                            setTaskFocus(prompt.focus);
                                            setTaskTitle(prompt.title);
                                            setTaskOpen(true);
                                            setError(null);
                                            setNotice(null);
                                        }}
                                    >
                                        <CalendarPlus className="size-4" />
                                    </Button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Observations */}
                <section className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">
                                What you’ve noticed
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {observations.length} saved · {completeObservationCount} complete · {minimumCount} complete observations needed to continue
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="rounded-xl border border-border p-5 text-sm text-muted-foreground">
                            Loading your observations…
                        </div>
                    ) : sortedObservations.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                            <Lightbulb className="mx-auto size-7 text-[#FF502F]" />
                            <p className="mt-3 font-medium">
                                What you’ve noticed will collect here.
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Choose one of the four prompts above and record something you notice. It does not need to be a business idea, and you can add details later.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sortedObservations.map((observation) => (
                                <div
                                    key={observation.id}
                                    className="flex items-stretch gap-2 rounded-xl border border-border bg-card p-2 transition hover:border-[#FF502F]/50"
                                >
                                    <button
                                        type="button"
                                        onClick={() => startCapture(undefined, observation)}
                                        className="flex min-w-0 flex-1 items-start justify-between gap-4 rounded-lg p-2 text-left hover:bg-muted/20"
                                    >
                                        <span className="min-w-0 flex-1 space-y-2">
                                            <span className="block font-medium">{observation.title}</span>
                                            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                                    {FOCUS_LABELS[normalizeFocus(observation.focus)]}
                                                </span>
                                                {(() => {
                                                    const status = getObservationReadiness(observation);
                                                    const presentation = getReadinessPresentation(status);
                                                    const StatusIcon = presentation.icon;
                                                    return (
                                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${presentation.className}`}>
                                                            <StatusIcon className="size-3.5" />
                                                            {presentation.label}
                                                        </span>
                                                    );
                                                })()}
                                            </span>
                                        </span>
                                        <span className="shrink-0 pt-1 text-xs text-muted-foreground">
                                            {observation.updated_at || observation.created_at
                                                ? new Date(observation.updated_at ?? observation.created_at ?? '').toLocaleDateString()
                                                : ''}
                                        </span>
                                    </button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => startCapture(undefined, observation)}
                                        className="mt-1 shrink-0 gap-1.5"
                                    >
                                        <PencilLine className="size-3.5" />
                                        Edit
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        aria-label={`Delete observation: ${observation.title}`}
                                        title="Delete observation"
                                        disabled={deletingObservationId !== null}
                                        onClick={() => void handleDeleteObservation(observation)}
                                        className="mt-1 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        {deletingObservationId === observation.id ? (
                                            <span className="text-xs">…</span>
                                        ) : (
                                            <Trash2 className="size-4" />
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {completeObservationCount >= softTarget && (
                        <p className="text-sm text-muted-foreground">
                            You have a good collection to work with. You can
                            keep adding observations after moving on.
                        </p>
                    )}
                </section>

                {/* Completion */}
                <footer className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        {completeObservationCount < minimumCount
                            ? `Complete ${minimumCount - completeObservationCount} more observation${minimumCount - completeObservationCount === 1 ? '' : 's'} to continue. An observation is complete when all its problem details are filled in.`
                            : completeObservationCount < softTarget
                                ? `${completeObservationCount} complete observations so far. Around ${softTarget} gives you more to compare, but you can continue now.`
                                : 'You have a useful collection to compare. You can keep adding observations after you move on.'}
                    </p>

                    <Button
                        type="button"
                        onClick={handleContinue}
                        disabled={loading || completeObservationCount < minimumCount}
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

                        {editingObservation ? (
                            <ProblemObservationForm
                                focus={focus}
                                observation={editingObservation}
                                sourceNodeKey={nodeKey}
                                onCancel={() => setCaptureOpen(false)}
                                onSaved={(savedObservation) => {
                                    setCaptureOpen(false);
                                    setNotice('Observation updated.');
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
                        ) : (
                            <ObservedProblemExtractionForm
                                focus={focus}
                                sourceNodeKey={nodeKey}
                                onCancel={() => setCaptureOpen(false)}
                                onSaved={(savedObservation, extractionFailed) => {
                                    setCaptureOpen(false);
                                    setNotice(
                                        extractionFailed
                                            ? 'Observation saved. You can add structured details later.'
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
                        )}
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
                                    ADD TO YOUR TASKS
                                </p>
                                <h2
                                    id="task-dialog-title"
                                    className="mt-1 text-xl font-semibold"
                                >
                                    Come back to this later
                                </h2>
                                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                                    Add this to your tasks so you remember to look for it in everyday life. You might do this over the next week or two, or take longer if you need to.
                                </p>
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
                                    What do you want to look for?
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
                                This adds a task to your list; it does not record an observation or send a notification. When you notice something, come back here and record it.
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
                                    {savingTask ? 'Adding…' : 'Add to my tasks'}
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

        </div>
    );
}
