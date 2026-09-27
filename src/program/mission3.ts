// src/program/mission3.ts
import type { ProgramMission } from './types.js';

export const mission3: ProgramMission = {
  key: 'mission-3',
  version: 2,
  title: 'Put It to the Test',
  sequence: 3,

  question: 'Will real people actually act on this problem being solved?',

  description:
    'Turn the selected opportunity into something a real person can say yes to, put it in front of the market, and learn from what people actually do.',

  transformation: {
    from: 'I have an opportunity I think might be worth pursuing.',
    to: 'I have put a concrete offer in front of real people and have evidence about how the market responded.',
  },

  setup: {
    key: 'm3-setup',
    sequence: 1,
    role: 'setup',
    title: 'What are you going to work on?',
    intent:
      'Orient the user around the project created in M2 and bring forward the opportunity, strongest evidence, people and unresolved questions that matter now.',
    component: 'project_starting_point',
    dependencies: ['m2-reveal'],
  },

  quests: [
    {
      key: 'q1',
      sequence: 1,
      title: 'Build the Offer',
      description:
        'Turn the problem into something concrete. If someone said yes today, what exactly would you do for them?',
      nodes: [
        {
          key: 'm3-q1-setup',
          sequence: 1,
          role: 'setup',
          title: 'What could you actually offer?',
          intent:
            'Create tension between understanding a problem and being able to make a concrete promise that can be fulfilled.',
          component: 'offer_groundwork_setup',
          dependencies: ['m3-setup'],
        },
        {
          key: 'm3-q1-outcome',
          sequence: 2,
          role: 'investigation',
          title: 'What outcome are you offering?',
          intent:
            'Define the result the customer wants, the pain relieved, the gain created and the emotional payoff.',
          component: 'offer_outcome',
          dependencies: ['m3-q1-setup'],
        },
        {
          key: 'm3-q1-delivery',
          sequence: 3,
          role: 'investigation',
          title: 'How will you deliver it?',
          intent:
            'Choose the simplest credible way to deliver the promised outcome if someone says yes tomorrow.',
          component: 'offer_delivery',
          dependencies: ['m3-q1-outcome'],
        },
        {
          key: 'm3-q1-mvo',
          sequence: 4,
          role: 'investigation',
          title: 'What can you deliver tomorrow?',
          intent:
            'Define the smallest version of the offer that can actually be fulfilled if someone says yes now.',
          component: 'minimum_viable_offer',
          dependencies: ['m3-q1-delivery'],
        },
        {
          key: 'm3-q1-pricing',
          sequence: 5,
          role: 'investigation',
          title: 'What could you charge?',
          intent:
            'Set a test price and rough delivery economics without turning this into the full M4 business model.',
          component: 'offer_pricing',
          dependencies: ['m3-q1-mvo'],
        },
        {
          key: 'm3-q1-reveal',
          sequence: 6,
          role: 'reveal',
          title: 'Can someone say yes to this?',
          intent:
            'Bring the problem, outcome, delivery, minimum viable offer and test price together as one concrete proposition.',
          component: 'offer_groundwork_reveal',
          dependencies: ['m3-q1-pricing'],
        },
        {
          key: 'm3-q1-action',
          sequence: 7,
          role: 'action',
          title: 'Make it testable.',
          intent:
            'Turn any remaining gaps in the offer into concrete tasks, or confirm that the smallest testable version is ready to take into the market-facing work.',
          component: 'offer_groundwork_action',
          dependencies: ['m3-q1-reveal'],
        },
      ],
    },

    {
      key: 'q2',
      sequence: 2,
      title: 'Make It Market-Facing',
      description:
        'Turn the offer into something you can actually put in front of another person without hiding behind more preparation.',
      nodes: [
        {
          key: 'm3-q2-setup',
          sequence: 1,
          role: 'setup',
          title: 'Why should someone care?',
          intent:
            'Frame the gap between having an offer and making it understandable and actionable to another person.',
          component: 'market_facing_offer_setup',
          dependencies: ['m3-q1-action'],
        },
        {
          key: 'm3-q2-promise',
          sequence: 2,
          role: 'investigation',
          title: 'Make the promise.',
          intent:
            'Write a clear customer-facing promise grounded in the outcome already defined.',
          component: 'offer_promise',
          dependencies: ['m3-q2-setup'],
        },
        {
          key: 'm3-q2-hook',
          sequence: 3,
          role: 'investigation',
          title: 'Give them a reason to care.',
          intent:
            'Identify the strongest evidence-grounded reason this particular person might pay attention now.',
          component: 'offer_hook',
          dependencies: ['m3-q2-promise'],
        },
        {
          key: 'm3-q2-ask',
          sequence: 4,
          role: 'investigation',
          title: 'What are you asking them to do?',
          intent:
            'Define the specific behaviour that will count as a meaningful response to the offer.',
          component: 'offer_ask',
          dependencies: ['m3-q2-hook'],
        },
        {
          key: 'm3-q2-offer',
          sequence: 5,
          role: 'investigation',
          title: 'Put the offer into one sentence.',
          intent:
            'Combine audience, problem, outcome, delivery, price and ask into something the user can actually send or say.',
          component: 'offer_statement',
          dependencies: ['m3-q2-ask'],
        },
        {
          key: 'm3-q2-reveal',
          sequence: 6,
          role: 'reveal',
          title: 'You have something to put in front of the market.',
          intent:
            'Show the complete market-facing offer as a single proposition and expose anything still unclear.',
          component: 'minimum_offer_reveal',
          dependencies: ['m3-q2-offer'],
        },
        {
          key: 'm3-q2-action',
          sequence: 7,
          role: 'action',
          title: 'Put it somewhere real.',
          intent:
            'Turn the finished offer into the minimum set of tasks/assets needed to put it in front of actual people.',
          component: 'offer_market_ready_action',
          dependencies: ['m3-q2-reveal'],
        },
      ],
    },

    {
      key: 'q3',
      sequence: 3,
      title: 'Put It to the Test',
      description:
        'Choose the cheapest credible way to ask the market to respond, then go and ask. The point is not to get a flattering answer. It is to see what people actually do.',
      nodes: [
        {
          key: 'm3-q3-setup',
          sequence: 1,
          role: 'setup',
          title: 'How will you ask the market to respond?',
          intent:
            'Frame the test as a search for meaningful behaviour rather than opinions or compliments.',
          component: 'offer_test_setup',
          dependencies: ['m3-q2-action'],
        },
        {
          key: 'm3-q3-test-selection',
          sequence: 2,
          role: 'investigation',
          title: 'Choose your test.',
          intent:
            'Select the cheapest credible test that can generate meaningful behaviour for this offer.',
          component: 'offer_test_selection',
          dependencies: ['m3-q3-setup'],
        },
        {
          key: 'm3-q3-preparation',
          sequence: 3,
          role: 'investigation',
          title: 'Get ready to ask.',
          intent:
            'Prepare only what is required to run the selected test and fulfil the offer if someone says yes.',
          component: 'offer_test_preparation',
          dependencies: ['m3-q3-test-selection'],
        },
        {
          key: 'm3-q3-reach-out',
          sequence: 4,
          role: 'investigation',
          title: 'Who will you put this in front of?',
          intent:
            'Select the people or audience for the test and prepare the actual outreach.',
          component: 'offer_test_reach_out',
          dependencies: ['m3-q3-preparation'],
        },
        {
          key: 'm3-q3-run',
          sequence: 5,
          role: 'investigation',
          title: 'Go to market.',
          intent:
            'Have the user actually make the offer to the selected people or audience.',
          component: 'offer_test_run',
          dependencies: ['m3-q3-reach-out'],
        },
        {
          key: 'm3-q3-capture',
          sequence: 6,
          role: 'investigation',
          title: 'Capture what actually happened.',
          intent:
            'Record the market response as evidence while it is fresh, distinguishing what people said from what they did.',
          component: 'offer_test_capture',
          dependencies: ['m3-q3-run'],
        },
        {
          key: 'm3-q3-reveal',
          sequence: 7,
          role: 'reveal',
          title: 'What did the market actually do?',
          intent:
            'Separate polite interest, stated intent and meaningful behaviour, then show what the test actually tells the user.',
          component: 'market_test_signal_reveal',
          dependencies: ['m3-q3-capture'],
        },
        {
          key: 'm3-q3-action',
          sequence: 8,
          role: 'action',
          title: 'What does the signal tell you?',
          intent:
            'Let the user decide what the evidence means for the next experiment or direction.',
          component: 'market_test_action',
          dependencies: ['m3-q3-reveal'],
        },
      ],
    },
  ],

  reveal: {
    key: 'm3-reveal',
    sequence: 1,
    role: 'reveal',
    title: 'You went to market.',
    intent:
      'Show the complete journey from selected opportunity to concrete offer, market test, evidence and user-owned interpretation.',
    component: 'mission_transformation_synthesis',
  },

};
