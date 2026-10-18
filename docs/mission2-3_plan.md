# Mission 2

**title: Discovering Opportunities**

## Mission Setup, 'm2-setup'

- We will keep essence of it same as what node describes.

- Only one thing that we want to do differently here is let users add idea they started out with before they start using our approach.
  
  - We have to explain to them our approach of observation -> opportunities -> project(pressure test) -> build -> launch
  
  - So if users are coming with an idea we have to decide/ lets users decide if it is an observation or an opportunity

- big questions sort of remains the same 
  
  - Can you find problems worth building a business around? (for those who dont start with an idea)
  
  - Is your opportunities the best suited one? (for those who have started with one)

- We have to use a custom Component M2Setup

## Quest 1 - Setup, m2-q1-setup

- Key setup would be to show them how businesses are essentially solving problems which people are willing to pay for. We tell them how we will not be using term ideas instead we will approach this through observing problems and seeing if they are business opprtunities.

- Reframe opportunity discovery around noticing problems rather than brainstorming business ideas.

- We can use our reusable StandardSetupFrame for this and render node.description and node.title



## Quest 1 - Investigation, m2-q1-investigation

- We are just going to have one node for investigation unlike previous quests which had more than one node.

- We have one observation node which users will use to save all their observation and they will be on this node till they have finishing adding observations to their level of satisfaction. 

- So this node will have following parts (This needs to be thought through quite well)
  
  - An ObservationForm (dialog) to save observation. We will follow the user_observation type definition save
  
  - An AI helper to give users hints based on their user_program_context what they have worked on in mission 1: We have to help user discover place to explore for probelms. In addition to active Ai assistance, We will also provide user with a plybook covering all the approaches.
  
  - List of all observations
  
  - Complete Observation button to continue



## Quest1 - Reveal, m2-q1-reveal

- we summarize and analyse the observations users has saved

- We are not trying to tell users if their observations are good or bad or if they are an opportunity. We are looking for patterns in the observations to ascertain few things
  
  - Preference of users for certain types of problems
  
  - Preference of groups/target market
  
  - Nature of problems

- We will have to find nice ways to show these emreging patterns and insights to users

## Quest1- Action, m2-q1-action

There are few ways we can develop this node.

1. Option 1: Show users insights and get their feedback on their preferences which have emerged from the observation data. Basically They went out and observed all sorts of things we want them to reflect and figure out which types of problems resonated with them and have them excited

2. Option 2: takes stick of what they have observed and decide if they want to go back and add more or they are done and continue.



## Quest 2 - Setup, m2-q2-setup

- Not all problems make good businesses. give an scenariosb/illustrative example.

- This quest they will be looking at all their observations and assessing them to see if they are opportunities or not

- We can use our StandardSetupFrame component



## Quest 2 - Investigation, m2-q2-investigation

- We should do it in fun way where they can navigate maybe like a carousel over each observation and assess them using preset criterias

- Implementation Details:



## Quest 2- Reveal, m2-q2-reveal

- We analyse their assessment and score each observation for how food they are as an opportunity. 

- We can also use AI to score same observations and add remarks, users can update their assessment if they agree with AI assessment. 

- Based on the scroes they promote observations to opportunities

## Quest 2- Action, m2-q2-action

Users pick top 3 opportunities



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

// src/program/mission3.ts
import type { ProgramMission } from './types';

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
