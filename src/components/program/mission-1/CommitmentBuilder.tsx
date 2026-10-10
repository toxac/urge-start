
'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Bell, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveUserTasks } from '@/actions/tasks';

import { HABITS, getHabitById } from '@/lib/constants/habits';
import type { HabitDefinition } from '@/lib/constants/habits';
import { $progress } from '@/lib/stores/progress';
import { $userContext } from '@/lib/stores/user-context';

type Barrier = {
  id: string;
  title: string;
  reflection: string;
};

type Motivation = {
  id: string;
  title: string;
  reflection: string;
};

type QuitCondition = {
  id: string;
  title: string;
  reflection: string;
};

type RevealSynthesis = {
  headline: string;
  interpretation: string;
  confirmed: boolean;
};

type RevealPayload = {
  synthesis?: RevealSynthesis;
  completed?: boolean;
};

type PracticeContext = {
  barriers: Barrier[];
  motivations: Motivation[];
  future: string;
  quitConditions: QuitCondition[];
  reveal: RevealSynthesis;
};

const MAX_SELECTED_HABITS = 3;

function getRecommendedHabits(context: PracticeContext): HabitDefinition[] {
  const barrierText = context.barriers
    .map((item) => `${item.id} ${item.title} ${item.reflection}`)
    .join(' ')
    .toLowerCase();

  const motivationText = context.motivations
    .map((item) => `${item.id} ${item.title} ${item.reflection}`)
    .join(' ')
    .toLowerCase();

  const quitText = context.quitConditions
    .map((item) => `${item.id} ${item.title} ${item.reflection}`)
    .join(' ')
    .toLowerCase();

  const allText = [
    barrierText,
    motivationText,
    context.future,
    quitText,
    context.reveal.headline,
    context.reveal.interpretation,
  ]
    .join(' ')
    .toLowerCase();

  const scores = new Map<string, number>();

  function addScore(ids: string[], score: number) {
    ids.forEach((id) => scores.set(id, (scores.get(id) ?? 0) + score));
  }

  // Use structured reflections to suggest habits.
  // These rules suggest options; the founder makes the choice.
  if (/fear|reject|rejection|ask|embarrass|judg|nervous/.test(allText)) {
    addScore(['fear_to_step', 'ask_for_help', 'self_compassion_pause'], 3);
  }

  if (/overthink|perfection|ready|uncertain|certainty|not ready/.test(allText)) {
    addScore(['two_minute_start', 'one_sentence_intention', 'learn_and_apply'], 3);
  }

  if (/confidence|doubt|failure|fail|shame|worth|capable|believ/.test(allText)) {
    addScore(['evidence_log', 'self_compassion_pause', 'celebrate_completion'], 3);
  }

  if (/motivat|purpose|meaning|future|freedom|independ|impact|why/.test(motivationText + ' ' + context.future.toLowerCase())) {
    addScore(['one_sentence_intention', 'comparison_pause', 'celebrate_completion'], 2);
  }

  if (/customer|people|problem|market|conversation|alone|isolat|help/.test(allText)) {
    addScore(['one_customer_touch', 'ask_for_help'], 3);
  }

  if (/quit|give up|setback|discourag|lose interest|overwhelm|stuck/.test(quitText + ' ' + barrierText)) {
    addScore(['self_compassion_pause', 'evidence_log', 'two_minute_start'], 3);
  }

  if (/distract|procrastinat|follow through|consisten|routine|time|busy/.test(allText)) {
    addScore(['two_minute_start', 'top_one_shutdown', 'one_sentence_intention'], 2);
  }

  if (/learn|research|plan|read|watch|prepare|analysis/.test(allText)) {
    addScore(['learn_and_apply', 'two_minute_start'], 2);
  }

  // Always include a small set of broadly useful habits, but let the
  // user's reflections influence which habits appear first.
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
      const scoreDifference =
        (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);

      if (scoreDifference !== 0) return scoreDifference;

      return HABITS.findIndex((habit) => habit.id === a.id) -
        HABITS.findIndex((habit) => habit.id === b.id);
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

  const saved = progress.payload ?? {};
  const revealProgress = progressState.payloads?.['m1-q1-reveal'] ?? {};
  const revealPayload = revealProgress as RevealPayload;

  const reveal =
    revealPayload.synthesis &&
    typeof revealPayload.synthesis === 'object'
      ? revealPayload.synthesis
      : null;

  const context = contextState.userContext;

  const barriersContext = context?.perceived_barriers as
    | { barriers: Barrier[] }
    | null
    | undefined;

  const motivationsContext = context?.motivations as
    | { motivations: Motivation[] }
    | null
    | undefined;

  const futureContext = context?.desired_future as
    | { reflection: string }
    | null
    | undefined;

  const quitConditionsContext = context?.quit_conditions as
    | { conditions: QuitCondition[] }
    | null
    | undefined;

  const barriers = Array.isArray(barriersContext?.barriers)
    ? barriersContext.barriers
    : [];

  const motivations = Array.isArray(motivationsContext?.motivations)
    ? motivationsContext.motivations
    : [];

  const future =
    typeof futureContext?.reflection === 'string'
      ? futureContext.reflection
      : '';

  const quitConditions = Array.isArray(quitConditionsContext?.conditions)
    ? quitConditionsContext.conditions
    : [];

  const practiceContext = reveal
    ? { barriers, motivations, future, quitConditions, reveal }
    : null;

  const recommendedHabits = useMemo(
    () => (practiceContext ? getRecommendedHabits(practiceContext) : []),
    [reveal, barriers, motivations, future, quitConditions],
  );

  const savedHabitIds = Array.isArray(saved.habitIds)
    ? saved.habitIds.filter((id): id is string => typeof id === 'string')
    : Array.isArray(saved.practiceIds)
      ? saved.practiceIds.filter((id): id is string => typeof id === 'string')
      : [];

  const [selectedHabitIds, setSelectedHabitIds] =
    useState<string[]>(savedHabitIds);

  const [nudges, setNudges] = useState<Record<string, boolean>>(
    typeof saved.nudges === 'object' && saved.nudges !== null
      ? (saved.nudges as Record<string, boolean>)
      : {},
  );

  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completed = saved.completed === true;

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
    } catch (err) {
      console.error('[COMMITMENT BUILDER]', err);
      setError('Something went wrong while saving your choices. Please try again.');
      setIsSubmitting(false);
    }
  }

  if (!reveal) {
    return (
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            CARRY THIS FORWARD
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">
            {node.title || 'Build small habits'}
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

  if (completed) {
    return (
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            YOUR HABITS
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Small habits. A different way of moving.
          </h2>
          <p className="text-lg leading-8 text-muted-foreground">
            These small actions are yours to practise in everyday life.
            You can build on them as your journey continues.
          </p>
        </div>

        <div className="rounded-2xl border bg-muted/20 p-6 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
            WHAT WE NOTICED
          </p>
          <h3 className="mt-3 text-2xl font-semibold leading-9">
            {reveal.headline}
          </h3>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            {reveal.interpretation}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {selectedHabits.map((habit) => (
            <div key={habit.id} className="overflow-hidden rounded-2xl border">
              <HabitImage
                habit={habit}
                failed={failedImages.includes(habit.id)}
                onError={() =>
                  setFailedImages((current) =>
                    current.includes(habit.id) ? current : [...current, habit.id],
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
          className="gap-2"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-8 pb-16">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
          CARRY THIS FORWARD
        </p>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Small habits. A different way of moving.
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          You have looked at what drives you, what holds you back, and what
          happens when those things collide. You do not have to change
          everything at once. Choose a few small habits to try in everyday
          life. These are not business tasks or another checklist. They are
          ways to practise moving forward, one small step at a time.
        </p>
      </div>

      <div className="rounded-2xl border bg-muted/20 p-6 sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
          WHAT WE NOTICED
        </p>
        <h3 className="mt-3 text-2xl font-semibold leading-9">
          {reveal.headline}
        </h3>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          {reveal.interpretation}
        </p>
      </div>

      <section className="space-y-5">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Choose what feels useful</h3>
          <p className="text-base leading-7 text-muted-foreground">
            We have suggested a few habits based on what you shared. Choose
            one to three that you are willing to try. You can start small.
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
                  'overflow-hidden rounded-2xl border transition-colors',
                  selected ? 'border-primary bg-primary/[0.04]' : 'bg-card',
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
                        current.includes(habit.id) ? current : [...current, habit.id],
                      )
                    }
                  />

                  <div className="space-y-3 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {habit.category}
                        </p>
                        <h4 className="font-semibold leading-snug">
                          {habit.title}
                        </h4>
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
                  <div className="flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-5">
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

      <div className="rounded-xl border border-dashed p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          These habits are here to support the work ahead, not replace it.
          You will still need to speak to people, test your ideas, and make
          decisions. The habits help you practise how you approach that work.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedHabitIds.length === 0
            ? 'Choose 1–3 habits.'
            : `${selectedHabitIds.length} of ${MAX_SELECTED_HABITS} habits selected.`}
        </p>

        <Button
          onClick={handleSave}
          disabled={!canContinue || isSubmitting}
          className="h-12 gap-2 rounded-full px-8"
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
