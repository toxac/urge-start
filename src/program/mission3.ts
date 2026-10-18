// src/program/mission3.ts
import type { ProgramMission } from './types';

/**
 * Mission 3 — Test the Problem
 *
 * M3 asks one question: is this problem real enough to plan a business around?
 * It does NOT test a solution, ask for a price, or produce an offer. The offer
 * is designed in M4 and tested in M5 against the warm list this mission builds.
 *
 * Every test, whatever the channel, has five parts:
 *   who · where · framing · action · reading
 * and is read at three levels:
 *   reach (did it land?) · action (did anyone do something?) · evidence (what did they reveal?)
 *
 * Only people who take a STRONG action join the warm list (user_contacts).
 *
 * AI appears at exactly two moments, both suggest-only:
 *   1. m3-q1-setup-test  — draft the five parts for the chosen test
 *   2. m3-q3-read        — read the signals back as: shows / might mean / unclear
 * Everything else is deterministic or the user's own work.
 *
 * Entities: the test (an `experiment` observation per pass), the people who
 * acted (observations + user_contacts with the 'warm' role), and the project.
 */
export const mission3: ProgramMission = {
  key: 'mission-3',
  version: 2,
  title: 'Test the Problem',
  sequence: 3,

  question: 'Is this problem real enough to plan a business around?',

  description:
    'Put the problem in front of real people, see who acts, and find out whether it is real enough to plan a business around. You are not testing a solution or a price. You are finding out whether people who have this problem want it solved.',

  transformation: {
    from: 'I think this problem might be worth working on.',
    to: 'I know this problem is real, and people who have it want it solved.',
  },

  setup: {
    key: 'm3-setup',
    sequence: 1,
    role: 'setup',
    title: `You're about to put this in front of people.`,
    description: `You chose a problem and talked to people about it. Now you'll put it in front of more of them, in a way that lets the ones who want it solved raise their hand.

You won't be selling anything or naming a price. You'll be finding out whether the problem is real enough to plan a business around. You'll leave with the problem confirmed, a list of people who acted, and what they told you.`,
    intent:
      'Orient the user: what M3 is for, what it is not (no offer, no price, no solution), and what they leave with. Shows the project, the way they said they would help (M2 approach), and a few things people said in M2 conversations in their own words. Read-only.',
    component: 'project_starting_point',
    dependencies: ['m2-action'],
  },

  quests: [
    // -------------------------------------------------------------------------
    // Quest 1 — Design the Test
    // -------------------------------------------------------------------------
    {
      key: 'q1',
      sequence: 1,
      title: 'Design the Test',
      description:
        'Decide how you will put the problem in front of people, and what a real response would look like before you see one.',
      nodes: [
        {
          key: 'm3-q1-setup',
          sequence: 1,
          role: 'setup',
          title: 'Same test, different places.',
          description: `A test can happen in a conversation, on a page, in a community or in a message. The place changes. The parts don't.

Every test has five: who it's for, where it happens, how you put the problem, what you ask people to do, and how you'll read what comes back.`,
          intent:
            'Introduce the five-part mechanic (who, where, framing, action, reading) and the idea that the channel is a variable. Read-only.',
          component: 'test_design_setup',
          dependencies: ['m3-setup'],
        },
        {
          key: 'm3-q1-access',
          sequence: 2,
          role: 'investigation',
          title: 'What can you actually do?',
          description: `A few questions about who you can reach and what you're comfortable doing. There are no wrong answers. They just pick a test that fits you.`,
          prompt: 'Where do the people who have this problem spend their time?',
          intent:
            'Three to four short questions M2 did not answer: where the people with the problem gather (online, in person), what the user is comfortable doing (post publicly, message strangers, have conversations, put up a page), how much time they have in the next week or two, and whether the business would mostly find people online, in person or both. Produces an access profile and the business type (online, offline, hybrid). No AI.',
          component: 'test_access_profile',
          dependencies: ['m3-q1-setup'],
        },
        {
          key: 'm3-q1-cards',
          sequence: 3,
          role: 'investigation',
          title: 'Pick a way to test it.',
          description: `Here are a few ways to test a problem like yours. Each one says what it costs you and what a real response looks like.`,
          prompt: 'Which of these could you actually run this week?',
          intent:
            'Show the preset tests filtered by the solution type chosen in M2 and the business type from the access profile (three or four cards, never the whole library). Each card: name, one line, what it tells you, what it costs, what a real signal looks like, what a weak one looks like, best when. The user picks one, or chooses to design one from scratch using the five parts. No AI.',
          component: 'test_preset_cards',
          dependencies: ['m3-q1-access'],
        },
        {
          key: 'm3-q1-setup-test',
          sequence: 4,
          role: 'investigation',
          title: 'Make it yours.',
          description: `We'll draft the five parts for your problem, using the words people used with you. Change anything that isn't right. It's your test.`,
          prompt: 'What would you change?',
          intent:
            'AI moment 1. For the chosen card, AI drafts the five parts (who, where, framing from the user\'s own M2 quotes, action, how to read reach / action / evidence, and scope), adapted to the problem, evidence and access profile. May ask one or two clarifying questions first. Flags once, without blocking, if the test cannot fail or will not give a real signal, and offers an alternative. The draft is editable and the user\'s version wins. Produces the final test design as an experiment observation.',
          component: 'test_setup_draft',
          dependencies: ['m3-q1-cards'],
        },
        {
          key: 'm3-q1-reveal',
          sequence: 5,
          role: 'reveal',
          title: `Here's your test.`,
          description: `Your test, and what a real response would look like.`,
          intent:
            'Show the final design as a whole, and what reach, action and evidence would look like for this problem in the user\'s own terms, including which actions count as strong and which as weak. Deterministic, no AI. Read-only.',
          component: 'test_design_reveal',
          dependencies: ['m3-q1-setup-test'],
        },
        {
          key: 'm3-q1-action',
          sequence: 6,
          role: 'action',
          title: 'Ready to run it?',
          description: `If it's ready, run it. If something feels off, change it now.`,
          prompt: 'Will you run this?',
          intent:
            'The user commits to running the test, which marks the design as the one to run, or routes back to revise it.',
          component: 'test_commit_action',
          dependencies: ['m3-q1-reveal'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 2 — Run the Test
    // -------------------------------------------------------------------------
    {
      key: 'q2',
      sequence: 2,
      title: 'Run the Test',
      description:
        'Do it for real, then write down what actually happened.',
      nodes: [
        {
          key: 'm3-q2-setup',
          sequence: 1,
          role: 'setup',
          title: `Now it's real.`,
          description: `Run the test, and keep a log as things come in. Write down how many people stopped, who did something, and what they told you in their own words.

This takes days, not minutes. Come back as things happen.`,
          intent:
            'Frame the run: what to watch for, how to log it, and that it takes days. Read-only.',
          component: 'test_run_setup',
          dependencies: ['m3-q1-action'],
        },
        {
          key: 'm3-q2-run',
          sequence: 2,
          role: 'investigation',
          title: 'Run it. Write down what happens.',
          description: `Send it, post it, put it up, have the conversations. Then log what comes back: how many people stopped, who did something, and what they said about the problem.

An honest zero is a real result.`,
          prompt: 'What happened?',
          intent:
            'The user runs the test in the real world and logs it as they go: reach (how many were reached and how many stopped), action (who did something, what, and whether it is a strong or weak action), and evidence (what each person revealed about the problem in their own words: a recent instance, how often, what it costs, what they do now). Strong actions add the person to the warm list. Saved continuously over days. No AI.',
          component: 'test_run_log',
          dependencies: ['m3-q2-setup'],
          pacing: { delay_days: 5 },
          metadata: {
            guidance:
              'Replies take time. Most people need about five days before they can read anything into it.',
            observation: {
              type: 'experiment',
              domain: 'problem',
              focus: 'problem_test',
            },
            signal_levels: ['reach', 'action', 'evidence'],
          },
        },
        {
          key: 'm3-q2-reveal',
          sequence: 3,
          role: 'reveal',
          title: 'What came back.',
          description: `Here is everything that came back, split into three: how many stopped, who did something, and what they told you. Nothing is interpreted yet.`,
          intent:
            'Show the raw results separated by level (reach, action split into strong and weak, evidence), with the people and their words. No interpretation, no AI. Read-only.',
          component: 'test_results_reveal',
          dependencies: ['m3-q2-run'],
        },
        {
          key: 'm3-q2-action',
          sequence: 4,
          role: 'action',
          title: 'Read it now, or run it again?',
          description: `If you've got enough to read, move on. If the test didn't really get a fair run, a second pass with a different framing, channel or audience is fine.`,
          prompt: 'Is this enough to read, or do you want another pass?',
          intent:
            'The user decides: read the signals now, or run a second pass. A second pass routes back to m3-q1-setup-test with the existing design as the starting point and creates the next test pass. No cap, but after the second pass the user is asked whether to keep iterating.',
          component: 'test_results_action',
          dependencies: ['m3-q2-reveal'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 3 — Read the Signals
    // -------------------------------------------------------------------------
    {
      key: 'q3',
      sequence: 3,
      title: 'Read the Signals',
      description:
        'Work out what happened, what it might mean, and what you want to do next.',
      nodes: [
        {
          key: 'm3-q3-setup',
          sequence: 1,
          role: 'setup',
          title: `What happened isn't the same as what it means.`,
          description: `There's what the signals show. There's what they might mean. And there's what you still don't know. It's worth keeping those three apart.

You were there. You saw things no summary can. Your read matters more than anyone else's.`,
          intent:
            'Frame reading as a skill: the difference between what the signals show, what they might mean and what is still unclear. Read-only.',
          component: 'signal_reading_setup',
          dependencies: ['m3-q2-action'],
        },
        {
          key: 'm3-q3-read',
          sequence: 2,
          role: 'investigation',
          title: 'What do you make of it?',
          description: `Here's a read of what came back. Correct anything that's wrong, and add what you noticed that a summary could not.`,
          prompt: 'What do you make of it?',
          intent:
            'AI moment 2. AI offers a read in three parts: what the signals show (facts), what they might mean (possibilities, not conclusions), and what is still unclear. It does not route the user or decide whether the problem is real. The user corrects it, adds what they noticed, and writes their own interpretation, which wins where they disagree. Persisted in ai_logs with regenerate.',
          component: 'signal_reading',
          dependencies: ['m3-q3-setup'],
        },
        {
          key: 'm3-q3-reveal',
          sequence: 3,
          role: 'reveal',
          title: 'Where are you?',
          description: `Here's the honest read: what the signals show, what you take from them, and what's still unclear.`,
          intent:
            'Show the honest read assembled from stored data (no new AI call). Names plainly which of four situations the user is in (problem confirmed and people acting; confirmed but nobody acting; people acting but the problem is vague; neither) and what each means. The system suggests the closest one and the user confirms or changes it. If nobody acted, separates nobody stopped (framing), people stopped but nobody acted (urgency) and people acted but said little (depth). Read-only apart from recording the confirmed situation.',
          component: 'signal_reading_reveal',
          dependencies: ['m3-q3-read'],
        },
        {
          key: 'm3-q3-action',
          sequence: 4,
          role: 'action',
          title: 'What do you want to do?',
          description: `There's no right answer. Move on to planning, run a better test, go back and look at a different opportunity, or stop for now. Say why in your own words.`,
          prompt: 'What are you taking from this?',
          intent:
            'The user chooses a route and records the reasoning in their own words: continue to M4, iterate the test (change framing, channel, audience, or the kind of test), go back to M2 (the opportunity is parked, parked ones can be brought back), or pause (a follow-up task is created). Continuing on a thin signal is allowed and recorded as thin.',
          component: 'signal_route_action',
          dependencies: ['m3-q3-reveal'],
        },
      ],
    },
  ],

  reveal: {
    key: 'm3-reveal',
    sequence: 1,
    role: 'reveal',
    title: 'You put it in front of people.',
    intent:
      'Tell the story of what the user did: who they reached, who acted, what those people revealed, and what the user took from it, in their own words and evidence. States the transformation honestly, and says plainly when the signal was thin. Assembled from stored data, no AI.',
    component: 'mission_transformation_synthesis',
    dependencies: ['m3-q3-action'],
  },

  action: {
    key: 'm3-action',
    sequence: 2,
    role: 'action',
    title: 'Take the problem, and the people, with you.',
    description: `You're not designing the business yet. In the next mission you'll plan it around what you've learned here, and the people who raised their hand will be the first ones you go back to.`,
    prompt: 'What do you most need to plan around?',
    intent:
      'Capture what the user carries into M4: the problem in their own words, the warm list, the evidence (quotes, recent instances, costs, workarounds, who has it worst), and the one thing they most need to plan around. Advances to m4-setup.',
    component: 'mission_transfer_action',
    dependencies: ['m3-reveal'],
  },
};
