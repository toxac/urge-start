
export type HabitCategory =
  | 'courage'
  | 'observation'
  | 'curiosity'
  | 'connection'
  | 'experimentation'
  | 'reflection'
  | 'consistency';

export type HabitTriggerType =
  | 'daily'
  | 'situation'
  | 'event';

export type HabitDefinition = {
  id: string;
  title: string;
  description: string;
  category: HabitCategory;
  image: string;

  action: string;
  trigger: {
    type: HabitTriggerType;
    description: string;
  };

  purpose: string;
  suggestedMissions: number[];
  recurrence: 'daily' | 'weekly';
  durationDays: number;
};

export const HABIT_CATEGORIES: Record<
  HabitCategory,
  {
    label: string;
    description: string;
  }
> = {
  courage: {
    label: 'Courage',
    description: 'Act even when something feels uncomfortable.',
  },
  observation: {
    label: 'Observation',
    description: 'Notice what is happening before reacting.',
  },
  curiosity: {
    label: 'Curiosity',
    description: 'Ask questions instead of making assumptions.',
  },
  connection: {
    label: 'Connection',
    description: 'Reach out, build relationships, and ask for help.',
  },
  experimentation: {
    label: 'Experimentation',
    description: 'Learn by taking small, practical steps.',
  },
  reflection: {
    label: 'Reflection',
    description: 'Recognise patterns and learn from experience.',
  },
  consistency: {
    label: 'Consistency',
    description: 'Keep moving through small, repeatable actions.',
  },
};

export const HABITS: HabitDefinition[] = [
  {
    id: 'one_sentence_intention',
    title: 'Set a one-sentence intention',
    description:
      'Decide what matters today before other things take over.',
    category: 'consistency',
    image: '/images/habits/one-sentence-intention.webp',
    action:
      'Complete: Today I will ___ to move towards ___.',
    trigger: {
      type: 'daily',
      description: 'After your morning tea or coffee',
    },
    purpose: 'Create clarity and reduce overwhelm.',
    suggestedMissions: [1, 2, 3, 4, 5, 6],
    recurrence: 'daily',
    durationDays: 7,
  },
  {
    id: 'fear_to_step',
    title: 'Turn fear into a small step',
    description:
      'Use fear as a signal to find a manageable next move.',
    category: 'courage',
    image: '/images/habits/fear-to-step.webp',
    action:
      'Name the fear. Then write down the smallest action you can take.',
    trigger: {
      type: 'situation',
      description: 'When you notice resistance or hesitation',
    },
    purpose: 'Reduce avoidance and make uncertainty easier to face.',
    suggestedMissions: [1, 2, 3, 4, 5],
    recurrence: 'daily',
    durationDays: 7,
  },
  {
    id: 'two_minute_start',
    title: 'Make a two-minute start',
    description:
      'You do not need to finish the task. Just make a start.',
    category: 'experimentation',
    image: '/images/habits/two-minute-start.webp',
    action:
      'Work on the task you are avoiding for just two minutes.',
    trigger: {
      type: 'situation',
      description: 'When you catch yourself putting something off',
    },
    purpose: 'Reduce the gap between deciding and doing.',
    suggestedMissions: [1, 3, 4, 5, 6],
    recurrence: 'daily',
    durationDays: 7,
  },
  {
    id: 'one_customer_touch',
    title: 'Make one customer connection',
    description:
      'Learn something from a real person instead of guessing.',
    category: 'connection',
    image: '/images/habits/one-customer-touch.webp',
    action:
      'Send one message, ask one question, or have one conversation.',
    trigger: {
      type: 'daily',
      description: 'After lunch or during your workday',
    },
    purpose: 'Build customer understanding and reduce isolation.',
    suggestedMissions: [2, 3, 4, 5, 6],
    recurrence: 'daily',
    durationDays: 7,
  },
  {
    id: 'evidence_log',
    title: 'Keep an evidence log',
    description:
      'Give yourself a fair view of what is actually happening.',
    category: 'reflection',
    image: '/images/habits/evidence-log.webp',
    action:
      'Write down three small wins, lessons, or signs of progress.',
    trigger: {
      type: 'daily',
      description: 'Before bed or at the end of your workday',
    },
    purpose: 'Build confidence from evidence rather than feelings alone.',
    suggestedMissions: [1, 3, 4, 5, 6],
    recurrence: 'daily',
    durationDays: 7,
  },
  {
    id: 'limiting_belief_reframe',
    title: 'Reframe a limiting belief',
    description:
      'Replace a fixed conclusion with something you can learn or test.',
    category: 'reflection',
    image: '/images/habits/limiting-belief-reframe.webp',
    action:
      'Turn “I cannot do this” into “What could I learn or try?”',
    trigger: {
      type: 'situation',
      description: 'When you notice self-doubt or negative self-talk',
    },
    purpose: 'Make room for learning instead of self-judgment.',
    suggestedMissions: [1, 2, 3, 4, 5],
    recurrence: 'daily',
    durationDays: 7,
  },
  {
    id: 'ask_for_help',
    title: 'Ask for a little help',
    description:
      'You do not have to figure everything out on your own.',
    category: 'connection',
    image: '/images/habits/ask-for-help.webp',
    action:
      'Ask someone for advice, feedback, an introduction, or support.',
    trigger: {
      type: 'daily',
      description: 'When planning your day or facing a roadblock',
    },
    purpose: 'Build connections and make better use of available resources.',
    suggestedMissions: [1, 2, 3, 4, 5, 6],
    recurrence: 'weekly',
    durationDays: 7,
  },
  {
    id: 'top_one_shutdown',
    title: 'Choose tomorrow’s first step',
    description:
      'End today knowing exactly where you can begin tomorrow.',
    category: 'consistency',
    image: '/images/habits/tomorrows-first-step.webp',
    action:
      'Write down the first small action you will take tomorrow.',
    trigger: {
      type: 'event',
      description: 'When you finish work for the day',
    },
    purpose: 'Reduce decision fatigue and make starting easier.',
    suggestedMissions: [1, 4, 5, 6],
    recurrence: 'daily',
    durationDays: 7,
  },
  {
    id: 'energy_anchor',
    title: 'Take a five-minute reset',
    description:
      'Look after your energy instead of pushing through every slump.',
    category: 'consistency',
    image: '/images/habits/five-minute-reset.webp',
    action:
      'Drink water, stretch, or take a short walk.',
    trigger: {
      type: 'situation',
      description: 'When your energy dips or your attention wanders',
    },
    purpose: 'Make sustainable effort easier.',
    suggestedMissions: [1, 4, 5, 6],
    recurrence: 'daily',
    durationDays: 7,
  },
  {
    id: 'comparison_pause',
    title: 'Pause the comparison',
    description:
      'Bring your attention back to your own journey.',
    category: 'reflection',
    image: '/images/habits/comparison-pause.webp',
    action:
      'Step away from the comparison and reconnect with why you started.',
    trigger: {
      type: 'situation',
      description: 'When someone else’s progress makes you doubt yours',
    },
    purpose: 'Protect focus and reduce unhelpful comparison.',
    suggestedMissions: [1, 4, 5, 6],
    recurrence: 'daily',
    durationDays: 7,
  },
  {
    id: 'celebrate_completion',
    title: 'Celebrate the small win',
    description:
      'Notice the action you took instead of immediately moving on.',
    category: 'reflection',
    image: '/images/habits/celebrate-small-win.webp',
    action:
      'Pause, smile, or say “I did it” after completing a small step.',
    trigger: {
      type: 'event',
      description: 'Immediately after completing a small action',
    },
    purpose: 'Reinforce progress and make effort feel worthwhile.',
    suggestedMissions: [1, 3, 4, 5, 6],
    recurrence: 'daily',
    durationDays: 7,
  },
  {
    id: 'learn_and_apply',
    title: 'Turn learning into action',
    description:
      'Make sure what you learn changes what you do.',
    category: 'experimentation',
    image: '/images/habits/learn-and-apply.webp',
    action:
      'After learning something, write one thing you could try in practice.',
    trigger: {
      type: 'event',
      description: 'After reading, watching, or listening to something useful',
    },
    purpose: 'Prevent endless preparation without action.',
    suggestedMissions: [1, 2, 3, 4, 5, 6],
    recurrence: 'daily',
    durationDays: 7,
  },
  {
    id: 'self_compassion_pause',
    title: 'Give yourself a moment',
    description:
      'Respond to a difficult moment with kindness, not punishment.',
    category: 'courage',
    image: '/images/habits/self-compassion-pause.webp',
    action:
      'Pause and ask: “This is hard. What is my next small step?”',
    trigger: {
      type: 'situation',
      description: 'When you feel stuck, ashamed, or overwhelmed',
    },
    purpose: 'Recover from setbacks without giving up on yourself.',
    suggestedMissions: [1, 3, 4, 5, 6],
    recurrence: 'daily',
    durationDays: 7,
  },
];

export function getHabitById(
  id: string,
): HabitDefinition | undefined {
  return HABITS.find((habit) => habit.id === id);
}

export function getHabitsForMission(
  missionNumber: number,
): HabitDefinition[] {
  return HABITS.filter((habit) =>
    habit.suggestedMissions.includes(missionNumber),
  );
}

export function getHabitsByCategory(
  category: HabitCategory,
): HabitDefinition[] {
  return HABITS.filter((habit) => habit.category === category);
}
