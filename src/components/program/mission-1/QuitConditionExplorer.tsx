'use client';

import { useStore } from '@nanostores/react';
import { Loader2 } from 'lucide-react';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import {
  ReflectiveOptionGrid,
  type ReflectiveItem,
  type ReflectiveOptionPreset,
} from '@/components/program/helpers/ReflectiveOptionGrid';
import { updateUserProgramContext } from '@/actions/user-context';
import { $userContext, userContextActions } from '@/lib/stores/user-context';

const quitOptions: ReflectiveOptionPreset[] = [
  {
    id: 'money',
    title: 'I run out of money or resources.',
    description:
      'The financial cost or opportunity cost feels higher than what you can safely afford.',
    reflectionPrompt:
      'What does your "hard financial stop" look like in concrete terms?',
    placeholder: 'I would have to stop if my expenses reach...',
  },
  {
    id: 'rejection',
    title: 'People keep saying no.',
    description:
      'Hearing no repeatedly or being ignored makes you question whether there is any demand.',
    reflectionPrompt:
      'How many noes or quiet weeks would it take to test your conviction?',
    placeholder: 'If people kept ignoring or rejecting the offer, I might...',
  },
  {
    id: 'slow_progress',
    title: 'Nothing seems to be happening.',
    description:
      'Putting in consistent effort over weeks or months without seeing tangible traction.',
    reflectionPrompt:
      'How long could you operate without seeing evidence that it’s working?',
    placeholder: 'I might step away if I put in three months and...',
  },
  {
    id: 'loss_of_interest',
    title: 'I stop believing in the problem.',
    description:
      'Novelty fades, the problem stops feeling important, or another direction pulls you away.',
    reflectionPrompt:
      'What would reveal to you that you don’t actually care about this problem?',
    placeholder: 'I would lose interest if I realized that the day-to-day...',
  },
  {
    id: 'life',
    title: 'Life circumstances get in the way.',
    description:
      'Family responsibilities, health, job shifts, or relationships demand your full attention.',
    reflectionPrompt:
      'What realistic life changes would force you to pause or walk away?',
    placeholder: 'If my circumstances changed around...',
  },
  {
    id: 'self_doubt',
    title: 'I start doubting whether I can do this.',
    description:
      'Setbacks turn inward into a belief that you lack what it takes to operate a business.',
    reflectionPrompt:
      'What kind of stumble tends to trigger self-doubt for you?',
    placeholder: 'I start doubting myself when I encounter...',
  },
];

export function QuitConditionExplorer({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);

  // 1. Wait for Nanostore hydration
  if (!contextState.isHydrated) {
    return (
      <div className="flex items-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading your responses...</span>
      </div>
    );
  }

  // 2. Read saved quit conditions from userContext, falling back to progress payload
  const savedConditions =
    (contextState.userContext?.quit_conditions as Record<string, any>)?.conditions ??
    (progress.payload?.conditions as ReflectiveItem[]) ??
    [];

  const isCompleted = progress.completed === true || savedConditions.length > 0;

  // 3. Action submission handler
  async function handleSubmit(items: ReflectiveItem[]) {
    // Persist to user_program_context
    const result = await updateUserProgramContext({
      quit_conditions: { conditions: items },
    });

    // Sync Nanostore immediately
    userContextActions.updateContextLocally(result.userContext);

    // Complete node
    await onComplete({
      conditions: items,
      completed: true,
    });
  }

  // 4. Quick continue if revisiting without editing
  async function handleContinueWithoutChanges() {
    await onComplete({
      conditions: savedConditions,
      completed: true,
    });
  }

  return (
    <ReflectiveOptionGrid
      title={node.title}
      introParagraphs={[
        'Starting is only part of the journey. Things will get difficult at some point.',
        'Before you move on, think honestly about what could realistically make you walk away. Naming these conditions now gives you a chance to recognize them before they arrive.',
        'Choose the things that feel like realistic risks for you, or add your own. Reflect on what would actually have to happen for you to stop.',
      ]}
      options={quitOptions}
      initialItems={savedConditions}
      isCompleted={isCompleted}
      entityLabel="risk"
      primaryBadgeLabel="Top risk to stopping"
      prioritizePrompt="Which condition is most likely to make you stop?"
      prioritizeSubtext="Several of these could shake your momentum, but one is usually the most dangerous for you. Identify the condition you most need to watch out for."
      customPromptLabel="What else could realistically make you stop?"
      customPromptPlaceholder="e.g. If my health declines or it strains my relationship with my partner..."
      onSubmit={handleSubmit}
      onContinueWithoutChanges={handleContinueWithoutChanges}
    />
  );
}