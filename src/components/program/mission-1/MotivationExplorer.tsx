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

const motivationOptions: ReflectiveOptionPreset[] = [
  {
    id: 'independence',
    title: 'I want more control over my work.',
    description:
      'Having more say in what you work on, how you work, and who you work with.',
    reflectionPrompt:
      'What does autonomy actually mean for how you would spend a normal day?',
    placeholder: 'I want more control because right now...',
  },
  {
    id: 'frustration',
    title: 'I cannot let go of a problem that bothers me.',
    description:
      'A friction, inefficiency, or unfairness that keeps pulling your attention.',
    reflectionPrompt:
      'Why has this particular problem stuck with you when others haven’t?',
    placeholder: 'This keeps bothering me because I see people...',
  },
  {
    id: 'possibility',
    title: 'I keep seeing something that could exist.',
    description:
      'An idea, product, or distinct way of doing something that you keep imagining.',
    reflectionPrompt:
      'What is the thing you can see clearly that isn’t in the world yet?',
    placeholder: 'I keep picturing a way to...',
  },
  {
    id: 'lifestyle',
    title: 'I want a different way to live or work.',
    description:
      'Current work rhythms, energy levels, or environment do not align with how you want to live.',
    reflectionPrompt:
      'What would starting something change about the rhythm of your life?',
    placeholder: 'I want my day-to-day life to feel more...',
  },
  {
    id: 'impact',
    title: 'I want to make a difference for someone.',
    description:
      'A specific person, community, or customer group whose lives you want to improve.',
    reflectionPrompt:
      'Who specifically do you want to help, and why do you care?',
    placeholder: 'I care about this group of people because...',
  },
  {
    id: 'self_belief',
    title: 'I want to prove something to myself.',
    description:
      'Testing your capability to turn an intention into a real, functioning outcome.',
    reflectionPrompt:
      'What would following through on this prove to you about yourself?',
    placeholder: 'Starting this would show me that I can...',
  },
];

export function MotivationExplorer({
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

  // 2. Read saved motivations from userContext, falling back to progress payload
  const savedMotivations =
    (contextState.userContext?.motivations as Record<string, any>)?.motivations ??
    (progress.payload?.motivations as ReflectiveItem[]) ??
    [];

  const isCompleted = progress.completed === true || savedMotivations.length > 0;

  // 3. Action submission handler
  async function handleSubmit(items: ReflectiveItem[]) {
    // Persist to user_program_context
    const result = await updateUserProgramContext({
      motivations: { motivations: items },
    });

    // Sync Nanostore immediately
    userContextActions.updateContextLocally(result.userContext);

    // Complete node
    await onComplete({
      motivations: items,
      completed: true,
    });
  }

  // 4. Quick continue if revisiting without editing
  async function handleContinueWithoutChanges() {
    await onComplete({
      motivations: savedMotivations,
      completed: true,
    });
  }

  return (
    <ReflectiveOptionGrid
      title={node.title}
      introParagraphs={[
        'You have already looked at what gets in your way. Now look in the other direction.',
        'What keeps bringing you back to this idea or possibility? What makes you want to start, even when part of you wants to stay where you are?',
        'Choose any statements that feel familiar, or add your own in your own words. When you select one, write what it actually means to you.',
      ]}
      options={motivationOptions}
      initialItems={savedMotivations}
      isCompleted={isCompleted}
      entityLabel="motivation"
      primaryBadgeLabel="Core motivation"
      prioritizePrompt="Which of these is your strongest pull right now?"
      prioritizeSubtext="Several of these may be true for you, but usually one is the real driver beneath the surface. Choose the core reason that keeps pulling you toward starting."
      customPromptLabel="What else keeps pulling you toward starting?"
      customPromptPlaceholder="e.g. I want to build something my children can look up to..."
      onSubmit={handleSubmit}
      onContinueWithoutChanges={handleContinueWithoutChanges}
    />
  );
}