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
    // Quest 2 — Costs, Unit Economics & Pricing
    // -------------------------------------------------------------------------
    {
      key: 'q2',
      sequence: 2,
      title: 'Make the Math Work',
      description:
        'List all your real costs, understand the anatomy of one sale, choose a pricing approach, and see how price, volume, and hours connect before locking in.',
      nodes: [
        {
          key: 'm4-q2-costs',
          sequence: 1,
          role: 'investigation',
          title: 'List all your real costs.',
          description: `Get every expense out of your head and into one simple worksheet—one-time setup costs, monthly fixed bills, direct per-sale costs, and your own hours. Mark anything you are guessing as "Estimate."`,
          prompt: 'What does it actually cost to set up, run, and deliver one sale?',
          intent:
            'Download the universal costs CSV template (Setup, Fixed, Variable, Time + Confirmed/Estimate status), fill it in Google Sheets/Excel, and upload back to user_projects.metadata.economics.',
          component: 'costs_ledger',
          dependencies: ['m4-q1-action'],
        },
        {
          key: 'm4-q2-unit-economics',
          sequence: 2,
          role: 'investigation',
          title: 'Understand one sale.',
          description: `Before picking a price, look at what a single order or client actually costs you in cash and hours—and what it might cost to win one buyer.`,
          prompt: 'What goes into delivering and winning a single customer?',
          intent:
            'Break down single-unit economics (direct variable cost, founder hours per sale, estimated customer acquisition cost) alongside monthly fixed overhead and one-time setup.',
          component: 'unit_economics_breakdown',
          dependencies: ['m4-q2-costs'],
        },
        {
          key: 'm4-q2-pricing',
          sequence: 3,
          role: 'investigation',
          title: 'Choose how to price your offer.',
          description: `Pricing isn't just marking up your costs. Compare four practical ways to anchor a price and pick a starting point that makes sense for both the buyer and your time.`,
          prompt: 'Which pricing approach and starting price fit best?',
          intent:
            'Compare Cost-Plus Floor, Workaround Anchor, Outcome/Value Saved, and Capacity & Income Target lenses, then select an initial candidate price and rationale.',
          component: 'pricing_approaches',
          dependencies: ['m4-q2-unit-economics'],
        },
        {
          key: 'm4-q2-reveal',
          sequence: 4,
          role: 'reveal',
          title: 'Your pricing in action.',
          description: `Move the sliders to see how price, monthly sales volume, and acquisition cost affect your profit, break-even point, and weekly hours—alongside a candid reality check.`,
          intent:
            'AI Moment 2 + interactive sliders for Price, Monthly Sales Volume, and CAC showing live profit, break-even volume, setup payback, and weekly hours against M1 limits.',
          component: 'pricing_in_action_reveal',
          dependencies: ['m4-q2-pricing'],
        },
        {
          key: 'm4-q2-action',
          sequence: 5,
          role: 'action',
          title: 'Lock your price and payment model.',
          description: `Confirm your starting price and how cash will move. If any cost or delivery time in your sheet was a guess, queue a quick dry run to verify it.`,
          prompt: 'Are you ready to lock this price and payment model?',
          intent:
            'Lock final starting price and payment_model onto user_project_offers and user_projects.metadata.economics, and optionally queue delivery_cost_dry_run in user_experiments.',
          component: 'price_lock_action',
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