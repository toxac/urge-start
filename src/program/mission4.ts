import type { ProgramMission } from './types';

/**
 * Mission 4 — Make the Business Work
 *
 * M4 turns the evidence from M3 into a concrete, deliverable first offer 
 * whose numbers actually work. We are not writing a 30-page business plan.
 * We are designing the smallest possible thing someone will pay for.
 *
 * Core Flow:
 *   - Q1: Define the Minimum Sellable Offer (Personas, Ruthless Cuts, v1 Offer)
 *   - Q2: Make the Math Work (CSV workflow, reality check, lock price)
 *   - Q3: Reach New Customers (Traction experiment, log results, decide)
 *   - Wrap-Up: The One-Page Working Blueprint
 *
 * AI appears at three specific moments:
 *   1. m4-q1-reveal: Assesses the proposed v1 offer against personas & cuts.
 *   2. m4-q2-reveal: Reality check on the uploaded CSV unit economics.
 *   3. m4-q3-read: Reads the signals from the traction/acquisition experiment.
 */
export const mission4: ProgramMission = {
  key: 'mission-4',
  version: 3,
  title: 'Make the Business Work',
  sequence: 4,

  question: 'Can I design a business that actually makes sense?',

  description:
    'Turn your validated problem into a specific first offer, prove the basic math works, and test a repeatable way to reach new customers.',

  transformation: {
    from: 'I have evidence that people want this problem solved.',
    to: 'I have a concrete, priced offer, I know my math works, and I know how to reach buyers.',
  },

  setup: {
    key: 'm4-setup',
    sequence: 1,
    role: 'setup',
    title: 'From validated problem to sellable offer.',
    description: `You have real evidence that people want this solved. Now it's time to design the smallest possible version of your solution that someone will actually pay for.
    
We are not writing a business plan. You will define a concrete first offer, do the basic math, and prove you can reach new customers beyond your warm list.`,
    intent:
      'Orient the founder: Focus on the Minimum Sellable Product (MSP) and unit economics. Pulls in the M3 problem statement, warm list, and key constraint. Read-only.',
    component: 'business_starting_point',
    dependencies: ['m3-action'],
  },

  quests: [
    // -------------------------------------------------------------------------
    // Quest 1 — The Minimum Sellable Offer
    // -------------------------------------------------------------------------
    {
      key: 'q1',
      sequence: 1,
      title: 'Define Your First Offer',
      description:
        'Get clear about exactly who you are serving, what they get, and what you are cutting out of version 1.',
      nodes: [
        {
          key: 'm4-q1-personas',
          sequence: 1,
          role: 'investigation',
          title: 'Who exactly has this problem?',
          description: `Look back at the people you spoke to in Mission 2 and Mission 3. Fill out a quick profile for 2 or 3 of them so we can extract exactly who you are building this for.`,
          prompt: 'Who are the specific people feeling this the most?',
          intent:
            'Founder inputs raw profiles of people they observed/interacted with. AI will extract 1-2 concrete customer personas (saved to project metadata).',
          component: 'customer_personas',
          dependencies: ['m4-setup'],
        },
        {
          key: 'm4-q1-cut',
          sequence: 2,
          role: 'investigation',
          title: 'The ruthless cut.',
          description: `List everything you want your solution to do. Then, force every item into either "Must have to sell (v1)" or "Cut for later." Be ruthless—keep the scope small enough that you can actually deliver it.`,
          prompt: 'What is absolutely required to sell this?',
          intent:
            'Forcing function to define the Minimum Sellable Product. Founder categorizes features/deliverables. Saves to project metadata.',
          component: 'ruthless_cut',
          dependencies: ['m4-q1-personas'],
        },
        {
          key: 'm4-q1-reveal',
          sequence: 3,
          role: 'reveal',
          title: 'How your v1 offer shapes up.',
          description: `Here is a look at what you are proposing to sell, checked against the people you are building it for and the problem they want solved.`,
          intent:
            'AI Moment 1. Reviews the personas, the M3 quotes, and the Must-Have/Cut list to suggest concrete refinements for their v1 offer promise.',
          component: 'offer_assessment_reveal',
          dependencies: ['m4-q1-cut'],
        },
        {
          key: 'm4-q1-action',
          sequence: 4,
          role: 'action',
          title: 'Lock your v1 offer.',
          description: `Write the exact promise you will make to your first customers: the outcome they get, what is included, what is excluded, and your unique hook.`,
          prompt: 'What exactly are you selling in version 1?',
          intent:
            'Founder finalizes their concrete v1 offer, saving it to user_project_offers and setting it as the selected_offer_id for the project.',
          component: 'offer_lock_action',
          dependencies: ['m4-q1-reveal'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 2 — Make the Math Work
    // -------------------------------------------------------------------------
    {
      key: 'q2',
      sequence: 2,
      title: 'Make the Math Work',
      description:
        'Download your financial template, do the math to see if this makes money, and lock in your starting price.',
      nodes: [
        {
          key: 'm4-q2-sheet',
          sequence: 1,
          role: 'investigation',
          title: 'Do the basic math.',
          description: `Download the spreadsheet template that matches your business type. Fill in your estimated costs and starting price, then upload it back here so we can read the numbers.`,
          prompt: 'Does one order actually make money?',
          intent:
            'Provide a downloadable CSV template (Unit Economics, Fixed-Cost Breakeven, Time Pricing) based on M2 business type. User uploads filled CSV, parsed data saves to project economics metadata.',
          component: 'economics_sheet',
          dependencies: ['m4-q1-action'],
        },
        {
          key: 'm4-q2-reveal',
          sequence: 2,
          role: 'reveal',
          title: 'A reality check on your numbers.',
          description: `Here is what your uploaded numbers actually mean for your time, your margins, and how many customers you need to break even.`,
          intent:
            'AI Moment 2. Parses the economics metadata and checks it against M1 time/money boundaries to give a plain-spoken reality check (e.g., "You need to sell 800 units just to replace your income").',
          component: 'economics_reality_check',
          dependencies: ['m4-q2-sheet'],
        },
        {
          key: 'm4-q2-action',
          sequence: 3,
          role: 'action',
          title: 'Lock your price and revenue model.',
          description: `Based on your math, confirm your starting price and exactly how cash will move (upfront, subscription, etc.). If you aren't sure about a delivery cost yet, you can flag it for a dry run.`,
          prompt: 'How will you charge for this?',
          intent:
            'Lock the starting price and payment model to the selected offer. If costs/hours are uncertain, optionally queue a delivery_cost_dry_run experiment.',
          component: 'economics_lock_action',
          dependencies: ['m4-q2-reveal'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 3 — Reach New Customers & Test Traction
    // -------------------------------------------------------------------------
    {
      key: 'q3',
      sequence: 3,
      title: 'Reach New Customers',
      description:
        'Pick one channel to reach new people beyond your warm list, and test your priced offer in the real world.',
      nodes: [
        {
          key: 'm4-q3-channel',
          sequence: 1,
          role: 'investigation',
          title: 'Where will new customers come from?',
          description: `Your warm list won't last forever. Pick one realistic channel to reach strangers, write one message, and choose how you'll test it.`,
          prompt: 'How will you put your priced offer in front of new people?',
          intent:
            'Founder selects an acquisition channel, drafts an outreach message, and queues a Mission 4 traction experiment (priced_offer_outreach or new_channel_offer_drop) in user_experiments.',
          component: 'acquisition_channel_pick',
          dependencies: ['m4-q2-action'],
        },
        {
          key: 'm4-q3-log',
          sequence: 2,
          role: 'investigation',
          title: 'Run your traction test.',
          description: `Put your priced v1 offer into the world. Over the next few days, log exactly how people respond when real money is on the line.`,
          prompt: 'What happened when you asked them to buy?',
          intent:
            'Multi-day logger for the chosen traction experiment. Records metric values, quotes, and new warm leads who accepted the price.',
          component: 'traction_run_log',
          dependencies: ['m4-q3-channel'],
          pacing: { delay_days: 4 },
        },
        {
          key: 'm4-q3-read',
          sequence: 3,
          role: 'reveal',
          title: 'What the market said about your offer.',
          description: `Here is a read on how your priced offer landed with real people, separating facts from guesses.`,
          intent:
            'AI Moment 3. Reads the results of the traction experiment (Shows, Might Mean, Unclear).',
          component: 'traction_signal_read',
          dependencies: ['m4-q3-log'],
        },
        {
          key: 'm4-q3-action',
          sequence: 4,
          role: 'action',
          title: 'Are you ready to build?',
          description: `Look at the math and the market response. Decide whether this offer and channel are solid enough to move into the build phase, or if you need to adjust your price or scope first.`,
          prompt: 'What is your next move?',
          intent:
            'Founder decides to proceed to M5, iterate the traction test, adjust the offer price/scope, or pause.',
          component: 'traction_route_action',
          dependencies: ['m4-q3-read'],
        },
      ],
    },
  ],

  reveal: {
    key: 'm4-reveal',
    sequence: 1,
    role: 'reveal',
    title: 'Your Minimum Sellable Blueprint.',
    intent:
      'Deterministically assembles the one-page working business plan: The Offer, Pains/Gains, Must-Have list, Price, Math, and validated Channel. Downloadable as PDF/Markdown.',
    component: 'mission4_synthesis',
    dependencies: ['m4-q3-action'],
  },

  action: {
    key: 'm4-action',
    sequence: 2,
    role: 'action',
    title: 'Lock your build requirements.',
    description: `You have designed the business. In Mission 5, you will build exactly this and nothing more. Let's lock in the checklist of what must exist before you can take your first real order.`,
    prompt: 'What do you absolutely have to set up to deliver v1?',
    intent:
      'Finalizes the minimum build/delivery checklist (saved to mspRequirements) and advances to m5-setup.',
    component: 'mission4_action',
    dependencies: ['m4-reveal'],
  },
};