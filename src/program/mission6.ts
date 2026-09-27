// src/program/mission6.ts
import type { ProgramMission } from './types';

export const mission6: ProgramMission = {
  key: 'm6',
  version: 2,
  title: 'Run the Business',
  sequence: 6,

  question: 'Can I run this business, learn from what happens, and decide what to do next?',

  description:
    'Run the business through a focused 90-day cycle, keep a small set of important signals visible, learn from what happens, run useful experiments, and decide what comes next.',

  transformation: {
    from: 'I have built a business that can operate.',
    to: 'I have run it in the real world, learned what works, and know what I want to do next.',
  },

  setup: {
    key: 'm6-setup',
    sequence: 1,
    role: 'setup',
    title: 'From building to running',
    intent:
      'Orient the user to the shift from building the minimum business system to operating it in the real world. Bring forward the project history, M5 alpha evidence, current business context and the first operating cycle.',
    component: 'operations_starting_point',
    dependencies: ['m5-reveal'],
  },

  quests: [
    {
      key: 'q1',
      sequence: 1,
      title: 'Set Your Direction',
      description:
        'Decide what you want from the next 90 days and choose the small set of numbers that will help you see what is happening.',
      nodes: [
        {
          key: 'm6-q1-setup',
          sequence: 1,
          role: 'setup',
          title: 'What are you trying to achieve?',
          intent:
            'Move from simply having a live business to deciding what this particular 90-day period is for.',
          component: 'operations_direction_setup',
          dependencies: ['m6-setup'],
        },
        {
          key: 'm6-q1-goals',
          sequence: 2,
          role: 'investigation',
          title: 'Set your 90-day goals.',
          intent:
            'Help the user define a small number of meaningful goals across business, customers, financial outcomes, product or service, and founder constraints where relevant.',
          component: 'operations_goals',
          dependencies: ['m6-q1-setup'],
        },
        {
          key: 'm6-q1-metrics',
          sequence: 3,
          role: 'investigation',
          title: 'Choose the numbers that matter.',
          intent:
            'Choose approximately 5–8 core metrics appropriate to the business model and current goals, without creating a reporting burden.',
          component: 'operations_metrics',
          dependencies: ['m6-q1-goals'],
        },
        {
          key: 'm6-q1-reveal',
          sequence: 4,
          role: 'reveal',
          title: 'Your operating focus',
          intent:
            'Bring the goals, definition of success, core metrics and current focus together so the user can see what this 90-day cycle is actually about.',
          component: 'operations_focus_reveal',
          dependencies: ['m6-q1-metrics'],
        },
        {
          key: 'm6-q1-action',
          sequence: 5,
          role: 'action',
          title: 'Start the 90-day cycle.',
          intent:
            'Start the first operating cycle with the chosen goals, metrics, focus and review rhythm.',
          component: 'operations_cycle_start',
          dependencies: ['m6-q1-reveal'],
        },
      ],
    },

    {
      key: 'q2',
      sequence: 2,
      title: 'Set Up Your Operating System',
      description:
        'Decide what Urge should hold, what should stay in your existing tools, and create a simple view of the business that you can actually use.',
      nodes: [
        {
          key: 'm6-q2-setup',
          sequence: 1,
          role: 'setup',
          title: 'Urge does not need to run your business.',
          intent:
            'Make clear that Urge sits around the business tools rather than replacing accounting, CRM, payments, marketing automation, project management, support or other operational systems.',
          component: 'operations_stack_setup',
          dependencies: ['m6-q1-action'],
        },
        {
          key: 'm6-q2-stack',
          sequence: 2,
          role: 'investigation',
          title: 'Set up your business stack.',
          intent:
            'Record the external tools and systems the user uses to operate the business, while allowing them to keep existing tools or choose optional starter kits.',
          component: 'operations_stack',
          dependencies: ['m6-q2-setup'],
        },
        {
          key: 'm6-q2-templates',
          sequence: 3,
          role: 'investigation',
          title: 'Use the templates you need.',
          intent:
            'Let the user choose lightweight templates for financial management, marketing, sales, operations, customer management, planning and reviews without forcing those workflows into Urge.',
          component: 'operations_templates',
          dependencies: ['m6-q2-stack'],
        },
        {
          key: 'm6-q2-dashboard',
          sequence: 4,
          role: 'investigation',
          title: 'Set up your operations dashboard.',
          intent:
            'Create the focused operating view for the cycle: goals, core metrics, current focus, important signals, experiments, decisions and review history.',
          component: 'operations_dashboard_setup',
          dependencies: ['m6-q2-templates'],
        },
        {
          key: 'm6-q2-reveal',
          sequence: 5,
          role: 'reveal',
          title: 'Your business at a glance.',
          intent:
            'Show a focused operating picture that separates useful signals from operational noise and makes the current focus visible.',
          component: 'operations_dashboard_reveal',
          dependencies: ['m6-q2-dashboard'],
        },
      ],
    },

    {
      key: 'q3',
      sequence: 3,
      title: 'Operate, Measure, Learn',
      description:
        'Use a lightweight rhythm to focus, observe the business, learn from what happens and run focused experiments.',
      nodes: [
        {
          key: 'm6-q3-setup',
          sequence: 1,
          role: 'setup',
          title: 'Do not confuse activity with progress.',
          intent:
            'Establish the recurring operating loop: focus, operate, measure, observe, learn, experiment and decide.',
          component: 'operations_loop_setup',
          dependencies: ['m6-q2-reveal'],
        },
        {
          key: 'm6-q3-focus',
          sequence: 2,
          role: 'investigation',
          title: 'Choose your focus.',
          intent:
            'At each weekly check-in, help the user choose one to three priorities that matter most to the current goals and business situation.',
          component: 'operations_weekly_focus',
          dependencies: ['m6-q3-setup'],
        },
        {
          key: 'm6-q3-review',
          sequence: 3,
          role: 'investigation',
          title: 'Review what happened.',
          intent:
            'Capture the important operating signals for the period: metric changes, progress against goals, customer activity, revenue, costs, cash where available, blockers, observations, experiment progress and decisions.',
          component: 'operations_periodic_review',
          dependencies: ['m6-q3-focus'],
        },
        {
          key: 'm6-q3-experiment',
          sequence: 4,
          role: 'investigation',
          title: 'Run a focused experiment.',
          intent:
            'Use accumulated project context to identify useful experiments. Let the founder decide whether to run one and define what evidence would make the test meaningful.',
          component: 'operations_experiment',
          dependencies: ['m6-q3-review'],
        },
        {
          key: 'm6-q3-reveal',
          sequence: 5,
          role: 'reveal',
          title: 'What is the business telling you?',
          intent:
            'Synthesize the operating evidence without turning signals into automatic conclusions. Show what changed, what may deserve attention, what was learned and what remains uncertain.',
          component: 'operations_learning_reveal',
          dependencies: ['m6-q3-experiment'],
        },
        {
          key: 'm6-q3-action',
          sequence: 6,
          role: 'action',
          title: 'What do you want to do with that?',
          intent:
            'Record the meaningful next decision, continue the current focus, create follow-up work or define the next experiment based on what was learned.',
          component: 'operations_next_action',
          dependencies: ['m6-q3-reveal'],
        },
      ],
    },

    {
      key: 'q4',
      sequence: 4,
      title: '90-Day Review',
      description:
        'Step back from the day-to-day and look at the business you actually ran, what you learned and what you want from it next.',
      nodes: [
        {
          key: 'm6-q4-setup',
          sequence: 1,
          role: 'setup',
          title: 'Three months gives you something to work with.',
          intent:
            'Bring the first 90-day operating history together so the user can review the business as it actually behaved rather than relying on memory.',
          component: 'operations_90_day_setup',
          dependencies: ['m6-q3-action'],
        },
        {
          key: 'm6-q4-review',
          sequence: 2,
          role: 'investigation',
          title: 'Review your first 90 days.',
          intent:
            'Review original goals, actual results, metric trends, customers, revenue, costs, cash where available, experiments, business changes and important evidence.',
          component: 'operations_90_day_review',
          dependencies: ['m6-q4-setup'],
        },
        {
          key: 'm6-q4-reflection',
          sequence: 3,
          role: 'investigation',
          title: 'What did you learn?',
          intent:
            'Give the founder space to reflect on customers, market, what worked, what did not, what surprised them, what they would do differently, what remains uncertain and what they want from the business next.',
          component: 'operations_90_day_reflection',
          dependencies: ['m6-q4-review'],
        },
        {
          key: 'm6-q4-reveal',
          sequence: 4,
          role: 'reveal',
          title: 'See the business you have built.',
          intent:
            'Synthesize the 90-day operating history into a clear picture of results, evidence, experiments, learning, decisions and unresolved questions.',
          component: 'operations_90_day_reveal',
          dependencies: ['m6-q4-reflection'],
        },
        {
          key: 'm6-q4-action',
          sequence: 5,
          role: 'action',
          title: 'Choose what comes next.',
          intent:
            "Record the founder's next direction for the business and route the project into another operating cycle, targeted earlier-mission work, or closure.",
          component: 'operations_90_day_action',
          dependencies: ['m6-q4-reveal'],
        },
      ],
    },
  ],

  reveal: {
    key: 'm6-reveal',
    sequence: 1,
    role: 'reveal',
    title: 'You ran a real business.',
    intent:
      'Show the complete journey from building the business to operating it, learning from reality, running experiments and making a deliberate next decision.',
    component: 'mission_transformation_synthesis',
  },

};
