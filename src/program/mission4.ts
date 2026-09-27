// src/program/mission4.ts
import type { ProgramMission } from './types';

export const mission4: ProgramMission = {
  key: 'mission-4',
  version: 2,
  title: 'Make the Business Work',
  sequence: 4,

  question: 'Can I design a business that actually makes sense?',

  description:
    'Turn the evidence from M3 into a business blueprint: who it serves, how people find it, how they buy, how the promise is delivered, and how the money works.',

  transformation: {
    from: 'I have evidence that people may buy this.',
    to: 'I can see how this business will attract customers, make sales, deliver value, and make money.',
  },

  setup: {
    key: 'm4-setup',
    sequence: 1,
    role: 'setup',
    title: 'From tested offer to business',
    intent:
      'Bring the project, tested offer, market evidence, people and important unknowns from M2 and M3 into view before designing the business around them.',
    component: 'business_starting_point',
    dependencies: ['m3-reveal'],
  },

  quests: [
    {
      key: 'q1',
      sequence: 1,
      title: 'Define the Business',
      description:
        'Get clear about who this business is for, what it sells, and why someone would choose it.',
      nodes: [
        {
          key: 'm4-q1-setup',
          sequence: 1,
          role: 'setup',
          title: 'An offer is not a business.',
          intent:
            'Make the shift from a tested offer to a complete business visible without throwing away the evidence already gathered.',
          component: 'business_definition_setup',
          dependencies: ['m4-setup'],
        },
        {
          key: 'm4-q1-customer',
          sequence: 2,
          role: 'investigation',
          title: 'Who is the customer?',
          intent:
            'Define the specific customer segment and situation the business is designed around, using M2 conversations and M3 market responses rather than assumptions alone.',
          component: 'business_customer_definition',
          dependencies: ['m4-q1-setup'],
        },
        {
          key: 'm4-q1-offer',
          sequence: 3,
          role: 'investigation',
          title: 'What are we selling?',
          intent:
            'Clarify what the customer is actually buying, the outcome it creates, what is included, and what is deliberately left out.',
          component: 'business_offer_definition',
          dependencies: ['m4-q1-customer'],
        },
        {
          key: 'm4-q1-positioning',
          sequence: 4,
          role: 'investigation',
          title: 'Why choose us?',
          intent:
            'Define the reason this customer might choose the offer instead of doing nothing or using an alternative, grounded in evidence rather than invented differentiation.',
          component: 'business_positioning',
          dependencies: ['m4-q1-offer'],
        },
        {
          key: 'm4-q1-reveal',
          sequence: 5,
          role: 'reveal',
          title: 'The business concept',
          intent:
            'Bring customer, problem, outcome, offer and positioning together so the business can be seen as one thing.',
          component: 'business_definition_reveal',
          dependencies: ['m4-q1-positioning'],
        },
        {
          key: 'm4-q1-action',
          sequence: 6,
          role: 'action',
          title: 'Make the business clear enough to design.',
          intent:
            'Turn contradictions or missing pieces into concrete project tasks, or carry the coherent business concept into customer acquisition design.',
          component: 'business_definition_action',
          dependencies: ['m4-q1-reveal'],
        },
      ],
    },

    {
      key: 'q2',
      sequence: 2,
      title: 'Design Customer Acquisition',
      description:
        'Figure out how the right people will find the business and how attention can become a real lead.',
      nodes: [
        {
          key: 'm4-q2-setup',
          sequence: 1,
          role: 'setup',
          title: 'Customers have to find you.',
          intent:
            'Shift attention from what the business is to how the chosen customer will encounter it.',
          component: 'customer_acquisition_setup',
          dependencies: ['m4-q1-action'],
        },
        {
          key: 'm4-q2-channels',
          sequence: 2,
          role: 'investigation',
          title: 'Where are the customers?',
          intent:
            'Identify realistic places, relationships, channels and situations where the target customer already spends attention or looks for solutions.',
          component: 'acquisition_channels',
          dependencies: ['m4-q2-setup'],
        },
        {
          key: 'm4-q2-message',
          sequence: 3,
          role: 'investigation',
          title: 'What will get their attention?',
          intent:
            'Develop a customer-relevant message from the problem, outcome, evidence and offer already established.',
          component: 'acquisition_message',
          dependencies: ['m4-q2-channels'],
        },
        {
          key: 'm4-q2-path',
          sequence: 4,
          role: 'investigation',
          title: 'How will interest become a lead?',
          intent:
            'Design the small next step that turns attention into an identifiable person or opportunity the business can follow up with.',
          component: 'acquisition_path',
          dependencies: ['m4-q2-message'],
        },
        {
          key: 'm4-q2-reveal',
          sequence: 5,
          role: 'reveal',
          title: 'The marketing system',
          intent:
            'Show the path from where customers are to the message they encounter to the action that creates a lead.',
          component: 'marketing_system_reveal',
          dependencies: ['m4-q2-path'],
        },
        {
          key: 'm4-q2-action',
          sequence: 6,
          role: 'action',
          title: 'Give the marketing system somewhere to live.',
          intent:
            'Create concrete requirements for the first acquisition system rather than merely agreeing with the plan.',
          component: 'marketing_system_action',
          dependencies: ['m4-q2-reveal'],
        },
      ],
    },

    {
      key: 'q3',
      sequence: 3,
      title: 'Design Sales',
      description:
        'Figure out what happens between someone becoming interested and becoming a paying customer.',
      nodes: [
        {
          key: 'm4-q3-setup',
          sequence: 1,
          role: 'setup',
          title: 'Interest is not revenue.',
          intent:
            'Make the gap visible between generating a lead and completing a sale.',
          component: 'sales_system_setup',
          dependencies: ['m4-q2-action'],
        },
        {
          key: 'm4-q3-journey',
          sequence: 2,
          role: 'investigation',
          title: 'Design the sales journey.',
          intent:
            'Map what happens from first meaningful conversation or inquiry through qualification, proposal, purchase and onboarding handoff.',
          component: 'sales_journey',
          dependencies: ['m4-q3-setup'],
        },
        {
          key: 'm4-q3-objections',
          sequence: 3,
          role: 'investigation',
          title: 'What could stop the sale?',
          intent:
            'Use actual objections, confusion and hesitation from M2/M3 evidence to identify what could prevent a purchase.',
          component: 'sales_objections',
          dependencies: ['m4-q3-journey'],
        },
        {
          key: 'm4-q3-transaction',
          sequence: 4,
          role: 'investigation',
          title: 'Make buying possible.',
          intent:
            'Design the practical transaction path: price, payment, agreement, scheduling, onboarding and handoff.',
          component: 'sales_transaction',
          dependencies: ['m4-q3-objections'],
        },
        {
          key: 'm4-q3-reveal',
          sequence: 5,
          role: 'reveal',
          title: 'The sales system',
          intent:
            'Make the journey from lead to customer visible and expose friction, missing assets and handoff gaps.',
          component: 'sales_system_reveal',
          dependencies: ['m4-q3-transaction'],
        },
        {
          key: 'm4-q3-action',
          sequence: 6,
          role: 'action',
          title: 'Make the sale possible.',
          intent:
            'Turn the sales design into concrete requirements and tasks needed to accept and process the first customers.',
          component: 'sales_system_action',
          dependencies: ['m4-q3-reveal'],
        },
      ],
    },

    {
      key: 'q4',
      sequence: 4,
      title: 'Design Delivery',
      description:
        'Now ask the harder question: if people buy, can you actually keep the promise?',
      nodes: [
        {
          key: 'm4-q4-setup',
          sequence: 1,
          role: 'setup',
          title: 'Now you have to keep the promise.',
          intent:
            'Shift from acquiring customers to reliably delivering what they bought.',
          component: 'delivery_system_setup',
          dependencies: ['m4-q3-action'],
        },
        {
          key: 'm4-q4-flow',
          sequence: 2,
          role: 'investigation',
          title: 'How will we deliver?',
          intent:
            'Map the customer delivery journey from purchase or handoff to completed outcome and support.',
          component: 'delivery_flow',
          dependencies: ['m4-q4-setup'],
        },
        {
          key: 'm4-q4-resources',
          sequence: 3,
          role: 'investigation',
          title: 'What will it take?',
          intent:
            'Identify people, time, suppliers, tools, technology, materials, capacity and operational dependencies required to deliver the promise.',
          component: 'delivery_resources',
          dependencies: ['m4-q4-flow'],
        },
        {
          key: 'm4-q4-quality',
          sequence: 4,
          role: 'investigation',
          title: 'What does good delivery look like?',
          intent:
            'Define the minimum standard the customer should reliably experience and how problems will be handled.',
          component: 'delivery_quality',
          dependencies: ['m4-q4-resources'],
        },
        {
          key: 'm4-q4-reveal',
          sequence: 5,
          role: 'reveal',
          title: 'The delivery model',
          intent:
            'Show what has to happen after the sale, what it requires, and where delivery could break.',
          component: 'delivery_model_reveal',
          dependencies: ['m4-q4-quality'],
        },
        {
          key: 'm4-q4-action',
          sequence: 6,
          role: 'action',
          title: 'Make the promise deliverable.',
          intent:
            'Create the concrete product/service and delivery requirements that must exist before the business can reliably serve customers.',
          component: 'delivery_system_action',
          dependencies: ['m4-q4-reveal'],
        },
      ],
    },

    {
      key: 'q5',
      sequence: 5,
      title: 'Make the Money Work',
      description:
        'Connect price, customers, volume, costs and capacity so you can see what has to be true for the business to support itself.',
      nodes: [
        {
          key: 'm4-q5-setup',
          sequence: 1,
          role: 'setup',
          title: 'Customers and revenue are not enough.',
          intent:
            'Frame the difference between having a business people want and having economics that can support the business.',
          component: 'finance_setup',
          dependencies: ['m4-q4-action'],
        },
        {
          key: 'm4-q5-revenue',
          sequence: 2,
          role: 'investigation',
          title: 'How does money come in?',
          intent:
            'Model price, products or services, volume, frequency and revenue per customer using the offer and sales model already designed.',
          component: 'finance_revenue_model',
          dependencies: ['m4-q5-setup'],
        },
        {
          key: 'm4-q5-costs',
          sequence: 3,
          role: 'investigation',
          title: 'Where does the money go?',
          intent:
            'Identify direct delivery costs, people, marketing, technology, overhead and other operating costs required by the designed business.',
          component: 'finance_cost_model',
          dependencies: ['m4-q5-revenue'],
        },
        {
          key: 'm4-q5-unit-economics',
          sequence: 4,
          role: 'investigation',
          title: 'What happens with one customer?',
          intent:
            'Understand the economics of acquiring and serving one customer, including revenue, direct cost, contribution and margin.',
          component: 'finance_unit_economics',
          dependencies: ['m4-q5-costs'],
        },
        {
          key: 'm4-q5-viability',
          sequence: 5,
          role: 'investigation',
          title: 'What has to be true?',
          intent:
            'Model break-even, cash requirements, customer volume and income potential, and expose the assumptions behind those numbers.',
          component: 'finance_viability',
          dependencies: ['m4-q5-unit-economics'],
        },
        {
          key: 'm4-q5-reveal',
          sequence: 6,
          role: 'reveal',
          title: 'The economics of the business',
          intent:
            'Show how customers, price, volume, revenue, costs, margin, break-even and cash requirements connect, without declaring the business viable or unviable.',
          component: 'finance_model_reveal',
          dependencies: [
            'm4-q5-revenue',
            'm4-q5-costs',
            'm4-q5-unit-economics',
            'm4-q5-viability',
          ],
        },
        {
          key: 'm4-q5-action',
          sequence: 7,
          role: 'action',
          title: 'What do you need to change?',
          intent:
            'Let the user respond to the economics by changing an assumption, creating a task, or accepting the current model as the working version for the blueprint.',
          component: 'finance_action',
          dependencies: ['m4-q5-reveal'],
        },
      ],
    },

    {
      key: 'q6',
      sequence: 6,
      title: 'Build the Business Blueprint',
      description:
        'Put the pieces together and make the business visible as one connected system.',
      nodes: [
        {
          key: 'm4-q6-setup',
          sequence: 1,
          role: 'setup',
          title: 'Make it one business.',
          intent:
            'Bring customer, marketing, sales, delivery and economics together instead of treating them as separate plans.',
          component: 'business_blueprint_setup',
          dependencies: ['m4-q5-action'],
        },
        {
          key: 'm4-q6-blueprint',
          sequence: 2,
          role: 'investigation',
          title: 'Build the business blueprint.',
          intent:
            'Connect customer acquisition, leads, sales, delivery, revenue, costs and profit into one working model with explicit assumptions.',
          component: 'business_blueprint',
          dependencies: ['m4-q6-setup'],
        },
        {
          key: 'm4-q6-reveal',
          sequence: 3,
          role: 'reveal',
          title: 'Your business blueprint',
          intent:
            'Make the complete business visible and surface contradictions, dependencies and assumptions that matter before building.',
          component: 'business_blueprint_reveal',
          dependencies: ['m4-q6-blueprint'],
        },
        {
          key: 'm4-q6-action',
          sequence: 4,
          role: 'action',
          title: 'Turn the blueprint into a build.',
          intent:
            'Create the first concrete build requirements and decide what must exist before the business can begin serving customers.',
          component: 'business_blueprint_action',
          dependencies: ['m4-q6-reveal'],
        },
      ],
    },
  ],

  reveal: {
    key: 'm4-reveal',
    sequence: 1,
    role: 'reveal',
    title: 'Now you can see the business.',
    intent:
      'Show the transformation from tested offer to connected business system, including what is known, what is assumed, and what still needs to be tested or built.',
    component: 'mission_transformation_synthesis',
  },

};
