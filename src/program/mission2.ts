// src/program/mission2.ts
import type { ProgramMission } from './types';

/**
 * Mission 2 — Discover Opportunities
 *
 * One word per stage, in the data AND in the UI:
 *
 *   Observation  → something you noticed          (user_observations)
 *   Opportunity  → an observation you chose to look into (user_opportunities)
 *   Project      → the one opportunity you commit to      (user_projects)
 *
 * Observations are created in the mission setup (an existing idea) and in
 * Q1 capture. Opportunities are created only in Q1 action. The project is
 * created only in Q3 action.
 *
 * Flow: notice → qualify → choose three → talk to people → look at what it
 * would take → think about how you'd help → choose one.
 *
 * Deep research (payer, market size, competition, economics) is deliberately
 * deferred to M4.
 */
export const mission2: ProgramMission = {
  key: 'mission-2',
  version: 2,
  title: 'Discover Opportunities',
  sequence: 2,

  question: 'What problems are worth building a business around?',

  description:
    'You do not need to invent a brilliant business idea. You need to learn to notice problems, talk to the people who live with them, and choose something worth working on.',

  transformation: {
    from: 'Looking for a business idea.',
    to: 'I noticed problems, talked to real people, looked honestly at what it would take, and chose one to work on.',
  },

  setup: {
    key: 'm2-setup',
    sequence: 1,
    role: 'setup',
    title: 'Where are you starting from?',
    description: `Most people who want to start something already have an idea in mind. Or the ghost of one. You don't have to leave it behind. Tell us what it is, and it joins everything else you notice in this mission, to be looked at properly alongside it.

If you don't have one, that's fine too.`,
    prompt: `Is there an idea you've been carrying?`,
    intent:
      'Acknowledge the idea the user arrives with so they do not feel they are giving anything up. If they have one, it is saved as an observation only (metadata.is_existing_idea). It is never created as an opportunity here; it goes through qualification like every other observation and only becomes an opportunity if the user promotes it in Q1. If they have none, show what they said in M1 and move on without writing anything.',
    component: 'opportunity_starting_point',
    dependencies: ['m1-reveal'],
  },

  quests: [
    // -------------------------------------------------------------------------
    // Quest 1 — Notice Problems
    // -------------------------------------------------------------------------
    {
      key: 'q1',
      sequence: 1,
      title: 'Notice Problems',
      description:
        'Stop trying to come up with ideas. Pay attention to problems that are already happening around you.',
      nodes: [
        {
          key: 'm2-q1-setup',
          sequence: 1,
          role: 'setup',
          title: `Notice, don't brainstorm.`,
          description: `Every business exists because someone has a problem. The best ones often start with someone noticing a problem that was already there.

For the next week or so, just pay attention. Everything you notice gets saved as an observation. Don't ask whether it could be a business yet.`,
          prompt: `What's been bugging you lately?`,
          intent:
            'Reframe discovery around noticing rather than inventing. Optional first observation. Introduces the word "observation".',
          component: 'noticing_setup',
          dependencies: ['m2-setup'],
        },
        {
          key: 'm2-q1-observe',
          sequence: 2,
          role: 'investigation',
          title: 'What are you noticing?',
          description: `Come back whenever you see, hear or live through something annoying, slow, expensive or broken. A sentence is enough. You can add detail later.

A couple of the prompts ask you to go and ask someone. Try those.`,
          prompt: 'What frustrated you today?',
          intent:
            'Lightweight, ongoing capture of observations across five lenses (personal, people, zone_of_influence, changes, markets), including two real asks. Observations can also be added outside this node. Soft target of about 10, no gating beyond a small minimum.',
          component: 'observation_capture',
          dependencies: ['m2-q1-setup'],
          pacing: { delay_days: 5 },
          metadata: {
            guidance:
              'Noticing works better over several days than in one sitting. Most people take about a week.',
            observation: {
              type: 'observation',
              domain: 'problem',
              focuses: ['personal', 'people', 'zone_of_influence', 'changes', 'markets'],
              minimum_count: 3,
              soft_target: 10,
            },
          },
        },
        {
          key: 'm2-q1-qualify',
          sequence: 3,
          role: 'investigation',
          title: 'Which of these are worth a closer look?',
          description: `Not every observation deserves your attention. For each one, answer three questions honestly:

Do I understand this problem?
Could I do something about it?
Do I care?

"Not sure" is a fine answer.`,
          prompt: 'For each observation: do you understand it, could you do something about it, do you care?',
          intent:
            'Quick three-question pass over each observation, one at a time, each answered yes / not sure / no and stored on the observation. Whether the problem is real is deliberately not asked here; talking to people in Q2 answers that. An observation can be skipped as not worth a closer look.',
          component: 'observation_qualification',
          dependencies: ['m2-q1-observe'],
          metadata: {
            guidance: 'Go with your gut. You are not committing to anything yet.',
            qualification: {
              questions: ['understand', 'can_solve', 'care'],
              answers: ['yes', 'maybe', 'no'],
            },
          },
        },
        {
          key: 'm2-q1-reveal',
          sequence: 4,
          role: 'reveal',
          title: 'What keeps showing up?',
          description: `Look across your observations and your answers. Some problems repeat. Some cluster. Some connect to things you already know.`,
          intent:
            'Mirror patterns, clusters, cross-lens overlaps and places where the user\'s three answers pull in different directions, using their own words and context from M1. Persisted in ai_logs (purpose observation_patterns) with regenerate. Offers a way back to change qualification answers.',
          component: 'observation_patterns_reveal',
          dependencies: ['m2-q1-qualify'],
        },
        {
          key: 'm2-q1-action',
          sequence: 5,
          role: 'action',
          title: 'Which three will you look into?',
          description: `Pick up to three observations to turn into opportunities. An opportunity is an observation you've decided to look into properly. The rest stay as observations, and you can come back to them.`,
          prompt: 'Which three observations will you take forward?',
          intent:
            'Choose up to three observations to promote. Each becomes an opportunity linked to its source observation, with a snapshot of the qualification answers. Hard cap of three.',
          component: 'promote_to_opportunities',
          dependencies: ['m2-q1-reveal'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 2 — Talk to People
    // -------------------------------------------------------------------------
    {
      key: 'q2',
      sequence: 2,
      title: 'Talk to People',
      description:
        'Do not guess whether a problem is real. Ask people who live with it.',
      nodes: [
        {
          key: 'm2-q2-setup',
          sequence: 1,
          role: 'setup',
          title: `Don't guess. Ask.`,
          description: `You have up to three opportunities. So far, each one is something you noticed. Talking to someone who actually has the problem will tell you more than another week of thinking.

Fifteen minutes is plenty. You're not selling anything. You're listening.`,
          prompt: 'Who could you talk to about these?',
          intent:
            'Move the user from noticing to listening. Framing only, no writes.',
          component: 'conversation_setup',
          dependencies: ['m2-q1-action'],
        },
        {
          key: 'm2-q2-conversations',
          sequence: 2,
          role: 'investigation',
          title: 'What do people actually say?',
          description: `Talk to at least one person for each opportunity. Two or three is better. Before each conversation, write down what you expect to hear. Afterwards, write down what actually happened.`,
          prompt: 'Talk to someone who has this problem.',
          intent:
            'For each opportunity, plan, hold and log conversations with people who have the problem. Before: pick the person and write a one-line prediction. After: free-text account, AI drafts answers to six questions, the user corrects them, then key quote and surprises. At least one conversation per opportunity.',
          component: 'customer_conversations',
          dependencies: ['m2-q2-setup'],
          pacing: { delay_days: 3 },
          metadata: {
            guidance:
              'Conversations take time to arrange. Give yourself a few days.',
            observation: {
              type: 'conversation',
              domain: 'customer',
              focus: 'customer_interview',
              minimum_per_opportunity: 1,
              suggested_per_opportunity: 3,
            },
          },
        },
        {
          key: 'm2-q2-reveal',
          sequence: 3,
          role: 'reveal',
          title: 'What did you hear?',
          description: `Put what you expected next to what people actually said.`,
          intent:
            'Per opportunity, mirror what people said in their own words, what repeated, and what surprised the user against their predictions. Persisted in ai_logs (purpose conversations_reveal) with regenerate.',
          component: 'conversations_reveal',
          dependencies: ['m2-q2-conversations'],
        },
        {
          key: 'm2-q2-action',
          sequence: 4,
          role: 'action',
          title: 'What do you want to do with that?',
          description: `For each opportunity: keep going, talk to more people, or set it aside. Setting one aside isn't a failure. It's a decision about where your time goes, and you can pick it up again later.`,
          prompt: 'What do you want to do with each one?',
          intent:
            'Per opportunity decide: continue, talk to more people (creates a task), or set aside (parked, with an optional note). At least one must continue.',
          component: 'conversations_decision',
          dependencies: ['m2-q2-reveal'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 3 — What Would It Take?
    // -------------------------------------------------------------------------
    {
      key: 'q3',
      sequence: 3,
      title: 'What Would It Take?',
      description:
        'Look honestly at what doing something about this would involve, for you, and think about the different ways you could help.',
      nodes: [
        {
          key: 'm2-q3-setup',
          sequence: 1,
          role: 'setup',
          title: 'Could you actually do something about this?',
          description: `A problem can be real and still not be yours to solve right now. That's worth knowing before you spend months on it.

You don't need to be an expert. You need to know what you'd have to learn, who you'd need, and how you might help.`,
          prompt: 'Which of these could you actually start on?',
          intent:
            'Shift from "is this real?" to "could I do something about it, and how?". Framing only, no writes.',
          component: 'path_setup',
          dependencies: ['m2-q2-action'],
        },
        {
          key: 'm2-q3-assessment',
          sequence: 2,
          role: 'investigation',
          title: 'What would it take?',
          description: `One opportunity at a time, a few questions, one at a time. At the end you'll get a short summary in your own words to correct.`,
          prompt: 'What would it take?',
          intent:
            'Guided conversation per remaining opportunity covering what they know, what they would need to learn and how long, who they would need, who already does something about it (prefilled from their conversations), the smallest version they could do for one person in two weeks, and what they would need to hear to stop. Ends in an editable summary. One feasibility observation per opportunity. The smallest-version step can be skipped, which is flagged in the reveal.',
          component: 'path_assessment',
          dependencies: ['m2-q3-setup'],
          pacing: { delay_days: 1 },
          metadata: {
            guidance: 'Take your time with each one. There is no rush.',
            observation: {
              type: 'research',
              domain: 'problem',
              focus: 'feasibility',
            },
          },
        },
        {
          key: 'm2-q3-approach',
          sequence: 3,
          role: 'investigation',
          title: 'How could you help?',
          description: `There's rarely only one way to help someone with a problem. You could do it for them, give them a tool, connect them with someone, or teach them how.

Look at all four for each opportunity, then choose the one that's closest to what you'd actually do first.`,
          prompt: `Which of these is closest to what you'd actually do first?`,
          intent:
            'Per opportunity, think about the solution broadly across four ways of helping: do it for them (product or service), give them a tool (software), connect them (marketplace or matching), teach them (information or course). The user picks a primary approach (optionally a second), describes what it would look like for the person with the problem, and says why. This is what makes the final choice a reasoned one. Prefilled with their smallest version. "I\'m not sure yet" is allowed and shown in the reveal.',
          component: 'help_approach',
          dependencies: ['m2-q3-assessment'],
          metadata: {
            observation: {
              type: 'research',
              domain: 'product',
              focus: 'approach',
            },
            approaches: [
              { key: 'do_for_them', label: 'Do it for them', kind: 'Product or service' },
              { key: 'tool', label: 'Give them a tool', kind: 'Software or app' },
              { key: 'connect', label: 'Connect them', kind: 'Marketplace or matching' },
              { key: 'teach', label: 'Teach them', kind: 'Information or course' },
            ],
          },
        },
        {
          key: 'm2-q3-reveal',
          sequence: 4,
          role: 'reveal',
          title: 'Where do you have a way in?',
          description: `Here are your opportunities side by side, in your own words.`,
          intent:
            'Show each remaining opportunity against what the user said they know, need, have access to, how long it would take, who already does something, the smallest version and how they would help. No scores and no winner. Mirrors mismatches and gaps against the user program context. Persisted in ai_logs (purpose feasibility_assessment) with regenerate.',
          component: 'path_reveal',
          dependencies: ['m2-q3-approach'],
        },
        {
          key: 'm2-q3-action',
          sequence: 5,
          role: 'action',
          title: 'Which one will you work on?',
          description: `You've noticed, qualified, talked to people, looked at what it would take, and thought about how you'd help. Now choose the opportunity that becomes your project.

You're not marrying it. You'll test it with real people next, and you can come back to the others.`,
          prompt: 'Which one will you work on?',
          intent:
            'Short reflection first, then choose one, or choose none, not now, or start over. Choosing creates the project and carries the evidence and the chosen approach forward. Enforced two-day gap after the reveal so the choice is not made on impulse.',
          component: 'choose_opportunity',
          dependencies: ['m2-q3-reveal'],
          pacing: { delay_days: 2, isStrict: true },
          metadata: {
            guidance:
              `Whatever you choose, you'll spend real time on it. Take a couple of days.`,
          },
        },
      ],
    },
  ],

  reveal: {
    key: 'm2-reveal',
    sequence: 1,
    role: 'reveal',
    title: 'How you got here.',
    intent:
      'Show the story of how the user reached the chosen opportunity: what they noticed, which three they chose, who they talked to, what they set aside and why, what they said it would take, and how they decided to help. Includes what happened to the idea they arrived with, if any. Ends with the transformation in the user\'s own words.',
    component: 'mission_transformation_synthesis',
    dependencies: ['m2-q3-action'],
  },

  action: {
    key: 'm2-action',
    sequence: 2,
    role: 'action',
    title: 'Take one question with you.',
    description: `You're not building anything yet. Next, you'll put this problem in front of real people and see who acts on it.`,
    prompt: 'What do you most want to find out next?',
    intent:
      'Confirm the project and capture the one question the user carries into Mission 3. Advances to m3-setup.',
    component: 'mission_transfer_action',
    dependencies: ['m2-reveal'],
  },
};
