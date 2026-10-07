'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Bell, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveUserTasks } from '@/actions/tasks';

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

type GapPractice = {
  id: string;
  title: string;
  description: string;
  purpose: string;
  recurrence: 'daily' | 'weekly';
  durationDays: number;
  matches: (context: PracticeContext) => boolean;
};

type PracticeContext = {
  barriers: Barrier[];
  motivations: Motivation[];
  future: string;
  quitConditions: QuitCondition[];
  reveal: RevealSynthesis;
};

const PRACTICE_TEMPLATES: GapPractice[] = [
  {
    id: 'notice_the_pattern',
    title: 'Notice the pattern',
    description:
      'Once a day, notice when the pattern described in the reveal shows up. Write down what happened just before you reacted in your usual way.',
    purpose:
      'Build awareness of the behaviour that gets in the way of moving.',
    recurrence: 'daily',
    durationDays: 5,
    matches: () => true,
  },

  {
    id: 'act_before_certainty',
    title: 'Act before certainty',
    description:
      'Once a day, choose one small thing you could do without having all the answers. Do it before you feel completely ready.',
    purpose:
      'Practise moving before certainty arrives.',
    recurrence: 'daily',
    durationDays: 5,
    matches: () => true,
  },

  {
    id: 'choose_the_smallest_move',
    title: 'Choose the smallest move',
    description:
      'When you catch yourself thinking about everything that needs to happen, ask: “What is the smallest useful thing I can do right now?” Then do only that.',
    purpose:
      'Reduce the distance between intention and action.',
    recurrence: 'daily',
    durationDays: 5,
    matches: () => true,
  },

  {
    id: 'question_the_barrier',
    title: 'Question the barrier',
    description:
      'When you notice yourself thinking that you cannot move until something changes, pause and ask: “Do I actually need this, or does it only feel necessary?”',
    purpose:
      'Create distance between a perceived requirement and an actual requirement.',
    recurrence: 'daily',
    durationDays: 5,
    matches: (context) =>
      context.barriers.length > 0,
  },

  {
    id: 'keep_your_reason_visible',
    title: 'Keep your reason visible',
    description:
      'Once a day, read what you wrote about why this matters to you. Notice whether it changes how you approach the day.',
    purpose:
      'Keep the motivation behind starting visible when the work becomes ordinary.',
    recurrence: 'daily',
    durationDays: 5,
    matches: (context) =>
      context.motivations.length > 0,
  },

  {
    id: 'connect_to_your_future',
    title: 'Keep the future in sight',
    description:
      'Once a day, spend a few minutes remembering the change you said you want to create. Ask yourself what one small choice today would move in that direction.',
    purpose:
      'Connect today’s behaviour with the future you actually want.',
    recurrence: 'daily',
    durationDays: 5,
    matches: (context) =>
      context.future.trim().length > 0,
  },

  {
    id: 'pause_before_quitting',
    title: 'Pause before quitting',
    description:
      'If something makes you want to stop, do not make the decision immediately. Write down what happened, what you expected, and what you learned before deciding what it means.',
    purpose:
      'Create space between a setback and the decision to walk away.',
    recurrence: 'weekly',
    durationDays: 4,
    matches: (context) =>
      context.quitConditions.length > 0,
  },

  {
    id: 'protect_what_matters',
    title: 'Protect what matters',
    description:
      'Once this week, make one deliberate choice that protects something you said matters to you, even if it is inconvenient.',
    purpose:
      'Turn what matters into behaviour rather than leaving it as an intention.',
    recurrence: 'weekly',
    durationDays: 4,
    matches: (context) =>
      context.motivations.length > 0 ||
      context.future.trim().length > 0,
  },
];

function getRecommendedPractices(context: PracticeContext) {
  const matched = PRACTICE_TEMPLATES.filter((template) =>
    template.matches(context)
  );

  /*
   * Keep this deliberately small.
   *
   * These are fixed practices selected from the user's structured
   * responses. The AI reveal is used to give the practices context,
   * but does not decide what the user should do.
   */
  return matched.slice(0, 4);
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

  /*
   * This node's progress only contains this node's saved choices.
   * The reveal belongs to m1-q1-reveal, so read it from the global
   * progress store.
   */
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

  const barriers: Barrier[] = Array.isArray(
    barriersContext?.barriers
  )
    ? barriersContext.barriers
    : [];

  const motivations: Motivation[] = Array.isArray(
    motivationsContext?.motivations
  )
    ? motivationsContext.motivations
    : [];

  const future =
    typeof futureContext?.reflection === 'string'
      ? futureContext.reflection
      : '';

  const quitConditions: QuitCondition[] = Array.isArray(
    quitConditionsContext?.conditions
  )
    ? quitConditionsContext.conditions
    : [];

  const practiceContext =
    reveal &&
    ({
      barriers,
      motivations,
      future,
      quitConditions,
      reveal,
    } satisfies PracticeContext);

  const recommendedPractices = useMemo(
    () =>
      practiceContext
        ? getRecommendedPractices(practiceContext)
        : [],
    [
      reveal,
      barriers,
      motivations,
      future,
      quitConditions,
    ]
  );

  const savedPracticeIds = Array.isArray(saved.practiceIds)
    ? saved.practiceIds
    : [];

  const [selectedPracticeIds, setSelectedPracticeIds] =
    useState<string[]>(savedPracticeIds);

  const [nudges, setNudges] = useState<Record<string, boolean>>(
    typeof saved.nudges === 'object' &&
      saved.nudges !== null
      ? saved.nudges
      : {}
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completed = saved.completed === true;

  const selectedPractices = recommendedPractices.filter(
    (practice) =>
      selectedPracticeIds.includes(practice.id)
  );

  const canContinue =
    selectedPracticeIds.length >= 1 &&
    selectedPracticeIds.length <= 2;

  function togglePractice(practiceId: string) {
    setSelectedPracticeIds((current) => {
      if (current.includes(practiceId)) {
        return current.filter(
          (id) => id !== practiceId
        );
      }

      if (current.length >= 2) {
        return current;
      }

      return [...current, practiceId];
    });
  }

  function toggleNudge(practiceId: string) {
    setNudges((current) => ({
      ...current,
      [practiceId]: !current[practiceId],
    }));
  }

  async function handleSave() {
    if (
      !canContinue ||
      !reveal ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tasks = selectedPractices.map(
        (practice) => ({
          title: practice.title,
          description: practice.description,
          task_type: 'anchor' as const,
          source_node_key: nodeKey,
          is_nudge_enabled:
            nudges[practice.id] ?? false,
          metadata: {
            recommendation_id: practice.id,
            purpose: practice.purpose,
            recurrence: {
              type: practice.recurrence,
              duration_days:
                practice.durationDays,
            },
          },
        })
      );

      const result = await saveUserTasks(tasks);

      await onComplete({
        reveal,
        practiceIds: selectedPracticeIds,
        nudges,
        tasks: result.tasks,
        completed: true,
      });
    } catch (err) {
      console.error(
        '[COMMITMENT BUILDER]',
        err
      );

      setError(
        'Something went wrong while saving your choices. Please try again.'
      );

      setIsSubmitting(false);
    }
  }

  /*
   * If the reveal has not been completed, this node cannot
   * meaningfully continue. This should normally only happen if
   * someone navigates directly to this node.
   */
  if (!reveal) {
    return (
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            CONTINUE YOUR JOURNEY
          </p>

          <h2 className="text-3xl font-semibold tracking-tight">
            {node.title || 'Carry this forward'}
          </h2>

          <p className="text-lg leading-8 text-muted-foreground">
            Before choosing what to practise, we need to look at
            what you discovered in the previous step.
          </p>

          <p className="text-sm leading-6 text-muted-foreground">
            Go back and complete the reveal first.
          </p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            CARRY THIS FORWARD
          </p>

          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            You have chosen what to practise.
          </h2>

          <p className="text-lg leading-8 text-muted-foreground">
            These are not business tasks. They are small behaviours
            that help you practise what you just learned about yourself.
          </p>
        </div>

        <div className="rounded-2xl border bg-muted/20 p-6 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
            WHAT WE NOTICED
          </p>

          <h3 className="mt-3 text-2xl font-semibold leading-9">
            {reveal.headline}
          </h3>

          <p className="mt-5 text-base leading-7 text-muted-foreground">
            {reveal.interpretation}
          </p>
        </div>

        <div className="space-y-3">
          {selectedPractices.map((practice) => (
            <div
              key={practice.id}
              className="rounded-xl border p-5"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1.5">
                  <Check className="h-4 w-4 text-primary" />
                </div>

                <div className="space-y-1">
                  <p className="font-medium">
                    {practice.title}
                  </p>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {practice.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={() =>
            onComplete({
              reveal,
              practiceIds: selectedPracticeIds,
              nudges,
              completed: true,
            })
          }
          className="gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-10 pb-16">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
          CARRY THIS FORWARD
        </p>

        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          What will you practise when this pattern shows up?
        </h2>

        <p className="text-lg leading-8 text-muted-foreground">
          You do not need to change everything. Choose one or two
          small behaviours you are genuinely willing to practise.
        </p>
      </div>

      <div className="rounded-2xl border bg-muted/20 p-6 sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
          WHAT WE NOTICED
        </p>

        <h3 className="mt-3 text-2xl font-semibold leading-9">
          {reveal.headline}
        </h3>

      </div>

      <section className="space-y-5">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            Now practise something different
          </h3>

          <p className="text-base leading-7 text-muted-foreground">
            These practices are based on what you told us. Pick
            up to two that feel useful for you.
          </p>
        </div>

        <div className="space-y-3">
          {recommendedPractices.map((practice) => {
            const selected =
              selectedPracticeIds.includes(
                practice.id
              );

            const nudgeEnabled =
              nudges[practice.id] ?? false;

            return (
              <div
                key={practice.id}
                className={[
                  'rounded-2xl border p-5 transition-colors',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() =>
                    togglePractice(practice.id)
                  }
                  disabled={
                    isSubmitting ||
                    (!selected &&
                      selectedPracticeIds.length >= 2)
                  }
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={[
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40',
                      ].join(' ')}
                    >
                      {selected && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="font-medium">
                        {practice.title}
                      </p>

                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {practice.description}
                      </p>
                    </div>
                  </div>
                </button>

                {selected && (
                  <div className="mt-4 ml-10 flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />

                      <span className="text-sm text-muted-foreground">
                        Remind me about this
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        toggleNudge(practice.id)
                      }
                      disabled={isSubmitting}
                      aria-pressed={nudgeEnabled}
                      className={[
                        'relative h-6 w-11 rounded-full transition-colors',
                        nudgeEnabled
                          ? 'bg-primary'
                          : 'bg-muted',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform',
                          nudgeEnabled
                            ? 'translate-x-6'
                            : 'translate-x-1',
                        ].join(' ')}
                      />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="rounded-xl border border-dashed p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          These practices are deliberately small. They are not
          meant to replace finding customers, testing an idea, or
          building a business. They are here to help you practise
          the behaviour needed to do that work.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {selectedPracticeIds.length === 0
            ? 'Choose 1–2 practices.'
            : `${selectedPracticeIds.length} practice${
                selectedPracticeIds.length === 1
                  ? ''
                  : 's'
              } selected.`}
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
              Lock it in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}