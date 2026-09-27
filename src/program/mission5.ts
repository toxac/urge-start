// src/program/mission5.ts
import type { ProgramMission } from './types';

export const mission5: ProgramMission = {
  key: 'm5',
  version: 2,
  title: 'Build the Machine',
  sequence: 5,

  question: 'Can I turn this business blueprint into something real that can operate?',

  description:
    'Turn the M4 blueprint into the minimum business system, build the pieces in parallel, and run a real end-to-end alpha test.',

  transformation: {
    from: 'I know how this business is supposed to work.',
    to: 'I have built the minimum system needed to run this business and serve real customers.',
  },

  setup: {
    key: 'm5-setup',
    sequence: 1,
    role: 'setup',
    title: 'From blueprint to build',
    intent:
      'Bring the M4 Business Blueprint, assumptions and initial requirements into view and make the shift from designing the business to making it real.',
    component: 'build_starting_point',
    dependencies: ['m4-reveal'],
  },

  quests: [
    {
      key: 'q1',
      sequence: 1,
      title: 'Turn the Plan Into Requirements',
      description:
        'Work out what actually has to exist before you can put the whole business through an alpha test.',
      nodes: [
        {
          key: 'm5-q1-setup',
          sequence: 1,
          role: 'setup',
          title: 'A plan does not serve customers.',
          intent:
            'Create the shift from a business blueprint to the concrete things that must exist for the business to operate.',
          component: 'build_requirements_setup',
          dependencies: ['m5-setup'],
        },
        {
          key: 'm5-q1-product',
          sequence: 2,
          role: 'investigation',
          title: 'What must exist to deliver the promise?',
          intent:
            'Identify the minimum product, prototype, service package, materials, suppliers, technology and delivery capabilities required to fulfil the offer.',
          component: 'requirements_product',
          dependencies: ['m5-q1-setup'],
        },
        {
          key: 'm5-q1-marketing',
          sequence: 3,
          role: 'investigation',
          title: 'What must exist to get customers interested?',
          intent:
            'Identify the minimum marketing assets, channels, messaging, content, lead capture, outreach and tracking required by the M4 acquisition system.',
          component: 'requirements_marketing',
          dependencies: ['m5-q1-setup'],
        },
        {
          key: 'm5-q1-sales',
          sequence: 4,
          role: 'investigation',
          title: 'What must exist to make the sale?',
          intent:
            'Identify what must exist to turn leads into transactions, including sales materials, process, proposals, follow-up, payment and onboarding.',
          component: 'requirements_sales',
          dependencies: ['m5-q1-setup'],
        },
        {
          key: 'm5-q1-delivery',
          sequence: 5,
          role: 'investigation',
          title: 'What must exist to keep the promise?',
          intent:
            'Identify the onboarding, delivery process, tools, suppliers, quality controls and support required to fulfil the offer.',
          component: 'requirements_delivery',
          dependencies: ['m5-q1-setup'],
        },
        {
          key: 'm5-q1-finance',
          sequence: 6,
          role: 'investigation',
          title: 'What must exist to run the business?',
          intent:
            'Identify the minimum payments, invoicing, expense tracking, accounting, customer records and operating tools required to run the alpha.',
          component: 'requirements_finance_operations',
          dependencies: ['m5-q1-setup'],
        },
        {
          key: 'm5-q1-build-map',
          sequence: 7,
          role: 'investigation',
          title: 'Build the map.',
          intent:
            'Turn requirements into actionable build items with priority, status, dependencies and an explicit distinction between what must exist for alpha and what can wait.',
          component: 'build_requirements_map',
          dependencies: [
            'm5-q1-product',
            'm5-q1-marketing',
            'm5-q1-sales',
            'm5-q1-delivery',
            'm5-q1-finance',
          ],
        },
        {
          key: 'm5-q1-reveal',
          sequence: 8,
          role: 'reveal',
          title: 'Your build map',
          intent:
            'Show the smallest set of things that need to exist for the first meaningful end-to-end test, while making deferred scope visible.',
          component: 'build_requirements_reveal',
          dependencies: ['m5-q1-build-map'],
        },
        {
          key: 'm5-q1-action',
          sequence: 9,
          role: 'action',
          title: 'Start building.',
          intent:
            'Commit the build map into the project workspace and open the parallel Build Dashboard rather than continuing through a linear lesson sequence.',
          component: 'build_requirements_action',
          dependencies: ['m5-q1-reveal'],
        },
      ],
    },

    {
      key: 'q2',
      sequence: 2,
      title: 'Build the Machine',
      description:
        'Stop moving through a lesson sequence. Work on the business itself, with the product, market, sales, delivery and operating pieces developing together.',
      nodes: [
        {
          key: 'm5-q2-setup',
          sequence: 1,
          role: 'setup',
          title: 'Build the business, not the checklist.',
          intent:
            "Introduce the Build Dashboard as the user's primary workspace and explain that the business now needs parallel work rather than a fixed linear sequence.",
          component: 'build_dashboard_setup',
          dependencies: ['m5-q1-action'],
        },
        {
          key: 'm5-q2-build',
          sequence: 2,
          role: 'investigation',
          title: 'Build what needs to exist.',
          intent:
            'Let the user work across build areas, tasks, dependencies, blockers, notes and assets until the alpha-critical system is ready.',
          component: 'build_dashboard',
          dependencies: ['m5-q1-action'],
        },
        {
          key: 'm5-q2-readiness',
          sequence: 3,
          role: 'reveal',
          title: 'Are you ready to test the whole thing?',
          intent:
            'Assess whether the alpha-critical product, market, sales, delivery, operations and finance pieces can work together in a real customer journey.',
          component: 'alpha_readiness_reveal',
          dependencies: ['m5-q2-build'],
        },
        {
          key: 'm5-q2-action',
          sequence: 4,
          role: 'action',
          title: 'Make it testable.',
          intent:
            'Either create the remaining work needed for alpha readiness or move the project into alpha planning when the minimum system is genuinely ready.',
          component: 'alpha_readiness_action',
          dependencies: ['m5-q2-readiness'],
        },
      ],
    },

    {
      key: 'q3',
      sequence: 3,
      title: 'Alpha Test',
      description:
        'Put the whole business through one real customer journey and find out what breaks, what works and what you need to change.',
      nodes: [
        {
          key: 'm5-q3-setup',
          sequence: 1,
          role: 'setup',
          title: 'Does the whole thing work?',
          intent:
            'Shift from building individual pieces to testing the complete business experience end to end.',
          component: 'alpha_test_setup',
          dependencies: ['m5-q2-action'],
        },
        {
          key: 'm5-q3-plan',
          sequence: 2,
          role: 'investigation',
          title: 'Plan the alpha.',
          intent:
            'Define the customer or tester, scenario, offer, expected outcome, project-specific criteria, constraints and evidence to capture.',
          component: 'alpha_test_plan',
          dependencies: ['m5-q3-setup'],
        },
        {
          key: 'm5-q3-testers',
          sequence: 3,
          role: 'investigation',
          title: 'Who will try it?',
          intent:
            'Select or add realistic alpha testers using the shared relationship layer, while preserving their existing context.',
          component: 'alpha_testers',
          dependencies: ['m5-q3-plan'],
        },
        {
          key: 'm5-q3-run',
          sequence: 4,
          role: 'investigation',
          title: 'Run the alpha.',
          intent:
            'Run the complete customer journey with the selected testers through marketing, sales, payment, onboarding, product or service delivery and support.',
          component: 'alpha_test_run',
          dependencies: ['m5-q3-testers'],
        },
        {
          key: 'm5-q3-capture',
          sequence: 5,
          role: 'investigation',
          title: 'Capture what happened.',
          intent:
            'Record actual behaviour, customer responses, delivery problems, costs, time, friction and operational problems without prematurely interpreting them.',
          component: 'alpha_test_capture',
          dependencies: ['m5-q3-run'],
        },
        {
          key: 'm5-q3-assessment',
          sequence: 6,
          role: 'investigation',
          title: 'What worked? What broke?',
          intent:
            "Assess the alpha evidence across product or service, customer experience, marketing, sales, delivery, economics and operations against the project's criteria.",
          component: 'alpha_test_assessment',
          dependencies: ['m5-q3-capture'],
        },
        {
          key: 'm5-q3-reveal',
          sequence: 7,
          role: 'reveal',
          title: 'What did the alpha teach us?',
          intent:
            'Show what worked, what failed, what evidence supports each finding and which M4 assumptions were contradicted or strengthened.',
          component: 'alpha_test_reveal',
          dependencies: ['m5-q3-assessment'],
        },
        {
          key: 'm5-q3-action',
          sequence: 8,
          role: 'action',
          title: 'What do you do with that?',
          intent:
            'Let the user route the project based on the evidence: pass into M6, or diagnose the failed assumption and route targeted rework to M4 before rebuilding.',
          component: 'alpha_test_action',
          dependencies: ['m5-q3-reveal'],
        },
      ],
    },
  ],

  reveal: {
    key: 'm5-reveal',
    sequence: 1,
    role: 'reveal',
    title: 'You built something real.',
    intent:
      'Show the transformation from business blueprint to minimum working business system and the evidence produced by the alpha test.',
    component: 'mission_transformation_synthesis',
  },

};
