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

const futurePresets: ReflectiveOptionPreset[] = [
  {
    id: 'time_control',
    title: 'I have control over my time and schedule.',
    description:
      'Deciding when, where, and how you work rather than living by someone else’s calendar.',
    reflectionPrompt:
      'What would having genuine control over your schedule change about your daily life?',
    placeholder: 'If I controlled my time, my ordinary days would look like...',
  },
  {
    id: 'meaningful_work',
    title: 'I spend my energy on work that matters to me.',
    description:
      'Working on problems, ideas, or a craft that you care about, rather than executing someone else’s agenda.',
    reflectionPrompt:
      'What kind of work would you choose to spend your energy on if you had the choice?',
    placeholder: 'I want my working hours to be filled with...',
  },
  {
    id: 'financial_upside',
    title: 'My earnings reflect what I build, not a fixed salary.',
    description:
      'Removing the ceiling on your income and building equity or an asset that belongs to you.',
    reflectionPrompt:
      'What would uncapped earnings or building equity unlock for you?',
    placeholder: 'Earning directly from the value I create would mean...',
  },
  {
    id: 'presence_family',
    title: 'I am more present for the people in my life.',
    description:
      'Being able to show up for your family, partner, children, or friends without work constantly draining your energy.',
    reflectionPrompt:
      'Who in your life do you want more focus, presence, and energy for?',
    placeholder: 'I want to be able to show up consistently for...',
  },
  {
    id: 'creative_pride',
    title: 'I have the pride of building something real.',
    description:
      'Taking an idea out of your head and creating something in the world that people actually use and value.',
    reflectionPrompt:
      'What would having something you built out in the real world mean to you?',
    placeholder: 'Having something I built in the world would prove to me that...',
  },
  {
    id: 'energy_fulfillment',
    title: 'I end the day feeling energized instead of depleted.',
    description:
      'Finishing work with momentum and accomplishment rather than exhaustion and frustration.',
    reflectionPrompt:
      'What do you want to feel when you step away from work at the end of the day?',
    placeholder: 'I want to finish a day of work feeling...',
  },
];

export function FutureStateExplorer({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);

  if (!contextState.isHydrated) {
    return (
      <div className="flex items-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading your responses...</span>
      </div>
    );
  }

  // 1. Restore saved items, with backward compatibility for legacy free-text reflection
  const desiredFutureData = contextState.userContext?.desired_future as Record<string, any> | undefined;
  const legacyText = desiredFutureData?.reflection ?? (progress.payload?.reflection as string | undefined);
  const structuredChanges = (desiredFutureData?.changes as ReflectiveItem[] | undefined) ?? (progress.payload?.changes as ReflectiveItem[] | undefined);

  let initialItems: ReflectiveItem[] = [];

  if (Array.isArray(structuredChanges) && structuredChanges.length > 0) {
    initialItems = structuredChanges;
  } else if (typeof legacyText === 'string' && legacyText.trim().length > 0) {
    initialItems = [
      {
        id: 'custom_legacy',
        title: 'What will change in my life',
        reflection: legacyText.trim(),
        isPrimary: true,
        isCustom: true,
      },
    ];
  }

  const isCompleted = progress.completed === true || initialItems.length > 0;

  // 2. Action submission handler
  async function handleSubmit(items: ReflectiveItem[]) {
    const primaryItem = items.find((i) => i.isPrimary) ?? items[0];
    const primaryReflection = primaryItem?.reflection ?? '';

    // Persist both the structured array and the primary reflection for downstream components
    const result = await updateUserProgramContext({
      desired_future: {
        changes: items,
        reflection: primaryReflection,
      },
    });

    userContextActions.updateContextLocally(result.userContext);

    await onComplete({
      changes: items,
      reflection: primaryReflection,
      completed: true,
    });
  }

  // 3. Quick continue when revisiting without modifications
  async function handleContinueWithoutChanges() {
    const primaryItem = initialItems.find((i) => i.isPrimary) ?? initialItems[0];
    await onComplete({
      changes: initialItems,
      reflection: primaryItem?.reflection ?? '',
      completed: true,
    });
  }

  return (
    <ReflectiveOptionGrid
      title={node.title}
      introParagraphs={[
        "You have looked at what gets in your way and what keeps pulling you back. Now imagine that you've started something of your own.",
        "Picture an ordinary day a little further down the road. What will be different about how you spend your time, who you work with, and how you feel at the end of the day?",
        'Choose any statements that reflect the changes you actually want, or describe your own in your own words.',
      ]}
      options={futurePresets}
      initialItems={initialItems}
      isCompleted={isCompleted}
      entityLabel="change"
      primaryBadgeLabel="Most meaningful change"
      prioritizePrompt="Which of these changes matters most to you?"
      prioritizeSubtext="If your business works, many things will shift. But choose the single outcome that would make all the effort and uncertainty feel worthwhile."
      customPromptLabel="What else would be different for you?"
      customPromptPlaceholder="e.g. I want to build a business that lets my partner leave their job..."
      onSubmit={handleSubmit}
      onContinueWithoutChanges={handleContinueWithoutChanges}
    />
  );
}