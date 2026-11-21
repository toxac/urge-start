// src/program/mission3.ts
import type { ProgramMission } from './types';

/**
 * Mission 3 — Test the Problem
 *
 * M3 is not testing whether the problem exists (that started in M2) and is
 * not locking in pricing or a finished product (that comes in M4). M3 puts the
 * problem in front of real people to answer two practical questions:
 *   1. Do people actually want this problem solved?
 *   2. Does it hurt enough for them to take a real step (sign up, reply, DM, book)?
 *
 * Entities:
 *   - `experiments` (blueprint catalog) & `user_experiments` (founder runs)
 *   - `user_observations` (`type: 'experiment'`, `focus: 'problem_test'`) for quotes
 *   - `user_contacts` (`roles: ['warm']`) for people who took a real step
 *
 * AI appears at exactly two moments, both suggest-only:
 *   1. m3-q1-reveal  — review & sharpen the founder's pitch framing
 *   2. m3-q3-read    — organize logged signals into: shows / might mean / unclear
 */
export const mission3: ProgramMission = {
  key: 'mission-3',
  version: 2,
  title: 'Test the Problem',
  sequence: 3,

  question: 'Do people want this problem solved enough to take action?',

  description:
    'Put the problem in front of real people, see who takes a step, and find out whether people want it solved enough to act. You are not selling a finished product or locking in a price yet.',

  transformation: {
    from: 'I think people might want this problem solved.',
    to: 'I put it in front of real people, saw who took action, and know what their response means.',
  },

  setup: {
    key: 'm3-setup',
    sequence: 1,
    role: 'setup',
    title: `You're about to put this in front of people.`,
    description: `You chose a problem and explored how you might help. Now it's time to step away from your desk and put it in front of real people.

You aren't trying to prove the problem exists, and you don't need final pricing or a finished product yet. You're finding out two things: whether people want this solved, and whether it matters enough for them to take a real step—like signing up, replying, or claiming an early spot.`,
    intent:
      'Orient the user: M3 tests willingness to act, not pricing or a finished product. Shows the active project from M2, their chosen approach, and their forward question. Read-only.',
    component: 'project_starting_point',
    dependencies: ['m2-action'],
  },

  quests: [
    // -------------------------------------------------------------------------
    // Quest 1 — Frame Your Pitch & Pick Your Tests
    // -------------------------------------------------------------------------
    {
      key: 'q1',
      sequence: 1,
      title: 'Frame Your Pitch & Pick Your Tests',
      description:
        'Put what you are exploring into plain words, check how you can reach people this week, and choose the tests you will run.',
      nodes: [
        {
          key: 'm3-q1-access',
          sequence: 1,
          role: 'investigation',
          title: 'How can you reach people this week?',
          description: `A few quick questions about where you can show up and what you're comfortable doing right now. There are no wrong answers—this just narrows down tests that actually fit you.`,
          prompt: 'Which ways of reaching people are realistic for you this week?',
          intent:
            'Capture practical channel access (online communities, simple web page, small ad budget, in-person/local access, warm contacts) and weekly hours. No AI.',
          component: 'test_access_profile',
          dependencies: ['m3-setup'],
        },
        {
          key: 'm3-q1-pitch',
          sequence: 2,
          role: 'investigation',
          title: 'Frame how you will put it.',
          description: `Before people can raise their hand, you need a clear, honest way to explain what you're exploring.

You don't need pricing or big promises. Focus on who this is for, what frustrates them today, the rough direction of how you'd help, and one small action they can take.`,
          prompt: 'How would you explain this to someone in a few plain sentences?',
          intent:
            'Guide the founder to draft their core pitch framing (audience, pain, direction of help without premature pricing, and small call to action), pre-assisted by their M2 project and approach.',
          component: 'pitch_framing',
          dependencies: ['m3-q1-access'],
        },
        {
          key: 'm3-q1-reveal',
          sequence: 3,
          role: 'reveal',
          title: 'How your pitch lands—and where to test it.',
          description: `Here is a quick look at your framing, a cleaner version if helpful, and the tests that fit your project and reach.`,
          intent:
            'AI Moment 1. Reviews the user pitch for clarity, jargon, or premature promises, offers 1–2 plain-spoken refinements, and pairs with deterministic experiment recommendations from $experimentBlueprints based on access profile and M2 approach.',
          component: 'pitch_and_test_reveal',
          dependencies: ['m3-q1-pitch'],
        },
        {
          key: 'm3-q1-action',
          sequence: 4,
          role: 'action',
          title: 'Choose the tests you will run.',
          description: `Pick one or more tests that you can realistically run over the next week. Each test you choose will be saved so you can prepare it, launch it, and track what comes back.`,
          prompt: 'Which tests do you want to run?',
          intent:
            'Allow the founder to select one or more tests from the recommended blueprint cards (or add a custom test), creating draft rows in user_experiments linked to the active project.',
          component: 'select_tests_action',
          dependencies: ['m3-q1-reveal'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 2 — Get Ready & Go Live
    // -------------------------------------------------------------------------
    {
      key: 'q2',
      sequence: 2,
      title: 'Get Ready & Go Live',
      description:
        'Set your bar before you start, prepare what you need for each test, and put it out into the world.',
      nodes: [
        {
          key: 'm3-q2-setup',
          sequence: 1,
          role: 'setup',
          title: 'Set things up before you go live.',
          description: `It's easy to look at a handful of likes afterward and talk yourself into thinking a test worked. Setting a clear bar beforehand keeps you honest.

In the next steps, you'll decide what counts as a real signal, get your page, post, or outreach ready, and put your test live.`,
          intent:
            'Frame Quest 2: why locking in thresholds before launch matters and what preparing each test involves. Read-only.',
          component: 'test_prep_setup',
          dependencies: ['m3-q1-action'],
        },
        {
          key: 'm3-q2-thresholds',
          sequence: 2,
          role: 'investigation',
          title: 'Decide what counts as a real signal.',
          description: `For each test you chose, set a realistic number that would tell you people genuinely want this solved. You can adjust the suggested starting point to match your reach.`,
          prompt: 'What would make you say this worked?',
          intent:
            'Per selected test in user_experiments, pre-fill the benchmark targets from blueprint metrics and let the user customize and lock in their target count, timeframe, and strong/weak signal notes.',
          component: 'test_thresholds',
          dependencies: ['m3-q2-setup'],
        },
        {
          key: 'm3-q2-prep',
          sequence: 3,
          role: 'investigation',
          title: 'Get everything in place.',
          description: `Use the checklist, guide, and copy-paste prompts for each test so everything is ready before you launch. You don't have to launch yet—just get the pieces ready.`,
          prompt: 'What do you need ready before going live?',
          intent:
            'Render a prep card per test in user_experiments with its readiness checklist, link to /resources/[slug], and a tailored copy-paste prompt for external LLM/builder tools.',
          component: 'test_preparation',
          dependencies: ['m3-q2-thresholds'],
        },
        {
          key: 'm3-q2-reveal',
          sequence: 4,
          role: 'reveal',
          title: 'A few things to watch out for.',
          description: `Before you hit publish or start reaching out, keep these practical heads-ups in mind for the tests you picked.`,
          intent:
            'Deterministic reveal assembled from blueprint heads_up rules for the user’s chosen test types—common pitfalls to avoid and small ways to get cleaner signals. No AI.',
          component: 'test_heads_up_reveal',
          dependencies: ['m3-q2-prep'],
        },
        {
          key: 'm3-q2-action',
          sequence: 5,
          role: 'action',
          title: 'Put your test live.',
          description: `Once your post is up, your page is published, or your outreach is underway, mark each test as live. If you have a public link or post, you can also share it with your peers in the forum.`,
          prompt: 'Ready to mark your tests live?',
          intent:
            'Mark selected user_experiments as live (recording started_at and optional live_url), optionally share to the forum via user_content, and advance to Quest 3.',
          component: 'test_launch_action',
          dependencies: ['m3-q2-reveal'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 3 — Log What Came Back & Decide
    // -------------------------------------------------------------------------
    {
      key: 'q3',
      sequence: 3,
      title: 'Log What Came Back & Decide',
      description:
        'Give your live tests a few days, record what people actually did and said, and decide your next move.',
      nodes: [
        {
          key: 'm3-q3-setup',
          sequence: 1,
          role: 'setup',
          title: `What happened isn't the same as what it means.`,
          description: `Real responses take a few days to come in. As they do, keep three things separate: what people actually did, what that might mean, and what you still don't know.

An honest zero is still a real result.`,
          intent:
            'Frame Quest 3: patience during the multi-day run and separating facts from interpretation. Read-only.',
          component: 'signal_reading_setup',
          dependencies: ['m3-q2-action'],
        },
        {
          key: 'm3-q3-log',
          sequence: 2,
          role: 'investigation',
          title: 'Log what came back.',
          description: `Return here as responses come in over the next few days. Record the numbers for each live test, add anyone who took a real step to your warm list, and save notable things people said.`,
          prompt: 'What happened when you put it out there?',
          intent:
            'Multi-day result logger updating user_experiments.results (metric values + notes), saving people who acted to user_contacts with role "warm", and saving quotes to user_observations (type: "experiment", focus: "problem_test").',
          component: 'test_run_log',
          dependencies: ['m3-q3-setup'],
          pacing: { delay_days: 5 },
          metadata: {
            guidance:
              'Replies take time. Most people need about five days before they can read anything into it.',
            observation: {
              type: 'experiment',
              domain: 'problem',
              focus: 'problem_test',
            },
          },
        },
        {
          key: 'm3-q3-read',
          sequence: 3,
          role: 'investigation',
          title: 'What do you make of it?',
          description: `Here is a structured read comparing what came back against the bar you set before launching. Correct anything that's off and add what you noticed firsthand.`,
          prompt: 'What do you make of what came back?',
          intent:
            'AI Moment 2. Organizes user_experiments results, locked thresholds, and logged quotes into: what the signals show (facts), what they might mean (possibilities), and what is still unclear. The user edits and saves their own read, which overrides the AI.',
          component: 'signal_reading',
          dependencies: ['m3-q3-log'],
        },
        {
          key: 'm3-q3-reveal',
          sequence: 4,
          role: 'reveal',
          title: 'Where do you stand?',
          description: `Here is the honest read across your tests: what the signals show, what you take from them, and where things stand.`,
          intent:
            'Deterministic readout from stored experiment results and thresholds. Names plainly which of four situations applies (wanted and people acting; wanted but nobody acting; acting but problem is vague; neither yet) and lets the user confirm or adjust it. No AI.',
          component: 'signal_reading_reveal',
          dependencies: ['m3-q3-read'],
        },
        {
          key: 'm3-q3-action',
          sequence: 5,
          role: 'action',
          title: 'What do you want to do next?',
          description: `There's no right answer. Move forward to planning, run a sharper test, go back and look at a different opportunity, or stop for now. Say why in your own words.`,
          prompt: 'What are you taking from this?',
          intent:
            'User selects a route and records their reasoning in their own words: continue to M4, iterate a test (creates pass_number + 1), switch to another M2 opportunity, or pause (creates a follow-up task). Continuing on a thin signal is allowed and recorded honestly.',
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
      'Assembles the complete Mission 3 story from user_experiments, user_observations, and user_contacts: what was tested, who responded, what they revealed, and an honest summary of signal strength. No AI.',
    component: 'mission3_synthesis',
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
      'Confirm the refined problem framing, review the warm list in user_contacts, and record the key thing to plan around entering Mission 4. Advances to m4-setup.',
    component: 'mission3_action',
    dependencies: ['m3-reveal'],
  },
};