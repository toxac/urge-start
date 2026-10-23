No errors . I dont want to test components now. i will do them all in one go for entire mission 2. Lets think about implementing quest 2 components in one go. 

## Nodes for quest 3

```js
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

```

## Tasks
- We want to create a new table user_interactions with RLS for saving all interactions users has with others (customers, suppliers, testers etc)
  - the table should take into account all scenraios in the journey
  - it should have references to opportunities and projects, both optional
- Create action for interactions
- Plan UI for customer interaction
- integrate it in to node component
- Node components:
  - setup: should tell users how they have picked opportunities based on how they see it but understanding it from the customers perspective is vital. thats what they will be doing in this quest. 
  - investigation: We have to create form that user can add interaction details for all the 3 opportunities. This interaction will be guided and has to answer key questions. I have listed them below (not final)
  - Reveal: what customer felt about each opportunity users has identified
  - Action: add remarks and some sort of customer validation (i dont know what this will be yet)

## Questions for interview
1. "Walk me through the last time this happened."
2. "What did you do about it?"
3. "How often does it happen?"
4. "What does it cost you — time or money?"
5. "What have you tried?"
6. "Why do you think it's still a problem?"
7. "Who else do you know with this?"

Listen for: specificity, recency, frequency, a number, whether they've acted, frustration, whether they know others with it.


## Implementing Interactions
We have to have general fields like 
- node_key reference
- project_id (optional)
- opportunity_id (optional)
- contact_details (json)
- interaction_method : phone, in person, web form, 
- interaction_details  (json) in format {question: string; response:string;)[] - this way we can use this in all sorts of situation
- remarks
- purpose : opportunity_validation and others... 