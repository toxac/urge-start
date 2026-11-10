'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Bell, Check, Loader2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveUserTasks } from '@/actions/tasks';

import { HABITS, getHabitById } from '@/lib/constants/habits';
import type { HabitDefinition } from '@/lib/constants/habits';
import { $progress } from '@/lib/stores/progress';
import { $userContext } from '@/lib/stores/user-context';
import type { SynthesisReflectiveItem } from '@/lib/types/ai';

type RevealSynthesis = {
  headline: string;
  interpretation: string;
  confirmed?: boolean;
};

type RevealPayload = {
  synthesis?: RevealSynthesis;
  completed?: boolean;
};

type PracticeContext = {
  barriers: SynthesisReflectiveItem[];
  motivations: SynthesisReflectiveItem[];
  future: string;
  quitConditions: SynthesisReflectiveItem[];
  reveal: RevealSynthesis;
};

const MAX_SELECTED_HABITS = 3;

function getRecommendedHabits(context: PracticeContext): HabitDefinition[] {
  // Separate primary items from secondary items to weight them more heavily
  const primaryBarrier = context.barriers.find((b) => b.isPrimary);
  const primaryMotivation = context.motivations.find((m) => m.isPrimary);
  const primaryQuit = context.quitConditions.find((q) => q.isPrimary);

  const primaryText = [
    primaryBarrier ? `${primaryBarrier.title} ${primaryBarrier.reflection}` : '',
    primaryMotivation ? `${primaryMotivation.title} ${primaryMotivation.reflection}` : '',
    primaryQuit ? `${primaryQuit.title} ${primaryQuit.reflection}` : '',
  ]
    .join(' ')
    .toLowerCase();

  const supportingText = [
    context.barriers.map((b) => `${b.title} ${b.reflection}`).join(' '),
    context.motivations.map((m) => `${m.title} ${m.reflection}`).join(' '),
    context.future,
    context.quitConditions.map((q) => `${q.title} ${q.reflection}`).join(' '),
    context.reveal.headline,
    context.reveal.interpretation,
  ]
    .join(' ')
    .toLowerCase();

  const scores = new Map<string, number>();

  function addScore(ids: string[], baseWeight: number, regex: RegExp) {
    let multiplier = 0;
    if (regex.test(primaryText)) multiplier += 2; // Primary matches get double weight
    if (regex.test(supportingText)) multiplier += 1;

    if (multiplier > 0) {
      ids.forEach((id) =>
        scores.set(id, (scores.get(id) ?? 0) + baseWeight * multiplier)
      );
    }
  }

  // Suggest habits targeted at specific friction points
  addScore(['fear_to_step', 'ask_for_help', 'self_compassion_pause'], 3, /fear|reject|rejection|ask|embarrass|judg|nervous/);
  addScore(['two_minute_start', 'one_sentence_intention', 'learn_and_apply'], 3, /overthink|perfection|ready|uncertain|certainty|not ready/);
  addScore(['evidence_log', 'self_compassion_pause', 'celebrate_completion'], 3, /confidence|doubt|failure|fail|shame|worth|capable|believ/);
  addScore(['one_sentence_intention', 'comparison_pause', 'celebrate_completion'], 2, /motivat|purpose|meaning|future|freedom|independ|impact|why/);
  addScore(['one_customer_touch', 'ask_for_help'], 3, /customer|people|problem|market|conversation|alone|isolat|help/);
  addScore(['self_compassion_pause', 'evidence_log', 'two_minute_start'], 3, /quit|give up|setback|discourag|lose interest|overwhelm|stuck/);
  addScore(['two_minute_start', 'top_one_shutdown', 'one_sentence_intention'], 2, /distract|procrastinat|follow through|consisten|routine|time|busy/);
  addScore(['learn_and_apply', 'two_minute_start'], 2, /learn|research|plan|read|watch|prepare|analysis/);

  // Baseline fallbacks
  const baselineScores: Record<string, number> = {
    one_sentence_intention: 1,
    fear_to_step: 1,
    two_minute_start: 1,
    evidence_log: 1,
    self_compassion_pause: 1,
  };

  Object.entries(baselineScores).forEach(([id, score]) => {
    scores.set(id, (scores.get(id) ?? 0) + score);
  });

  return [...HABITS]
    .sort((a, b) => {
      const scoreDiff = (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (
        HABITS.findIndex((habit) => habit.id === a.id) -
        HABITS.findIndex((habit) => habit.id === b.id)
      );
    })
    .slice(0, 5);
}

export function CommitmentBuilder({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);
  const contextState = useStore($userContext);

  const saved = (progress.payload ?? {}) as Record<string, any>;
  const revealProgress = progressState.payloads?.['m1-q1-reveal'] ?? {};
  const revealPayload = revealProgress as RevealPayload;

  const reveal =
    revealPayload.synthesis && typeof revealPayload.synthesis === 'object'
      ? revealPayload.synthesis
      : null;

  const context = contextState.userContext;
  const profile = contextState.profile;

  // Retrieve user's preferred name for personal touch
  const founderName =
    profile?.display_name?.trim() || profile?.username?.trim() || null;

  const barriersContext = context?.perceived_barriers as Record<string, any> | undefined;
  const motivationsContext = context?.motivations as Record<string, any> | undefined;
  const futureContext = context?.desired_future as Record<string, any> | undefined;
  const quitConditionsContext = context?.quit_conditions as Record<string, any> | undefined;

  const barriers: SynthesisReflectiveItem[] = Array.isArray(barriersContext?.barriers)
    ? barriersContext.barriers
    : [];

  const motivations: SynthesisReflectiveItem[] = Array.isArray(motivationsContext?.motivations)
    ? motivationsContext.motivations
    : [];

  const future =
    typeof futureContext?.reflection === 'string'
      ? futureContext.reflection
      : '';

  const quitConditions: SynthesisReflectiveItem[] = Array.isArray(quitConditionsContext?.conditions)
    ? quitConditionsContext.conditions
    : [];

  const practiceContext = useMemo(
    () => (reveal ? { barriers, motivations, future, quitConditions, reveal } : null),
    [reveal, barriers, motivations, future, quitConditions]
  );

  const recommendedHabits = useMemo(
    () => (practiceContext ? getRecommendedHabits(practiceContext) : []),
    [practiceContext]
  );

  const savedHabitIds = Array.isArray(saved.habitIds)
    ? saved.habitIds.filter((id): id is string => typeof id === 'string')
    : Array.isArray(saved.practiceIds)
      ? saved.practiceIds.filter((id): id is string => typeof id === 'string')
      : [];

  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>(savedHabitIds);
  const [nudges, setNudges] = useState<Record<string, boolean>>(
    typeof saved.nudges === 'object' && saved.nudges !== null
      ? (saved.nudges as Record<string, boolean>)
      : {}
  );

  const [isEditingAfterCompletion, setIsEditingAfterCompletion] = useState(false);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completed = saved.completed === true && !isEditingAfterCompletion;

  const selectedHabits = selectedHabitIds
    .map((id) => getHabitById(id))
    .filter((habit): habit is HabitDefinition => Boolean(habit));

  const canContinue =
    selectedHabitIds.length >= 1 &&
    selectedHabitIds.length <= MAX_SELECTED_HABITS;

  function toggleHabit(habitId: string) {
    setSelectedHabitIds((current) => {
      if (current.includes(habitId)) {
        return current.filter((id) => id !== habitId);
      }
      if (current.length >= MAX_SELECTED_HABITS) return current;
      return [...current, habitId];
    });
  }

  function toggleNudge(habitId: string) {
    setNudges((current) => ({
      ...current,
      [habitId]: !current[habitId],
    }));
  }

  async function handleSave() {
    if (!canContinue || !reveal || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const tasks = selectedHabits.map((habit) => ({
        title: habit.title,
        description: `${habit.action} When: ${habit.trigger.description}`,
        task_type: 'habit' as const,
        source_node_key: nodeKey,
        is_nudge_enabled: nudges[habit.id] ?? false,
        metadata: {
          habit_id: habit.id,
          category: habit.category,
          purpose: habit.purpose,
          action: habit.action,
          trigger: habit.trigger,
          recurrence: {
            type: habit.recurrence,
            duration_days: habit.durationDays,
          },
          suggested_missions: habit.suggestedMissions,
        },
      }));

      const result = await saveUserTasks(tasks);

      await onComplete({
        reveal,
        habitIds: selectedHabitIds,
        practiceIds: selectedHabitIds,
        nudges,
        tasks: result.tasks,
        completed: true,
      });

      setIsEditingAfterCompletion(false);
    } catch (err) {
      console.error('[COMMITMENT BUILDER]', err);
      setError('Something went wrong while saving your choices. Please try again.');
      setIsSubmitting(false);
    }
  }

  // 1. Guard against layout flash while stores hydrate
  if (!progressState.isHydrated || !contextState.isHydrated) {
    return (
      <div className="flex items-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading your reflection...</span>
      </div>
    );
  }

  // 2. Guard against missing previous reveal
  if (!reveal) {
    return (
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            CARRY THIS FORWARD
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Build small habits
          </h2>
          <p className="text-lg leading-8 text-muted-foreground">
            Before choosing what to practise, we need to look at what you
            discovered in the previous step.
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Go back and complete the reflection first.
          </p>
        </div>
      </div>
    );
  }

  // 3. Completed review state
  if (completed) {
    return (
      <div className="w-full max-w-4xl space-y-8 animate-in fade-in duration-300">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            YOUR COMMITTED HABITS
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {founderName ? `${founderName}, these are your small habits.` : 'Small habits. A different way of moving.'}
          </h2>
          <p className="text-lg leading-8 text-muted-foreground">
            These small actions are yours to practise in everyday life. You can build on them as your journey continues.
          </p>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-6 sm:p-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            THE TENSION YOU ARE BALANCING
          </p>
          <h3 className="font-heading text-xl font-semibold text-foreground">
            {reveal.headline}
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {reveal.interpretation}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {selectedHabits.map((habit) => (
            <div key={habit.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <HabitImage
                habit={habit}
                failed={failedImages.includes(habit.id)}
                onError={() =>
                  setFailedImages((current) =>
                    current.includes(habit.id) ? current : [...current, habit.id]
                  )
                }
              />
              <div className="space-y-3 p-5">
                <div className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <h3 className="font-semibold">{habit.title}</h3>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {habit.action}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  <span className="font-medium text-foreground">When:</span>{' '}
                  {habit.trigger.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsEditingAfterCompletion(true)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
            Edit your habits
          </Button>

          <Button
            onClick={() =>
              onComplete({
                reveal,
                habitIds: selectedHabitIds,
                practiceIds: selectedHabitIds,
                nudges,
                completed: true,
              })
            }
            className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
          >
            Continue to Quest 2 <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // 4. Active selection state
  return (
    <div className="w-full max-w-4xl space-y-8 pb-16 animate-in fade-in duration-300">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          CARRY THIS FORWARD
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {founderName
            ? `Small habits, ${founderName}. A different way of moving.`
            : 'Small habits. A different way of moving.'}
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          You have looked at what drives you, what holds you back, and what
          happens when those things collide. You do not have to change
          everything at once. Choose a few small habits to try in everyday
          life. These are ways to practise moving forward before you feel ready.
        </p>
      </div>

      <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-6 sm:p-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          WHAT WE NOTICED
        </p>
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {reveal.headline}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {reveal.interpretation}
        </p>
      </div>

      <section className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Choose what feels useful</h2>
          <p className="text-base leading-7 text-muted-foreground">
            We have suggested habits based on your biggest barrier and core motivation.
            Choose one to three habits you are genuinely willing to maintain.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {recommendedHabits.map((habit) => {
            const selected = selectedHabitIds.includes(habit.id);
            const nudgeEnabled = nudges[habit.id] ?? false;

            return (
              <article
                key={habit.id}
                className={[
                  'overflow-hidden rounded-2xl border transition-all',
                  selected
                    ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => toggleHabit(habit.id)}
                  disabled={
                    isSubmitting ||
                    (!selected && selectedHabitIds.length >= MAX_SELECTED_HABITS)
                  }
                  aria-pressed={selected}
                  className="block w-full text-left disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <HabitImage
                    habit={habit}
                    failed={failedImages.includes(habit.id)}
                    onError={() =>
                      setFailedImages((current) =>
                        current.includes(habit.id) ? current : [...current, habit.id]
                      )
                    }
                  />

                  <div className="space-y-3 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {habit.category}
                        </p>
                        <h3 className="font-semibold leading-snug">
                          {habit.title}
                        </h3>
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

                    <p className="text-sm leading-6 text-muted-foreground">
                      {habit.description}
                    </p>

                    <div className="rounded-xl bg-muted/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Try this
                      </p>
                      <p className="mt-1 text-sm leading-6">{habit.action}</p>
                    </div>

                    <p className="text-xs leading-5 text-muted-foreground">
                      <span className="font-medium text-foreground">When:</span>{' '}
                      {habit.trigger.description}
                    </p>
                  </div>
                </button>

                {selected && (
                  <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Remind me about this
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleNudge(habit.id)}
                      disabled={isSubmitting}
                      aria-label={`Toggle reminder for ${habit.title}`}
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
      </section>

      <div className="rounded-xl border border-dashed border-border p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          These habits are here to support the work ahead, not replace it.
          You will still need to speak to people, test your ideas, and make
          decisions. The habits help you practise how you approach that work.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedHabitIds.length === 0
            ? 'Choose 1–3 habits.'
            : `${selectedHabitIds.length} of ${MAX_SELECTED_HABITS} habits selected.`}
        </p>

        <Button
          onClick={handleSave}
          disabled={!canContinue || isSubmitting}
          className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save my habits <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function HabitImage({
  habit,
  failed,
  onError,
}: {
  habit: HabitDefinition;
  failed: boolean;
  onError: () => void;
}) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-orange-100 via-amber-50 to-stone-100">
      {!failed && (
        <Image
          src={habit.image}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
          onError={onError}
        />
      )}

      {failed && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-orange-50 to-amber-100"
        >
          <span className="max-w-[75%] text-center text-lg font-semibold tracking-tight text-orange-950/70">
            {habit.title}
          </span>
        </div>
      )}
    </div>
  );
}