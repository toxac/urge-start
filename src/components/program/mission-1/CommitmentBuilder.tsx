'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Bell, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveUserTasks } from '@/actions/tasks';

type Synthesis = {
  pattern: string;
  matters: string;
  future: string;
  chosenBehavior: string;
  barrierIds: string[];
  motivationIds: string[];
  quitConditionIds: string[];
  confirmed: boolean;
};

type TaskTemplate = {
  id: string;
  title: string;
  description: string;
  purpose: string;
  recurrence: 'daily' | 'weekly';
  durationDays: number;
  matches: (synthesis: Synthesis) => boolean;
};

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'notice_the_pattern',
    title: 'Notice the pattern',
    description:
      'Once a day, notice when the pattern you described shows up. Write down what happened before you reacted in your usual way.',
    purpose: 'Build awareness of the behaviour that gets in the way of moving.',
    recurrence: 'daily',
    durationDays: 5,
    matches: () => true,
  },

  {
    id: 'keep_your_reason_visible',
    title: 'Keep your reason visible',
    description:
      'Once a day, read what you wrote about why this matters to you. Notice whether it changes how you approach the day.',
    purpose: 'Keep the motivation behind starting visible when the work becomes ordinary.',
    recurrence: 'daily',
    durationDays: 5,
    matches: (synthesis) =>
      synthesis.motivationIds.length > 0 ||
      synthesis.matters.trim().length > 0,
  },

  {
    id: 'connect_to_your_future',
    title: 'Keep the future in sight',
    description:
      'Once a day, spend a few minutes remembering the change you said you want to create. Ask yourself what one small choice today would move in that direction.',
    purpose: 'Connect today’s behaviour with the future the founder actually wants.',
    recurrence: 'daily',
    durationDays: 5,
    matches: (synthesis) =>
      synthesis.future.trim().length > 0,
  },

  {
    id: 'question_the_barrier',
    title: 'Question the barrier',
    description:
      'When you notice yourself thinking that you cannot move until something changes, pause and ask: “Do I actually need this, or does it only feel necessary?”',
    purpose: 'Create distance between a perceived requirement and an actual requirement.',
    recurrence: 'daily',
    durationDays: 5,
    matches: (synthesis) =>
      synthesis.barrierIds.length > 0,
  },

  {
    id: 'act_before_certainty',
    title: 'Act before certainty',
    description:
      'Once a day, choose one small thing you could do without having all the answers. Do it before you feel completely ready.',
    purpose: 'Practice the behaviour at the heart of Move Before Ready.',
    recurrence: 'daily',
    durationDays: 5,
    matches: (synthesis) =>
      synthesis.pattern.trim().length > 0,
  },

  {
    id: 'pause_before_quitting',
    title: 'Pause before quitting',
    description:
      'If something makes you want to stop, do not make the decision immediately. Write down what happened, what you expected, and what you learned before deciding what it means.',
    purpose: 'Create space between a setback and the decision to walk away.',
    recurrence: 'weekly',
    durationDays: 4,
    matches: (synthesis) =>
      synthesis.quitConditionIds.length > 0,
  },

  {
    id: 'protect_what_matters',
    title: 'Protect what matters',
    description:
      'Once this week, make one deliberate choice that protects something you said matters to you, even if it is inconvenient.',
    purpose: 'Turn stated values into behaviour rather than leaving them as intentions.',
    recurrence: 'weekly',
    durationDays: 4,
    matches: (synthesis) =>
      synthesis.matters.trim().length > 0,
  },

  {
    id: 'choose_the_smallest_move',
    title: 'Choose the smallest move',
    description:
      'When you catch yourself thinking about everything that needs to happen, ask: “What is the smallest useful thing I can do right now?” Then do only that.',
    purpose: 'Reduce the distance between intention and action.',
    recurrence: 'daily',
    durationDays: 5,
    matches: () => true,
  },
];

function getRecommendedTasks(synthesis: Synthesis) {
  const matched = TASK_TEMPLATES.filter((template) =>
    template.matches(synthesis)
  );

  /*
   * Keep the recommendations small.
   *
   * We deliberately do not try to generate a perfect personalised
   * programme here. The recommendations come from a fixed library
   * and are selected using the user's own structured responses.
   */
  return matched.slice(0, 4);
}

export function CommitmentBuilder({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const saved = progress.payload ?? {};

  const savedSynthesis =
    saved.synthesis &&
    typeof saved.synthesis === 'object'
      ? (saved.synthesis as Synthesis)
      : null;

  /*
   * The reveal is the source of truth for this node.
   */
  const synthesis =
    savedSynthesis ??
    (saved as any).synthesis ??
    null;

  const recommendedTasks = useMemo(
    () =>
      synthesis
        ? getRecommendedTasks(synthesis)
        : [],
    [synthesis]
  );

  const savedTaskIds = Array.isArray(saved.taskIds)
    ? saved.taskIds
    : [];

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(
    savedTaskIds
  );

  const [nudges, setNudges] = useState<Record<string, boolean>>(
    typeof saved.nudges === 'object' && saved.nudges !== null
      ? saved.nudges
      : {}
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completed = saved.completed === true;

  const selectedTasks = recommendedTasks.filter((task) =>
    selectedTaskIds.includes(task.id)
  );

  const canContinue =
    selectedTaskIds.length >= 1 &&
    selectedTaskIds.length <= 2;

  function toggleTask(taskId: string) {
    setSelectedTaskIds((current) => {
      if (current.includes(taskId)) {
        return current.filter((id) => id !== taskId);
      }

      if (current.length >= 2) {
        return current;
      }

      return [...current, taskId];
    });
  }

  function toggleNudge(taskId: string) {
    setNudges((current) => ({
      ...current,
      [taskId]: !current[taskId],
    }));
  }

  async function handleSave() {
    if (!canContinue || !synthesis || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tasks = selectedTasks.map((task) => ({
        title: task.title,
        description: task.description,
        task_type: 'anchor' as const,
        source_node_key: nodeKey,
        is_nudge_enabled: nudges[task.id] ?? false,
        metadata: {
          recommendation_id: task.id,
          purpose: task.purpose,
          recurrence: {
            type: task.recurrence,
            duration_days: task.durationDays,
          },
        },
      }));

      const result = await saveUserTasks(tasks);

      await onComplete({
        synthesis,
        taskIds: selectedTaskIds,
        nudges,
        tasks: result.tasks,
        completed: true,
      });
    } catch (err) {
      console.error('[COMMITMENT BUILDER]', err);
      setError('Something went wrong while saving your choices. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!synthesis) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            {node.title || 'Draw your line in the sand.'}
          </h2>

          <p className="text-muted-foreground">
            We could not find the reflection from the previous step.
            Please go back and complete it first.
          </p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            YOUR PRACTICE
          </p>

          <h2 className="text-2xl font-semibold tracking-tight">
            You have chosen what you will practise.
          </h2>

          <p className="text-muted-foreground leading-relaxed">
            These are not business tasks. They are small behaviours that
            help you practise what you just learned about yourself.
          </p>
        </div>

        <div className="space-y-3">
          {selectedTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border p-5"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1.5">
                  <Check className="h-4 w-4 text-primary" />
                </div>

                <div className="space-y-1">
                  <p className="font-medium">{task.title}</p>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {task.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={() =>
            onComplete({
              synthesis,
              taskIds: selectedTaskIds,
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
    <div className="w-full space-y-10 pb-16">
      {/* Intro */}

      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">
          DRAW YOUR LINE IN THE SAND
        </p>

        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Knowing all that, what are you actually willing to do?
        </h2>

        <p className="text-lg leading-8 text-muted-foreground">
          Not your ideal week. Not a promise to become a different person
          overnight. Choose one or two small behaviours you are genuinely
          willing to practise.
        </p>
      </div>

      {/* User's own choice */}

      <div className="rounded-2xl border bg-muted/30 p-6 space-y-4">
        <p className="text-sm font-medium text-muted-foreground">
          WHAT YOU CHOSE
        </p>

        <p className="text-lg leading-relaxed">
          {synthesis.chosenBehavior}
        </p>
      </div>

      {/* Recommendations */}

      <section className="space-y-5">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            A few ways to practise this
          </h3>

          <p className="text-muted-foreground">
            Based on what you told us, these are a few practices that
            may help. Pick up to two.
          </p>
        </div>

        <div className="space-y-3">
          {recommendedTasks.map((task) => {
            const selected = selectedTaskIds.includes(task.id);
            const nudgeEnabled = nudges[task.id] ?? false;

            return (
              <div
                key={task.id}
                className={[
                  'rounded-2xl border p-5 transition-colors',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  disabled={
                    isSubmitting ||
                    (!selected && selectedTaskIds.length >= 2)
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
                        {task.title}
                      </p>

                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {task.description}
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
                      onClick={() => toggleNudge(task.id)}
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

      {/* Why these are different */}

      <div className="rounded-xl border border-dashed p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          These practices are deliberately small. They are not meant to
          replace the work of finding customers, testing an idea, or
          building a business. They are here to help you practise the
          behaviour you need to do that work.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Save */}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {selectedTaskIds.length === 0
            ? 'Choose 1–2 practices.'
            : `${selectedTaskIds.length} practice${
                selectedTaskIds.length === 1 ? '' : 's'
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