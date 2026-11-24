import type { ProgramMission } from './types';

/**
 * Mission 5 — Build, Alpha Test & Launch
 *
 * Non-sequential execution phase:
 *   - Q1: Setup + Non-sequential Build Dashboard (/program/build)
 *   - Q2: Alpha Test with first real buyers (alpha_delivery_test experiment)
 *   - Q3: Fix alpha friction, launch on winning channel & log initial revenue
 */
export const mission5: ProgramMission = {
  key: 'mission-5',
  version: 2,
  title: 'Build, Test & Launch',
  sequence: 5,

  question: 'Can I build v1 fast, deliver the promise, and make my first real sales?',

  description:
    'Assemble your Minimum Sellable Product in the Build Workspace, test real delivery with 3–5 early buyers, fix what breaks, and launch on your winning channel.',

  transformation: {
    from: 'I have a validated offer, price, and build checklist.',
    to: 'My v1 offer is live, tested with real buyers, and generating initial revenue.',
  },

  setup: {
    key: 'm5-setup',
    sequence: 1,
    role: 'setup',
    title: 'Build only what you promised in v1.',
    description: `You have your One-Page Working Blueprint and finalized v1 build checklist. Resist the urge to add features you already cut in Mission 4.

Use the Build Workspace to work across product, marketing, payments, and costs in whatever order makes sense—then mark your build ready for Alpha testing.`,
    intent:
      'Orient the founder around v1 scope discipline, budget/time guardrails, and the non-sequential Build Workspace.',
    component: 'build_starting_point',
    dependencies: ['m4-action'],
  },

  quests: [
    // -------------------------------------------------------------------------
    // Quest 1 — Build v1 (Non-Sequential Workspace)
    // -------------------------------------------------------------------------
    {
      key: 'q1',
      sequence: 1,
      title: 'Build Your Minimum Sellable v1',
      description:
        'Work through your v1 product, marketing pipeline, and payment setup in the Build Workspace.',
      nodes: [
        {
          key: 'm5-q1-build',
          sequence: 1,
          role: 'action',
          title: 'Assemble v1 in the Build Workspace.',
          description: `Open your dedicated Build Workspace to track tasks, costs, time, marketing assets, and payment setup. When your v1 is ready for real buyers, click "Build complete — ready to test."`,
          prompt: 'Is your v1 build ready to put in front of Alpha buyers?',
          intent:
            'Links to /program/build non-sequential workspace and completes once the founder marks their build ready to test.',
          component: 'build_workspace_entry',
          dependencies: ['m5-setup'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 2 — Alpha Test (Experiment)
    // -------------------------------------------------------------------------
    {
      key: 'q2',
      sequence: 2,
      title: 'Alpha Test with Early Buyers',
      description:
        'Deliver your v1 offer to 3–5 early buyers and verify that it works in the real world.',
      nodes: [
        {
          key: 'm5-q2-alpha',
          sequence: 1,
          role: 'investigation',
          title: 'Run your Founding Alpha Test.',
          description: `Invite 3–5 warm or committed buyers from Missions 3 and 4. Deliver your v1 offer, log how many get the promised result, and record where delivery slows down or confuses them.`,
          prompt: 'How did real delivery go with your first Alpha buyers?',
          intent:
            'Runs and logs the alpha_delivery_test experiment in user_experiments.',
          component: 'alpha_test_experiment',
          dependencies: ['m5-q1-build'],
          pacing: { delay_days: 5 },
        },
        {
          key: 'm5-q2-read',
          sequence: 2,
          role: 'reveal',
          title: 'What your Alpha test revealed.',
          description: `Separate real product/delivery blockers from minor polish so you know what must be fixed before opening your doors wider.`,
          intent:
            'Reviews Alpha delivery outcomes, actual hours spent vs M4 estimate, and buyer friction.',
          component: 'alpha_signal_read',
          dependencies: ['m5-q2-alpha'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 3 — Launch
    // -------------------------------------------------------------------------
    {
      key: 'q3',
      sequence: 3,
      title: 'Launch & Make First Sales',
      description:
        'Fix the top friction from Alpha, open your winning acquisition channel, and log your launch traction.',
      nodes: [
        {
          key: 'm5-q3-launch',
          sequence: 1,
          role: 'action',
          title: 'Go live & log your first launch sales.',
          description: `Ship your top Alpha fixes, publish your offer on your winning channel from Mission 4, and log your initial launch inquiries, paying customers, and revenue.`,
          prompt: 'What happened when you opened v1 to the public?',
          intent:
            'Captures go-live readiness, initial launch orders/revenue, and prepares transition to Mission 6 Operate.',
          component: 'launch_execution',
          dependencies: ['m5-q2-read'],
        },
      ],
    },
  ],

  reveal: {
    key: 'm5-reveal',
    sequence: 1,
    role: 'reveal',
    title: 'You built and launched a real business.',
    intent:
      'Summarizes the transformation from working blueprint to live product, real buyers, and verified delivery economics.',
    component: 'mission5_synthesis',
    dependencies: ['m5-q3-launch'],
  },

  action: {
    key: 'm5-action',
    sequence: 2,
    role: 'action',
    title: 'Step into daily operations.',
    description: `Your offer is live and tested. Move into your Operate Workspace to manage ongoing customers, cash flow, and repeatable growth.`,
    prompt: 'Ready to move into the Operate Workspace?',
    intent:
      'Transitions the founder into Mission 6 and /program/operate.',
    component: 'mission5_action',
    dependencies: ['m5-reveal'],
  },
};