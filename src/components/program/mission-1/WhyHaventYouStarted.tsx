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

const barrierOptions: ReflectiveOptionPreset[] = [
  {
    id: 'money',
    title: 'I think I need more money.',
    description:
      'Waiting for savings, funding, or financial runway before feeling permitted to take a first step.',
    reflectionPrompt:
      'What financial threshold are you waiting to cross before you feel ready?',
    placeholder: 'I keep holding back because I tell myself I need...',
  },
  {
    id: 'time',
    title: "I don't have enough time.",
    description:
      'Life, job, and family feel full, and starting something feels like an impossible extra load.',
    reflectionPrompt:
      'What are you waiting to clear out of your life before starting?',
    placeholder: 'I tell myself I will start when my schedule...',
  },
  {
    id: 'knowledge',
    title: 'I need to know more first.',
    description:
      'Consuming courses, books, and frameworks because learning feels safer than doing.',
    reflectionPrompt:
      'What specific credential, skill, or answer do you feel you lack?',
    placeholder: "I think I'm unqualified until I figure out...",
  },
  {
    id: 'clarity',
    title: "I don't know where to begin.",
    description:
      'Spinning through too many ideas or overwhelmed by the first practical step.',
    reflectionPrompt:
      'Where does the uncertainty actually stop your momentum?',
    placeholder: "I get stuck because I don't know whether to...",
  },
  {
    id: 'judgment',
    title: "I'm worried about what people will think.",
    description:
      'The discomfort of being seen trying something new, looking inexperienced, or being questioned.',
    reflectionPrompt:
      'Whose opinion or reaction are you most hesitant to face?',
    placeholder: 'I worry that people around me will think...',
  },
  {
    id: 'failure',
    title: "I'm afraid it won't work.",
    description:
      'Staying in the idea is safe; acting makes rejection or disappointment a real possibility.',
    reflectionPrompt:
      "What is the worst realistic outcome you imagine if this doesn't work?",
    placeholder: 'If I try and it fails, it would mean...',
  },
];

export function WhyHaventYouStarted({
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

  // 2. Read saved barriers from userContext, falling back to progress payload
  const savedBarriers =
    (contextState.userContext?.perceived_barriers as Record<string, any>)?.barriers ??
    (progress.payload?.barriers as ReflectiveItem[]) ??
    [];

  const isCompleted = progress.completed === true || savedBarriers.length > 0;

  // 3. Action submission handler
  async function handleSubmit(items: ReflectiveItem[]) {
    // A. Update database via server action
    const result = await updateUserProgramContext({
      perceived_barriers: { barriers: items },
    });

    // B. Sync Nanostore immediately so local state is never stale
    userContextActions.updateContextLocally(result.userContext);

    // C. Notify NodeRenderer & complete the step
    await onComplete({
      barriers: items,
      completed: true,
    });
  }

  // 4. Quick continue if revisiting without editing
  async function handleContinueWithoutChanges() {
    await onComplete({
      barriers: savedBarriers,
      completed: true,
    });
  }

  return (
    <ReflectiveOptionGrid
      title={node.title}
      introParagraphs={[
        'You probably have a few reasons for not starting yet. Some are genuine practical constraints. Others are fears or habits of delay.',
        'Choose any statements that feel familiar, or add your own in your own words. When you select one, take a moment to write how it actually shows up for you.',
      ]}
      options={barrierOptions}
      initialItems={savedBarriers}
      isCompleted={isCompleted}
      entityLabel="barrier"
      primaryBadgeLabel="Biggest barrier"
      prioritizePrompt="Which barrier feels most responsible for keeping you stuck?"
      prioritizeSubtext="Several of these may be real, but usually one is doing most of the work. Choose the single barrier that has the strongest hold on you right now."
      customPromptLabel="What barrier is stopping you?"
      customPromptPlaceholder="e.g. My partner isn't convinced yet / I cannot afford to lose my health coverage..."
      onSubmit={handleSubmit}
      onContinueWithoutChanges={handleContinueWithoutChanges}
    />
  );
}