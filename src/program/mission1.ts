import type { ProgramMission } from './types';

export const mission1: ProgramMission = {
  key: 'mission-1',
  version: 2,
  title: 'Move Before Ready',
  sequence: 1,

  question: 'Can you learn to move before you feel ready?',

  description:
    'Starting rarely feels as clear or comfortable as we imagine. This mission helps you understand what is holding you back, recognize what you already have, involve other people, and build the habit of acting before you have all the answers.',

  transformation: {
    from: 'Waiting for confidence, certainty, and readiness.',
    to: 'Taking action, learning from what happens, and moving again.',
  },

  // ---------------------------------------------------------------------------
  // Mission setup
  // ---------------------------------------------------------------------------

  setup: {
    key: 'm1-setup',
    sequence: 1,
    role: 'setup',
    title: 'Where are you starting from?',
    description:
      'Before you decide what to build, take a moment to see where you are right now.',
    prompt:
      'What is on your mind when you think about starting something of your own?',
    intent:
      'Understand where the user is right now and whether they already have an idea without evaluating it.',
    component: 'situation_explorer',
  },

  // ---------------------------------------------------------------------------
  // Quests
  // ---------------------------------------------------------------------------

  quests: [
    // -------------------------------------------------------------------------
    // Quest 1 — Draw the Line
    // -------------------------------------------------------------------------

    {
      key: 'q1',
      sequence: 1,
      title: 'Draw the Line',
      description:
        'Understand what is keeping you from starting and decide what you are willing to do about it.',

      nodes: [
        {
          key: 'm1-q1-setup',
          sequence: 1,
          role: 'setup',
          title: 'What is really keeping you from starting?',
          description:
            'There may be practical reasons for waiting. There may also be fear, uncertainty, or assumptions hiding underneath them. Let’s look at what is really going on.',
          prompt:
            'What do you think is standing between you and starting?',
          intent:
            'Frame the gap between wanting to start and actually starting in a personal way.',
          component: 'barrier_reflection',
          dependencies: ['m1-setup'],
        },

        {
          key: 'm1-q1-barriers',
          sequence: 2,
          role: 'investigation',
          title: 'What has been stopping you?',
          description:
            'Look more closely at the barriers you named. Some may be real constraints. Others may be fears or assumptions that have become reasons to wait.',
          prompt:
            'Which barriers feel most responsible for keeping you stuck?',
          intent:
            'Put words to the real barriers, fears, and reasons behind not starting.',
          component: 'why_havent_you_started',
          dependencies: ['m1-q1-setup'],
        },

        {
          key: 'm1-q1-motivation',
          sequence: 3,
          role: 'investigation',
          title: 'What keeps bringing you back?',
          description:
            'Something keeps pulling you toward this, even when the barriers are still there. That pull matters.',
          prompt:
            'What makes you keep coming back to this idea or possibility?',
          intent:
            'Understand the pull that keeps bringing the user back despite the barriers.',
          component: 'motivation_explorer',
          dependencies: ['m1-q1-barriers'],
        },

        {
          key: 'm1-q1-future',
          sequence: 4,
          role: 'investigation',
          title: 'What would be different?',
          description:
            'Starting a business is not the goal by itself. Something about your life, work, or circumstances is making you want to do this.',
          prompt:
            'If this worked, what would be different for you?',
          intent:
            'Describe what the user actually wants to change if they make this happen.',
          component: 'future_reflection',
          dependencies: ['m1-q1-motivation'],
        },

        {
          key: 'm1-q1-quit',
          sequence: 5,
          role: 'investigation',
          title: 'What might make you quit?',
          description:
            'Knowing what could make you stop is useful. It gives you a chance to recognize those moments before they arrive.',
          prompt:
            'What could realistically make you stop trying?',
          intent:
            'Make the user aware of conditions that could realistically cause them to stop.',
          component: 'quit_condition_explorer',
          dependencies: ['m1-q1-future'],
        },

        {
          key: 'm1-q1-reveal',
          sequence: 6,
          role: 'reveal',
          title: 'What is actually driving you?',
          description:
            'Look across what you have said. There is a tension between what is holding you back and what keeps pulling you forward.',
          intent:
            'Bring the answers together so the user can see what is pulling them forward and holding them back.',
          component: 'commitment_synthesis',
          dependencies: ['m1-q1-quit'],
        },

        {
          key: 'm1-q1-action',
          sequence: 7,
          role: 'action',
          title: 'Draw your line.',
          description:
            'You do not need to promise that you will never hesitate again. You need a way to keep moving when hesitation shows up.',
          prompt:
            'What is one behavior you are willing to keep doing when you feel stuck?',
          intent:
            'Turn the understanding into a minimum behavior the user is genuinely willing to maintain.',
          component: 'commitment_builder',
          dependencies: ['m1-q1-reveal'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 2 — What You Already Have
    // -------------------------------------------------------------------------

    {
      key: 'q2',
      sequence: 2,
      title: 'What You Already Have',
      description:
        'Look beyond what you think you lack. Find the people, skills, experience, resources, and access already within reach.',

      nodes: [
        {
          key: 'm1-q2-setup',
          sequence: 1,
          role: 'setup',
          title: 'You are not starting from zero.',
          description:
            'It is easy to focus on everything you do not have yet. Before you do, let’s look at what is already around you.',
          prompt:
            'What are you starting with?',
          intent:
            'Shift the user from thinking about what they lack to noticing the resources, people, capabilities, and experience already within reach.',
          component: 'asset_inventory_intro',
          dependencies: ['m1-q1-action'],
        },

        {
          key: 'm1-q2-inventory',
          sequence: 2,
          role: 'investigation',
          title: 'What resources are already within reach?',
          description:
            'Resources are not just money. Time, tools, spaces, information, technology, and other forms of access can all change what is possible.',
          prompt:
            'What resources could you use right now?',
          intent:
            'Identify current resources and perceived constraints.',
          component: 'resource_inventory',
          dependencies: ['m1-q2-setup'],
        },

        {
          key: 'm1-q2-network',
          sequence: 3,
          role: 'investigation',
          title: 'Who is already within reach?',
          description:
            'You do not have to build everything alone. Start with the people you already know or can realistically approach.',
          prompt:
            'Who could you talk to, learn from, or ask for help?',
          intent:
            'Identify people the user can realistically approach.',
          component: 'contact_inventory',
          dependencies: ['m1-q2-inventory'],
        },

        {
          key: 'm1-q2-capabilities',
          sequence: 4,
          role: 'investigation',
          title: 'What can you already do?',
          description:
            'You have probably learned more useful things than you give yourself credit for. Look for capabilities you already use to solve problems.',
          prompt:
            'What can you already do that could be useful?',
          intent:
            'Surface practical capabilities through problems the user already solves.',
          component: 'capability_inventory',
          dependencies: ['m1-q2-network'],
        },

        {
          key: 'm1-q2-experience',
          sequence: 5,
          role: 'investigation',
          title: 'What have you already lived through?',
          description:
            'Your experience is bigger than your job history. Work, hobbies, side projects, communities, failures, and problems you have solved can all give you useful context.',
          prompt:
            'What experiences might give you an advantage here?',
          intent:
            'Find useful experience across work, hobbies, side projects, failures, communities, and personal problems.',
          component: 'experience_inventory',
          dependencies: ['m1-q2-capabilities'],
        },

        {
          key: 'm1-q2-reveal',
          sequence: 6,
          role: 'reveal',
          title: 'You have more to work with than you thought.',
          description:
            'Now compare what you thought you were missing with what you actually have available.',
          intent:
            'Compare perceived gaps with actual assets while making genuine remaining gaps visible.',
          component: 'asset_reveal',
          dependencies: ['m1-q2-experience'],
        },

        {
          key: 'm1-q2-action',
          sequence: 7,
          role: 'action',
          title: 'What still needs attention?',
          description:
            'You do not need to close every gap before you begin. Identify the ones that actually matter now.',
          prompt:
            'Which gap is worth doing something about first?',
          intent:
            'Turn genuine gaps into concrete next steps without forcing the user to solve everything now.',
          component: 'gap_action',
          dependencies: ['m1-q2-reveal'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 3 — Make the Ask
    // -------------------------------------------------------------------------

    {
      key: 'q3',
      sequence: 3,
      title: 'Make the Ask',
      description:
        'Stop trying to figure everything out alone. Start involving people and learn what happens when you ask.',

      nodes: [
        {
          key: 'm1-q3-setup',
          sequence: 1,
          role: 'setup',
          title: 'How comfortable are you asking?',
          description:
            'Most things worth doing involve other people. Before you make a real ask, notice how you feel about asking in the first place.',
          prompt:
            'How comfortable are you asking someone for help, advice, or an opportunity?',
          intent:
            'Establish a personal baseline for asking outside the close circle.',
          component: 'asking_baseline',
          dependencies: ['m1-q2-action'],
        },

        {
          key: 'm1-q3-squad',
          sequence: 2,
          role: 'investigation',
          title: 'Who could be part of your squad?',
          description:
            'You do not need a co-founder or a big team. You need people who can help you see, learn, make, or keep going.',
          prompt:
            'Who could you involve in your journey?',
          intent:
            'Identify people who can play useful roles during the journey.',
          component: 'squad_builder',
          dependencies: ['m1-q3-setup'],
        },

        {
          key: 'm1-q3-visible',
          sequence: 3,
          role: 'investigation',
          title: 'Make yourself visible.',
          description:
            'You do not have to announce a finished business. Take a small step that lets another person see what you are trying to do.',
          prompt:
            'What could you put out into the world before you feel completely ready?',
          intent:
            'Take a small real-world step that makes the user’s intention visible before everything feels ready.',
          component: 'visibility_action',
          dependencies: ['m1-q3-squad'],
        },

        {
          key: 'm1-q3-ask',
          sequence: 4,
          role: 'investigation',
          title: 'Ask someone who owes you nothing.',
          description:
            'Make a real ask where the answer is genuinely theirs to give. Pay attention to what happens, not just whether they say yes.',
          prompt:
            'Who could you make a real ask of today?',
          intent:
            'Give direct experience of making a real ask and comparing prediction with reality.',
          component: 'real_world_ask',
          dependencies: ['m1-q3-visible'],
        },

        {
          key: 'm1-q3-reveal',
          sequence: 5,
          role: 'reveal',
          title: 'How did reality compare with your prediction?',
          description:
            'Before you asked, you probably imagined how it would go. Now compare that prediction with what actually happened.',
          intent:
            'Make the gap between anticipated and actual experience visible without telling the user what it means.',
          component: 'prediction_reality_reveal',
          dependencies: ['m1-q3-ask'],
        },

        {
          key: 'm1-q3-action',
          sequence: 6,
          role: 'action',
          title: 'What will you do with what you learned?',
          description:
            'One real interaction can change how you approach the next one. Decide what you want to carry forward.',
          prompt:
            'What will you do differently the next time you need to ask?',
          intent:
            'Let the user turn what they learned into a useful next step, commitment, or recorded insight.',
          component: 'learning_action',
          dependencies: ['m1-q3-reveal'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 4 — Seek the No
    // -------------------------------------------------------------------------

    {
      key: 'q4',
      sequence: 4,
      title: 'Seek the No',
      description:
        'Practice asking without needing the answer to be yes. Learn what rejection actually feels like—and what you can do with it.',

      nodes: [
        {
          key: 'm1-q4-setup',
          sequence: 1,
          role: 'setup',
          title: 'What are you afraid will happen if they say no?',
          description:
            'A no can feel much bigger before you hear it. This investigation gives you a chance to test that fear instead of letting it make the decision for you.',
          prompt:
            'What do you imagine will happen if someone says no?',
          intent:
            'Reframe rejection as information and create a safe entry point for intentionally seeking it.',
          component: 'standard_setup_frame',
          dependencies: ['m1-q3-action'],
        },

        {
          key: 'm1-q4-warmup',
          sequence: 2,
          role: 'investigation',
          title: 'Start with an easy no.',
          description:
            'Make a low-stakes ask where hearing no would be uncomfortable but not costly.',
          prompt:
            'What small ask could you make where a no would be okay?',
          intent:
            'Experience a low-stakes rejection.',
          component: 'low_threshold_ask',
          dependencies: ['m1-q4-setup'],
        },

        {
          key: 'm1-q4-stretch',
          sequence: 3,
          role: 'investigation',
          title: 'Now make a harder ask.',
          description:
            'Push a little further. Choose an ask that feels more uncomfortable but is still safe to make.',
          prompt:
            'What is a bigger ask you could make today?',
          intent:
            'Experience a slightly more uncomfortable rejection.',
          component: 'fear_challenge',
          dependencies: ['m1-q4-warmup'],
        },

        {
          key: 'm1-q4-reveal',
          sequence: 4,
          role: 'reveal',
          title: 'What did the no actually mean?',
          description:
            'Compare what you feared would happen with what actually happened. The difference is the useful part.',
          intent:
            'Examine the reality of the rejection versus the anticipation.',
          component: 'fear_evidence_reveal',
          dependencies: ['m1-q4-stretch'],
        },

        {
          key: 'm1-q4-action',
          sequence: 5,
          role: 'action',
          title: 'How will you respond to the next no?',
          description:
            'You cannot control whether someone says yes. You can decide what you do after hearing no.',
          prompt:
            'What will you do the next time you hear no?',
          intent:
            'Establish a systematic response to hearing no.',
          component: 'fear_audit',
          dependencies: ['m1-q4-reveal'],
        },
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // Mission reveal
  // ---------------------------------------------------------------------------

  reveal: {
    key: 'm1-reveal',
    sequence: 1,
    role: 'reveal',
    title: 'Look at how far you moved.',
    description:
      'You started with uncertainty. Now look at what you actually did, what happened, and what you learned from acting instead of waiting.',
    intent:
      'Show what changed because of what the user actually did across the mission, using evidence rather than generic encouragement.',
    component: 'mission_transformation',
    dependencies: ['m1-q4-action'],
  },

  // ---------------------------------------------------------------------------
  // Mission action
  // ---------------------------------------------------------------------------

  action: {
    key: 'm1-action',
    sequence: 2,
    role: 'action',
    title: 'How will you move before ready?',
    description:
      'The goal is not to become fearless or perfectly confident. It is to keep moving when uncertainty shows up.',
    prompt:
      'What will you carry into the next mission?',
    intent:
      'Let the user decide how they want to carry this behavior into the next mission.',
    component: 'mission_transfer_action',
    dependencies: ['m1-reveal'],
  },
};