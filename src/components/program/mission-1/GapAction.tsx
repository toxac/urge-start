'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Check, Loader2, Plus, Pencil, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveUserTasks } from '@/actions/tasks';

type GapType =
  | 'learn'
  | 'reach'
  | 'acquire'
  | 'time'
  | 'uncertain';

type GapEntry = {
  id: string;
  title: string;
  type: GapType;
  detail: string;
};

type AssetRevealPayload = {
  synthesis?: string;
  headline?: string;
  interpretation?: string;
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

const GAP_TYPES: Array<{
  id: GapType;
  title: string;
  description: string;
}> = [
  {
    id: 'learn',
    title: 'Something I need to learn',
    description: 'I need some knowledge or understanding before I can move.',
  },
  {
    id: 'reach',
    title: 'Someone I need to reach',
    description: 'I need access to a person, group, audience, or introduction.',
  },
  {
    id: 'acquire',
    title: 'Something I need to access',
    description: 'I need a resource, tool, place, or capability I do not currently have.',
  },
  {
    id: 'time',
    title: 'I need to make room',
    description: 'I need to create enough time or capacity to do this.',
  },
  {
    id: 'uncertain',
    title: 'I am not sure yet',
    description: 'I think something may be missing, but I need evidence before deciding.',
  },
];

const ACTIONS_BY_GAP: Record<GapType, GapActionOption[]> = {
  learn: [
    {
      id: 'learn_enough',
      title: 'Learn enough to get started',
      description:
        'Learn what you need for the next step, not everything about it.',
    },
    {
      id: 'find_someone',
      title: 'Find someone who already knows this',
      description:
        'Use someone else’s experience instead of waiting to become an expert.',
    },
    {
      id: 'practise',
      title: 'Practise it',
      description:
        'Get better by doing something small with it.',
    },
  ],

  reach: [
    {
      id: 'find_help',
      title: 'Find someone who can help',
      description:
        'Identify a person who can help you move this forward.',
    },
    {
      id: 'ask_introduction',
      title: 'Ask for an introduction',
      description:
        'Use someone already within reach to open the door.',
    },
  ],

  acquire: [
    {
      id: 'borrow_share_access',
      title: 'Find a way to borrow, share or access it',
      description:
        'Look for a way to use what you need without owning it first.',
    },
    {
      id: 'acquire',
      title: 'Find a way to acquire it',
      description:
        'Work out what it would take to get the resource you need.',
    },
    {
      id: 'find_complement',
      title: 'Find someone who can complement me',
      description:
        'Look for someone who already has what you are missing.',
    },
  ],

  time: [
    {
      id: 'make_room',
      title: 'Make room for it',
      description:
        'Decide what you can stop, reduce or rearrange to create the time.',
    },
    {
      id: 'find_another_way',
      title: 'Find another way to do it',
      description:
        'Change the approach instead of assuming you need more time.',
    },
  ],

  uncertain: [
    {
      id: 'find_out',
      title: 'Find out whether I actually need this',
      description:
        'Get enough evidence to decide whether this is a real gap.',
    },
    {
      id: 'ask_someone',
      title: 'Ask someone who knows',
      description:
        'Use another person’s experience to reduce the uncertainty.',
    },
  ],
};

function getActionPayload(progress: unknown) {
  if (!progress || typeof progress !== 'object') return null;

  const value = progress as Record<string, unknown>;

  if (!value.payload || typeof value.payload !== 'object') {
    return null;
  }

  return value.payload as {
    gaps?: GapEntry[];
    selectedActions?: SelectedAction[];
    completed?: boolean;
  };
}

function getRevealPayload(payload: unknown): AssetRevealPayload | null {
  if (!payload || typeof payload !== 'object') return null;

  return payload as AssetRevealPayload;
}

export function GapAction({
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  /*
   * The reveal is a previous node.
   *
   * The current `progress` prop belongs to this action node, so it cannot
   * be used to retrieve the reveal payload.
   */
  const revealPayload = getRevealPayload(
    undefined
  );

  const actionPayload = getActionPayload(progress);

  const [gaps, setGaps] = useState<GapEntry[]>(
    actionPayload?.gaps ?? []
  );

  const [selectedActions, setSelectedActions] = useState<SelectedAction[]>(
    actionPayload?.selectedActions ?? []
  );

  const [isAddingGap, setIsAddingGap] = useState(false);
  const [newGapTitle, setNewGapTitle] = useState('');
  const [newGapType, setNewGapType] = useState<GapType>('uncertain');
  const [newGapDetail, setNewGapDetail] = useState('');

  const [isReviewing, setIsReviewing] = useState(
    Boolean(actionPayload?.completed)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionableGaps = useMemo(
    () => gaps,
    [gaps]
  );

  function addGap() {
    const title = newGapTitle.trim();

    if (!title) return;

    const gap: GapEntry = {
      id: crypto.randomUUID(),
      title,
      type: newGapType,
      detail: newGapDetail.trim(),
    };

    setGaps((current) => [...current, gap]);

    setNewGapTitle('');
    setNewGapDetail('');
    setNewGapType('uncertain');
    setIsAddingGap(false);
  }

  function removeGap(gapId: string) {
    setGaps((current) => current.filter((gap) => gap.id !== gapId));

    setSelectedActions((current) =>
      current.filter((action) => action.gapId !== gapId)
    );
  }

  function toggleAction(
    gap: GapEntry,
    option: GapActionOption
  ) {
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
  }

  async function handleComplete() {
    if (isSubmitting) return;

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
        gaps,
        selectedActions,
        savedTaskIds: result.tasks.map((task) => task.id),
        completed: true,
      });

      setIsReviewing(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isReviewing) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            WHAT DESERVES ATTENTION
          </p>

          <h2 className="text-2xl font-semibold tracking-tight">
            You do not need to have everything before you begin.
          </h2>

          <p className="text-muted-foreground">
            You have separated what is genuinely missing from what you
            can already work with.
          </p>
        </div>

        {gaps.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              WHAT YOU IDENTIFIED
            </p>

            {gaps.map((gap) => (
              <div
                key={gap.id}
                className="rounded-xl border bg-background p-4"
              >
                <p className="font-medium">{gap.title}</p>

                {gap.detail && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {gap.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedActions.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              WHAT YOU WILL DO
            </p>

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
                    <p className="font-medium">
                      {action.actionTitle}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Because: {action.gapTitle}
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
              That is a valid decision. You do not need to manufacture
              a task just to keep moving.
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

          <Button
            onClick={() =>
              onComplete({
                gaps,
                selectedActions,
                completed: true,
              })
            }
          >
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
          You have looked at what you already have. Now decide what,
          if anything, is genuinely missing before you can take your
          next step.
        </p>
      </div>

      {gaps.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            GAPS YOU HAVE IDENTIFIED
          </p>

          {gaps.map((gap) => (
            <div
              key={gap.id}
              className="rounded-xl border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium">{gap.title}</p>

                  {gap.detail && (
                    <p className="text-sm text-muted-foreground">
                      {gap.detail}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeGap(gap.id)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Remove ${gap.title}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isAddingGap ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsAddingGap(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add something that is genuinely missing
        </Button>
      ) : (
        <div className="rounded-xl border bg-muted/20 p-5 space-y-5">
          <div className="space-y-2">
            <p className="font-medium">
              What is genuinely missing?
            </p>

            <p className="text-sm text-muted-foreground">
              Be specific. Think about what could actually stop you
              from taking your next step.
            </p>
          </div>

          <Input
            value={newGapTitle}
            onChange={(event) => setNewGapTitle(event.target.value)}
            placeholder="e.g. I need to understand how to price this"
            autoFocus
          />

          <div className="space-y-2">
            <p className="text-sm font-medium">
              What kind of gap is it?
            </p>

            <div className="space-y-2">
              {GAP_TYPES.map((type) => {
                const selected = newGapType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setNewGapType(type.id)}
                    className={[
                      'w-full rounded-xl border p-4 text-left transition',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50',
                    ].join(' ')}
                  >
                    <p className="font-medium">{type.title}</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            value={newGapDetail}
            onChange={(event) => setNewGapDetail(event.target.value)}
            placeholder="Optional: what makes this a gap?"
          />

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddingGap(false);
                setNewGapTitle('');
                setNewGapDetail('');
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={addGap}
              disabled={!newGapTitle.trim()}
            >
              Add gap
            </Button>
          </div>
        </div>
      )}

      {actionableGaps.length > 0 && (
        <div className="space-y-8">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              NOW CHOOSE WHAT DESERVES ACTION
            </p>

            <p className="text-sm text-muted-foreground">
              You do not have to act on every gap. Pick up to two that
              are worth doing something about now.
            </p>
          </div>

          {actionableGaps.map((gap) => {
            const options = ACTIONS_BY_GAP[gap.type];

            return (
              <div key={gap.id} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">
                    {gap.title}
                  </h3>

                  {gap.detail && (
                    <p className="text-sm text-muted-foreground">
                      {gap.detail}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {options.map((option) => {
                    const selected = selectedActions.some(
                      (action) =>
                        action.gapId === gap.id &&
                        action.actionId === option.id
                    );

                    const disabled =
                      !selected &&
                      selectedActions.length >= 2;

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
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">
          You can identify as many gaps as you need, but choose no
          more than two things to act on. You may also decide that
          nothing needs attention right now.
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