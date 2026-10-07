'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Check, Loader2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveUserTasks } from '@/actions/tasks';

type GapType =
  | 'learn'
  | 'reach'
  | 'acquire'
  | 'time'
  | 'not_needed'
  | 'uncertain';

type GapEntry = {
  id: string;
  title: string;
  type: GapType;
  detail: string;
};

type AssetRevealPayload = {
  gaps?: GapEntry[];
  confirmed?: boolean;
};

type GapActionOption = {
  id: string;
  title: string;
  description: string;
};

type SelectedAction = {
  gapId: string;
  gapTitle: string;
  gapType: GapType;
  actionId: string;
  actionTitle: string;
  description: string;
};

const ACTIONS_BY_GAP: Record<GapType, GapActionOption[]> = {
  learn: [
    {
      id: 'learn_enough',
      title: 'Learn enough to get started',
      description: 'Learn what you need for the next step, not everything about it.',
    },
    {
      id: 'find_someone',
      title: 'Find someone who already knows this',
      description: 'Use someone else’s experience instead of waiting to become an expert.',
    },
    {
      id: 'practise',
      title: 'Practise it',
      description: 'Get better by doing something small with it.',
    },
  ],

  reach: [
    {
      id: 'find_help',
      title: 'Find someone who can help',
      description: 'Identify a person who can help you move this forward.',
    },
    {
      id: 'ask_introduction',
      title: 'Ask for an introduction',
      description: 'Use someone already within reach to open the door.',
    },
  ],

  acquire: [
    {
      id: 'borrow_share_access',
      title: 'Find a way to borrow, share or access it',
      description: 'Look for a way to use what you need without owning it first.',
    },
    {
      id: 'acquire',
      title: 'Find a way to acquire it',
      description: 'Work out what it would take to get the resource you need.',
    },
    {
      id: 'find_complement',
      title: 'Find someone who can complement me',
      description: 'Look for someone who already has what you are missing.',
    },
  ],

  time: [
    {
      id: 'make_room',
      title: 'Make room for it',
      description: 'Decide what you can stop, reduce or rearrange to create the time.',
    },
    {
      id: 'find_another_way',
      title: 'Find another way to do it',
      description: 'Change the approach instead of assuming you need more time.',
    },
  ],

  uncertain: [
    {
      id: 'find_out',
      title: 'Find out whether I actually need this',
      description: 'Get enough evidence to decide whether this is a real gap.',
    },
    {
      id: 'ask_someone',
      title: 'Ask someone who knows',
      description: 'Use another person’s experience to reduce the uncertainty.',
    },
  ],

  not_needed: [],
};

const GAP_LABELS: Record<GapType, string> = {
  learn: 'Something I need to learn',
  reach: 'Someone I need to reach',
  acquire: 'Something I need to acquire or access',
  time: 'I need more time for this',
  not_needed: 'I do not actually need this yet',
  uncertain: 'I am not sure',
};

function getRevealPayload(progress: unknown): AssetRevealPayload | null {
  if (!progress || typeof progress !== 'object') return null;

  const value = progress as Record<string, unknown>;

  if (
    !value.payload ||
    typeof value.payload !== 'object'
  ) {
    return null;
  }

  return value.payload as AssetRevealPayload;
}

function getActionPayload(progress: unknown) {
  if (!progress || typeof progress !== 'object') return null;

  const value = progress as Record<string, unknown>;

  if (
    !value.payload ||
    typeof value.payload !== 'object'
  ) {
    return null;
  }

  return value.payload as {
    selectedActions?: SelectedAction[];
    completed?: boolean;
  };
}

export default function GapAction({
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const revealPayload = getRevealPayload(progress);
  const actionPayload = getActionPayload(progress);

  const gaps = useMemo(
    () => revealPayload?.gaps ?? [],
    [revealPayload]
  );

  const [selectedActions, setSelectedActions] = useState<SelectedAction[]>(
    actionPayload?.selectedActions ?? []
  );

  const [isReviewing, setIsReviewing] = useState(
    Boolean(actionPayload?.completed)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionableGaps = gaps.filter(
    (gap) => gap.type !== 'not_needed'
  );

  const toggleAction = (
    gap: GapEntry,
    option: GapActionOption
  ) => {
    setSelectedActions((current) => {
      const exists = current.some(
        (action) =>
          action.gapId === gap.id &&
          action.actionId === option.id
      );

      if (exists) {
        return current.filter(
          (action) =>
            !(
              action.gapId === gap.id &&
              action.actionId === option.id
            )
        );
      }

      // Keep this deliberately small.
      // Q2 is about choosing what deserves attention,
      // not creating a task list.
      if (current.length >= 2) {
        return current;
      }

      return [
        ...current,
        {
          gapId: gap.id,
          gapTitle: gap.title,
          gapType: gap.type,
          actionId: option.id,
          actionTitle: option.title,
          description: option.description,
        },
      ];
    });
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const tasksToSave = selectedActions.map((action) => ({
        title: action.actionTitle,
        description: `${action.description} This came from the gap: "${action.gapTitle}".`,
        task_type: 'anchor' as const,
        source_node_key: nodeKey,
        is_nudge_enabled: false,
        metadata: {
          source: 'm1-q2-gap-action',
          gap_id: action.gapId,
          gap_type: action.gapType,
          action_id: action.actionId,
        },
      }));

      const result =
        tasksToSave.length > 0
          ? await saveUserTasks(tasksToSave)
          : { success: true, tasks: [] };

      onComplete({
        selectedActions,
        savedTaskIds: result.tasks.map((task) => task.id),
        completed: true,
      });

      setIsReviewing(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isReviewing) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            WHAT YOU DECIDED TO DO
          </p>

          <h2 className="text-2xl font-semibold tracking-tight">
            You do not need to fix everything before you start.
          </h2>

          <p className="text-muted-foreground">
            These are the things you decided are actually worth giving
            attention to.
          </p>
        </div>

        {selectedActions.length > 0 ? (
          <div className="space-y-3">
            {selectedActions.map((action) => (
              <div
                key={`${action.gapId}-${action.actionId}`}
                className="rounded-xl border bg-background p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-4 w-4" />
                  </div>

                  <div className="space-y-1">
                    <p className="font-medium">{action.actionTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      From: {action.gapTitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="font-medium">
              Nothing needs your attention right now.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              That is a valid decision. You do not need to manufacture a
              task just to keep moving.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setIsReviewing(false)}
            disabled={isSubmitting}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button onClick={() => onComplete({
            selectedActions,
            completed: true,
          })}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          CHOOSE WHAT DESERVES ATTENTION
        </p>

        <h2 className="text-2xl font-semibold tracking-tight">
          You do not need to fix everything.
        </h2>

        <p className="text-muted-foreground">
          Look at the gaps you identified. What is actually worth doing
          something about right now?
        </p>
      </div>

      {actionableGaps.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-5">
          <p className="font-medium">
            You have not identified anything that needs action.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            That is okay. Sometimes the useful conclusion is simply:
            I have enough to begin.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {actionableGaps.map((gap) => {
            const options = ACTIONS_BY_GAP[gap.type];

            return (
              <div key={gap.id} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {GAP_LABELS[gap.type]}
                  </p>

                  <h3 className="text-lg font-medium">
                    {gap.title}
                  </h3>

                  {gap.detail && (
                    <p className="text-sm text-muted-foreground">
                      {gap.detail}
                    </p>
                  )}
                </div>

                {options.length > 0 && (
                  <div className="space-y-2">
                    {options.map((option) => {
                      const selected = selectedActions.some(
                        (action) =>
                          action.gapId === gap.id &&
                          action.actionId === option.id
                      );

                      const disabled =
                        !selected && selectedActions.length >= 2;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            toggleAction(gap, option)
                          }
                          disabled={disabled}
                          className={[
                            'w-full rounded-xl border p-4 text-left transition',
                            selected
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/50',
                            disabled
                              ? 'cursor-not-allowed opacity-50'
                              : '',
                          ].join(' ')}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={[
                                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                                selected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-muted-foreground/30',
                              ].join(' ')}
                            >
                              {selected && (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </div>

                            <div>
                              <p className="font-medium">
                                {option.title}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">
          You can choose up to two things. You can also choose nothing.
          You do not need to solve every gap before you begin.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleComplete}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}