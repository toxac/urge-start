import type { ProgramMission } from './types';

/**
 * Mission 6 — Operate, Diagnose & Grow (3–6 Month Copilot)
 *
 * Non-sequential post-launch operating phase:
 *   - Setup: Orient to fundamentals-first operating mode
 *   - Q1: Set 3/6-month horizon & quarterly targets + connect integrations / upload CSV data
 *   - Q2: Run the business inside /program/operate (Baseline -> Gap Analysis -> Founder Diagnosis -> Preset Planners -> Tasks / Hypothesis Experiments)
 *   - Q3: 3/6-month strategic crossroads (Keep Steady, Scale, Pivot, or Close Cleanly)
 */
export const mission6: ProgramMission = {
  key: 'mission-6',
  version: 2,
  title: 'Operate & Grow',
  sequence: 6,

  question:
    'Can I run this business sustainably, deliver real customer value, and hit my quarterly goals?',

  description:
    'Set your 3- or 6-month operating targets, connect your sales and traffic data, and use the Operate Copilot whenever you ask "what do I do next?" across Market, Money, and Customer.',

  transformation: {
    from: 'I just launched v1 and made my first initial sales.',
    to: 'I run a disciplined, self-diagnosing operation with clear unit economics, repeatable acquisition, and proven customer value.',
  },

  setup: {
    key: 'm6-setup',
    sequence: 1,
    role: 'setup',
    title: 'The training wheels come off—fundamentals take over.',
    description: `You no longer have a rigid step-by-step checklist. Running a real business means watching three loops every week: Market (bringing in and converting the right buyers), Money (protecting margins and cash), and Customer (delivering the promised outcome so buyers stay and refer).

Over the next 3 or 6 months, you will feed real numbers into your Operate Copilot, diagnose bottlenecks yourself first, and run focused tasks or 7–14 day hypothesis tests.`,
    intent:
      'Orient the founder to post-launch operating rhythm and the Market / Money / Customer framework.',
    component: 'operate_starting_point',
    dependencies: ['m5-action'],
  },

  quests: [
    // -------------------------------------------------------------------------
    // Quest 1 — Quarterly Goals & Data Ingest
    // -------------------------------------------------------------------------
    {
      key: 'q1',
      sequence: 1,
      title: 'Set Quarterly Goals & Data Feeds',
      description:
        'Lock your 3- or 6-month operating targets and set up weekly sales, traffic, and expense tracking.',
      nodes: [
        {
          key: 'm6-q1-goals',
          sequence: 1,
          role: 'investigation',
          title: 'Choose your operating horizon & quarterly targets.',
          description: `Decide whether you are running a 3-month or 6-month operating cycle, and set concrete monthly revenue, active customer, repeat-rate, and weekly hour limits anchored against your Mission 4 unit economics.`,
          prompt: 'What are your concrete targets for this operating window?',
          intent:
            'Saves horizon (3_months | 6_months) and quarterly goals into user_ops (record_type: goal).',
          component: 'operate_goals_setup',
          dependencies: ['m6-setup'],
        },
        {
          key: 'm6-q1-ingest',
          sequence: 2,
          role: 'action',
          title: 'Connect data feeds or upload your baseline CSVs.',
          description: `Connect your payment/analytics tools—or download the clean CSV templates for Sales, Traffic & Campaigns, and Expenses—so your Operate Copilot always sees real numbers.`,
          prompt: 'How will your weekly sales, traffic, and expense data flow in?',
          intent:
            'Provides integration toggles + CSV template downloads/uploads for user_ops_sales, user_ops_traffic, and user_ops_expenses.',
          component: 'operate_data_ingest',
          dependencies: ['m6-q1-goals'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 2 — Run the Business in /program/operate
    // -------------------------------------------------------------------------
    {
      key: 'q2',
      sequence: 2,
      title: 'Run & Improve in the Operate Copilot',
      description:
        'Use /program/operate daily or weekly to spot gaps, diagnose causes, plan across Market, Money, and Customer, and run hypothesis tests.',
      nodes: [
        {
          key: 'm6-q2-operate',
          sequence: 1,
          role: 'action',
          title: 'Operate your business for your 3–6 month window.',
          description: `Open the Operate Copilot whenever you wonder "what do I do next?" Upload weekly numbers, diagnose gaps before generating plans, and track your tasks and 7–14 day hypothesis experiments. When your operating window is complete, move to your strategic crossroads.`,
          prompt: 'Ready to review your 3/6-month operating results?',
          intent:
            'Links to /program/operate non-sequential workspace and completes once the founder finishes their operating window.',
          component: 'operate_workspace_entry',
          dependencies: ['m6-q1-ingest'],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // Quest 3 — 3/6-Month Strategic Crossroads
    // -------------------------------------------------------------------------
    {
      key: 'q3',
      sequence: 3,
      title: 'Decide Your Next Move',
      description:
        'Review 3–6 months of real operating evidence and decide whether to keep running steady, scale up, pivot, or close cleanly.',
      nodes: [
        {
          key: 'm6-q3-crossroads',
          sequence: 1,
          role: 'action',
          title: 'Choose the next chapter for your business.',
          description: `Look honestly at your cumulative revenue, net profit, effective hourly pay, and customer retention. Commit to one clear path forward.`,
          prompt: 'Based on your real operating numbers, what is your next move?',
          intent:
            'Captures the founder strategic crossroads decision (keep_steady | scale_up | pivot | close_cleanly) and rationale.',
          component: 'operate_crossroads_decision',
          dependencies: ['m6-q2-operate'],
        },
      ],
    },
  ],

  reveal: {
    key: 'm6-reveal',
    sequence: 1,
    role: 'reveal',
    title: 'Your Operating Scorecard & Proven Playbook.',
    intent:
      'Synthesizes cumulative revenue, profit, effective hourly pay, validated experiments, and repeatable growth levers.',
    component: 'mission6_synthesis',
    dependencies: ['m6-q3-crossroads'],
  },

  action: {
    key: 'm6-action',
    sequence: 2,
    role: 'action',
    title: 'Lock your next 30-day roadmap.',
    description: `Turn your strategic decision into concrete next actions—whether scaling your winning channel, spinning up a v2.0 build, or wrapping up cleanly.`,
    prompt: 'Ready to lock in your next chapter?',
    intent:
      'Updates user_projects status and generates next-chapter tasks in user_tasks.',
    component: 'mission6_action',
    dependencies: ['m6-reveal'],
  },
};