import type { ProgramMission } from './types.js';

export const mission2: ProgramMission = {
  key: 'mission-2',
  version: 2,
  title: 'Discover Opportunities',
  sequence: 2,

  question: 'What problems are worth building a business around?',

  description:
    'You do not need to invent a brilliant business idea. You need to learn to notice problems, look closer, talk to people, and choose something worth working on.',

  transformation: {
    from: 'Looking for a business idea.',
    to: 'Seeing, investigating and choosing a problem worth working on.',
  },

  setup: {
    key: 'm2-setup',
    sequence: 1,
    role: 'setup',
    title: 'Where are you starting from?',
    intent:
      'Bring forward the user’s M1 idea, interests, experience and starting context without deciding whether the idea is good.',
    component: 'opportunity_starting_point',
    dependencies: ['m1-reveal'],
  },

  quests: [
    {
      key: 'q1',
      sequence: 1,
      title: 'Find Problems',
      description:
        'Stop trying to manufacture ideas. Pay attention to problems that are already happening around you.',
      nodes: [
        {
          key: 'm2-q1-setup',
          sequence: 1,
          role: 'setup',
          title: 'Where do opportunities come from?',
          intent:
            'Reframe opportunity discovery around noticing problems rather than brainstorming business ideas.',
          component: 'problem_observation_setup',
          dependencies: ['m2-setup'],
        },
        {
          key: 'm2-q1-investigation',
          sequence: 2,
          role: 'investigation',
          title: 'Start paying attention.',
          intent:
            'Give the user practical observation lenses and a simple way to capture real problems as evidence.',
          component: 'observation_investigation',
          dependencies: ['m2-q1-setup'],
        },
        {
          key: 'm2-q1-reveal',
          sequence: 3,
          role: 'reveal',
          title: 'Look at what keeps showing up.',
          intent:
            'Surface recurring problems, patterns and clusters across the user’s observations without deciding what matters for them.',
          component: 'observation_patterns_reveal',
          dependencies: ['m2-q1-investigation'],
        },
        {
          key: 'm2-q1-action',
          sequence: 4,
          role: 'action',
          title: 'Which problems are worth exploring?',
          intent:
            'Let the user decide which observed problems deserve another look and explicitly turn selected patterns into opportunities.',
          component: 'opportunity_cluster_action',
          dependencies: ['m2-q1-reveal'],
        },
      ],
    },

    {
      key: 'q2',
      sequence: 2,
      title: 'Pressure-Test Opportunities',
      description:
        'Take the problems you noticed and look more closely. What do you actually know, and what are you still guessing?',
      nodes: [
        {
          key: 'm2-q2-setup',
          sequence: 1,
          role: 'setup',
          title: 'Which opportunities are worth investigating?',
          intent:
            'Set up a comparison mindset: not every interesting problem deserves the same amount of attention.',
          component: 'opportunity_evaluation_setup',
          dependencies: ['m2-q1-action'],
        },
        {
          key: 'm2-q2-investigation',
          sequence: 2,
          role: 'investigation',
          title: 'Pressure-test what you know.',
          intent:
            'Guide secondary research and transparent evaluation of each opportunity while keeping evidence separate from assumptions.',
          component: 'opportunity_evaluation',
          dependencies: ['m2-q2-setup'],
        },
        {
          key: 'm2-q2-reveal',
          sequence: 3,
          role: 'reveal',
          title: 'See what you actually know.',
          intent:
            'Show each opportunity with its supporting evidence, unknowns and user-entered evaluation so comparisons are grounded rather than impressionistic.',
          component: 'opportunity_comparison',
          dependencies: ['m2-q2-investigation'],
        },
        {
          key: 'm2-q2-action',
          sequence: 4,
          role: 'action',
          title: 'Choose the ones worth taking further.',
          intent:
            'Let the user shortlist up to three opportunities and optionally create tasks for important unknowns.',
          component: 'shortlist_opportunities',
          dependencies: ['m2-q2-reveal'],
        },
      ],
    },

    {
      key: 'q3',
      sequence: 3,
      title: 'Talk to People',
      description:
        'Research can tell you a lot. But eventually you have to hear from the people who actually live with the problem.',
      nodes: [
        {
          key: 'm2-q3-setup',
          sequence: 1,
          role: 'setup',
          title: 'The research is not enough. What do real people say?',
          intent:
            'Move the user from researching the problem to listening directly to people who experience it.',
          component: 'customer_qualification_setup',
          dependencies: ['m2-q2-action'],
        },
        {
          key: 'm2-q3-investigation',
          sequence: 2,
          role: 'investigation',
          title: 'Talk to five people.',
          intent:
            'Help the user select or add people, conduct conversations and capture evidence about the problem, current solutions, severity and existing spend.',
          component: 'customer_interviews',
          dependencies: ['m2-q3-setup'],
        },
        {
          key: 'm2-q3-reveal',
          sequence: 3,
          role: 'reveal',
          title: 'What changed when you heard it from them?',
          intent:
            'Compare earlier research and assumptions with what people actually said, making confirmed, contradicted, unclear and newly discovered signals visible.',
          component: 'customer_evidence_reveal',
          dependencies: ['m2-q3-investigation'],
        },
        {
          key: 'm2-q3-action',
          sequence: 4,
          role: 'action',
          title: 'Which opportunity will you work on?',
          intent:
            'Let the user choose one opportunity to work on next and turn it into a project without pretending the opportunity is validated.',
          component: 'select_testing_opportunity',
          dependencies: ['m2-q3-reveal'],
        },
      ],
    },
  ],

  reveal: {
    key: 'm2-reveal',
    sequence: 1,
    role: 'reveal',
    title: 'You are no longer looking for ideas.',
    intent:
      'Show the journey from noticing problems to creating opportunities, researching them, talking to people and choosing one to work on.',
    component: 'mission_transformation_synthesis',
  },

};
