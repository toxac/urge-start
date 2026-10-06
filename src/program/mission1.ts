// src/program/mission1.ts
import type { ProgramMission } from './types';

export const mission1: ProgramMission = {
  key: 'mission-1',
  version: 2,
  title: 'Move Before Ready',
  sequence: 1,
  question: 'Can you become someone who moves before they feel ready?',
  description:
    'You do not need to feel ready to begin. This mission helps you understand what is holding you back, see what you already have, involve other people, and experience what happens when you act anyway.',
  transformation: {
    from: 'Waiting for confidence, certainty, and readiness.',
    to: 'Taking action despite uncertainty and learning from what actually happens.',
  },

  setup: {
    key: 'm1-setup', sequence: 1, role: 'setup',
    title: 'Where are you starting from?',
    intent: 'Understand where the user is right now and whether they already have an idea without evaluating it.',
    component: 'situation_explorer',
  },

  quests: [
    {
      key: 'q1', sequence: 1, title: 'Draw the Line',
      description: 'Get honest about what has been stopping you, what keeps pulling you back, and what you are willing to do about it.',
      nodes: [
        {
          key: 'm1-q1-setup',
          sequence: 1,
          role: 'setup',
          title: 'Are you actually stuck, or are you just afraid to take the next step?',
          description: 'The biggest hurdle is rarely an external wall—it is usually our own internal resistance. In this investigation, we are going to strip away the logistical excuses and look honestly at the overthinking, fear, and hidden assumptions that have been keeping you parked at the starting line.',
          intent: 'Frame the gap between wanting to start and actually starting in a personal way.',
          component: 'barrier_reflection',
          dependencies: ['m1-setup']
        },
        { key: 'm1-q1-barriers', sequence: 2, role: 'investigation', title: 'What has been stopping you?', intent: 'Put words to the real barriers, fears, and reasons behind not starting.', component: 'why_havent_you_started', dependencies: ['m1-q1-setup'] },
        { key: 'm1-q1-motivation', sequence: 3, role: 'investigation', title: 'What keeps bringing you back?', intent: 'Understand the pull that keeps bringing the user back despite the barriers.', component: 'motivation_explorer', dependencies: ['m1-q1-barriers'] },
        { key: 'm1-q1-future', sequence: 4, role: 'investigation', title: 'What would be different?', intent: 'Describe what the user actually wants to change if they make this happen.', component: 'future_reflection', dependencies: ['m1-q1-motivation'] },
        { key: 'm1-q1-quit', sequence: 5, role: 'investigation', title: 'What might make you quit?', intent: 'Make the user aware of conditions that could realistically cause them to stop.', component: 'quit_condition_explorer', dependencies: ['m1-q1-future'] },
        { key: 'm1-q1-reveal', sequence: 6, role: 'reveal', title: 'Look at what is actually driving you.', intent: 'Bring the answers together so the user can see what is pulling them forward and holding them back.', component: 'commitment_synthesis', dependencies: ['m1-q1-quit'] },
        { key: 'm1-q1-action', sequence: 7, role: 'action', title: 'Draw your line in the sand.', intent: 'Turn the understanding into a minimum behavior the user is genuinely willing to maintain.', component: 'commitment_builder', dependencies: ['m1-q1-reveal'] },
      ],
    },
    {
      key: 'q3', sequence: 3, title: 'Make the Ask',
      description: 'Stop trying to figure everything out alone. Start involving people and notice what happens when you put yourself out there.',
      nodes: [
        { key: 'm1-q3-setup', sequence: 1, role: 'setup', title: 'How comfortable are you asking?', intent: 'Establish a personal baseline for asking outside the close circle.', component: 'asking_baseline', dependencies: ['m1-q2-action'] },
        { key: 'm1-q3-squad', sequence: 2, role: 'investigation', title: 'Build your squad.', intent: 'Identify people who can play useful roles during the journey.', component: 'squad_builder', dependencies: ['m1-q3-setup'] },
        { key: 'm1-q3-visible', sequence: 3, role: 'investigation', title: 'Make yourself visible.', intent: 'Take a small real-world step that makes the user’s intention visible before everything feels ready.', component: 'visibility_action', dependencies: ['m1-q3-squad'], },
        { key: 'm1-q3-ask', sequence: 4, role: 'investigation', title: 'Ask someone who owes you nothing.', intent: 'Give direct experience of making a real ask and comparing prediction with reality.', component: 'real_world_ask', dependencies: ['m1-q3-visible'] },
        { key: 'm1-q3-reveal', sequence: 5, role: 'reveal', title: 'How did reality compare with your prediction?', intent: 'Make the gap between anticipated and actual experience visible without telling the user what it means.', component: 'prediction_reality_reveal', dependencies: ['m1-q3-ask'] },
        { key: 'm1-q3-action', sequence: 6, role: 'action', title: 'What do you want to do with that?', intent: 'Let the user turn what they learned into a useful next step, commitment, or recorded insight.', component: 'learning_action', dependencies: ['m1-q3-reveal'] },
      ],
    },
    {
      key: 'q2', sequence: 2, title: 'What You Already Have',
      description: 'Look at the people, capabilities, experience, resources, and access already within reach.',
      nodes: [
        { key: 'm1-q2-setup', sequence: 1, role: 'setup', title: 'You think you are starting from zero. Are you?', intent: 'Frame an honest inventory rather than a reassurance exercise.', component: 'asset_inventory_intro', dependencies: ['m1-q1-action'] },
        { key: 'm1-q2-inventory', sequence: 2, role: 'investigation', title: 'Take stock.', intent: 'Identify current resources and perceived constraints.', component: 'resource_inventory', dependencies: ['m1-q2-setup'] },
        { key: 'm1-q2-network', sequence: 3, role: 'investigation', title: 'Who is already within reach?', intent: 'Identify people the user can realistically approach.', component: 'contact_inventory', dependencies: ['m1-q2-inventory'] },
        { key: 'm1-q2-capabilities', sequence: 4, role: 'investigation', title: 'What can you already do?', intent: 'Surface practical capabilities through problems the user already solves.', component: 'capability_inventory', dependencies: ['m1-q2-network'] },
        { key: 'm1-q2-experience', sequence: 5, role: 'investigation', title: 'What have you already lived through?', intent: 'Find useful experience across work, hobbies, side projects, failures, communities, and personal problems.', component: 'experience_inventory', dependencies: ['m1-q2-capabilities'] },
        { key: 'm1-q2-reveal', sequence: 6, role: 'reveal', title: 'You are not starting from zero.', intent: 'Compare perceived gaps with actual assets while making genuine remaining gaps visible.', component: 'asset_reveal', dependencies: ['m1-q2-experience'] },
        { key: 'm1-q2-action', sequence: 7, role: 'action', title: 'What needs attention?', intent: 'Turn genuine gaps into concrete next steps without forcing the user to solve everything now.', component: 'gap_action', dependencies: ['m1-q2-reveal'] },
      ],
    },

    {
      key: 'q', sequence: 4, title: 'Seek the No',
      description: 'Rejection is just data disguised as danger. Let’s recalibrate your fear by getting rejected on purpose.',
      nodes: [
        {
          key: 'm1-q4-setup', sequence: 1, role: 'setup', title: 'Rejection is just data.', intent: 'Reframe rejection from a personal failure to a necessary input.',
          component: 'standard_setup_frame',
          description: 'Your brain treats social rejection like a physical threat. It is lying to you. The only way to stop fearing the word "no" is to hear it on purpose and realize you didn\'t die. This quest is about intentionally getting rejected.',
          dependencies: ['m1-q3-action']
        },
        {
          key: 'm1-q4-warmup', sequence: 2, role: 'investigation', title: 'The Warmup Ask', intent: 'Experience a low-stakes rejection.',
          component: 'low_threshold_ask',
          dependencies: ['m1-q4-setup']
        },
        {
          key: 'm1-q4-stretch', sequence: 3, role: 'investigation', title: 'The Stretch Ask', intent: 'Experience a slightly more uncomfortable rejection.',
          component: 'fear_challenge',
          dependencies: ['m1-q4-warmup']
        },
        {
          key: 'm1-q4-reveal', sequence: 4, role: 'reveal', title: 'The Autopsy of a No', intent: 'Examine the reality of the rejection versus the anticipation.',
          component: 'fear_evidence_reveal',
          dependencies: ['m1-q4-stretch']
        },
        {
          key: 'm1-q4-action', sequence: 5, role: 'action', title: 'Your Rejection Protocol', intent: 'Establish a systematic response to hearing no.',
          component: 'fear_audit',
          dependencies: ['m1-q4-reveal']
        },
      ],
    }
  ],

  reveal: {
    key: 'm1-reveal', sequence: 1, role: 'reveal', title: 'Look at how far you moved.',
    intent: 'Show what changed because of what the user actually did across the mission, using evidence rather than generic encouragement.',
    component: 'mission_transformation',
    dependencies: ['m1-q4-action'],
  },

  action: {
    key: 'm1-action', sequence: 2, role: 'action', title: 'Are you ready to move before ready?',
    intent: 'Let the user decide how they want to carry this behavior into the next mission.',
    component: 'mission_transfer_action',
    dependencies: ['m1-reveal']
  },
};
