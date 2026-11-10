# Mission 1 Tweaks based on user feedbacks

Lets focus on one quest at a time. Starting with quest 1

## Quest 1
### Current setup of components
- we have some preset choices ( we will have to refine them a bit later)
- we display the choices as cards and users can pick more than one
- each card the pick we show them a textbox they can add their remarks to it
- we save that to user_program_context table

### Feedback
- while users can pick presets there is not raking or ordering. even if users could most relevant option that would be good
- also if users could add their own option that also would be good

## Implication

1. Data schema: is not affected much as we are saving these as json, but we have to decide what that new schema would be
2. Right now we have a good balance of interaction so we dont want to loose that


## Task
- confirm that you understand the current setup and the feedback
- evaluate all the component and logic
- put together implementation plan which doesnt not change look and feel much

## mission1 quest 1 nodes

```ts
{
      key: 'q1',
      sequence: 1,
      title: 'Draw the Line',
      description:
        'Understand what is keeping you from starting and decide what you are willing to do about it.',

      nodes: [
        {
          key: 'm1-q1-setup',
          sequence: 1,
          role: 'setup',
          title: 'What is really keeping you from starting?',
          description:
            "Sometimes, the reasons we give ourselves for waiting are only part of the story. Beneath practical challenges, there may be fears, doubts, or assumptions that make it harder to take the first step.\n\nIn this quest, you'll explore what's been stopping you, what keeps pulling you towards starting, what you want to change, and what might make you give up. By looking at these things honestly, you'll get a clearer picture of what's driving you, what's holding you back, and what you're willing to do about it.",
          prompt:
            'What do you think is standing between you and starting?',
          intent:
            'Frame the gap between wanting to start and actually starting in a personal way.',
          component: 'barrier_reflection',
          dependencies: ['m1-setup'],
        },

        {
          key: 'm1-q1-barriers',
          sequence: 2,
          role: 'investigation',
          title: 'What has been stopping you?',
          description:
            'Look more closely at the barriers you named. Some may be real constraints. Others may be fears or assumptions that have become reasons to wait.',
          prompt:
            'Which barriers feel most responsible for keeping you stuck?',
          intent:
            'Put words to the real barriers, fears, and reasons behind not starting.',
          component: 'why_havent_you_started',
          dependencies: ['m1-q1-setup'],
        },

        {
          key: 'm1-q1-motivation',
          sequence: 3,
          role: 'investigation',
          title: 'What keeps bringing you back?',
          description:
            'Something keeps pulling you toward this, even when the barriers are still there. That pull matters.',
          prompt:
            'What makes you keep coming back to this idea or possibility?',
          intent:
            'Understand the pull that keeps bringing the user back despite the barriers.',
          component: 'motivation_explorer',
          dependencies: ['m1-q1-barriers'],
        },

        {
          key: 'm1-q1-future',
          sequence: 4,
          role: 'investigation',
          title: 'What would be different?',
          description:
            'Starting a business is not the goal by itself. Something about your life, work, or circumstances is making you want to do this.',
          prompt:
            'If this worked, what would be different for you?',
          intent:
            'Describe what the user actually wants to change if they make this happen.',
          component: 'future_reflection',
          dependencies: ['m1-q1-motivation'],
        },

        {
          key: 'm1-q1-quit',
          sequence: 5,
          role: 'investigation',
          title: 'What might make you quit?',
          description:
            'Knowing what could make you stop is useful. It gives you a chance to recognize those moments before they arrive.',
          prompt:
            'What could realistically make you stop trying?',
          intent:
            'Make the user aware of conditions that could realistically cause them to stop.',
          component: 'quit_condition_explorer',
          dependencies: ['m1-q1-future'],
        },

        {
          key: 'm1-q1-reveal',
          sequence: 6,
          role: 'reveal',
          title: 'What is actually driving you?',
          description:
            'Look across what you have said. There is a tension between what is holding you back and what keeps pulling you forward.',
          intent:
            'Bring the answers together so the user can see what is pulling them forward and holding them back.',
          component: 'commitment_synthesis',
          dependencies: ['m1-q1-quit'],
        },

        {
          key: 'm1-q1-action',
          sequence: 7,
          role: 'action',
          title: 'Draw your line.',
          description:
            'You do not need to promise that you will never hesitate again. You need a way to keep moving when hesitation shows up.',
          prompt:
            'What is one behavior you are willing to keep doing when you feel stuck?',
          intent:
            'Turn the understanding into a minimum behavior the user is genuinely willing to maintain.',
          component: 'commitment_builder',
          dependencies: ['m1-q1-reveal'],
        },
      ],
    },

```


**component registry**
```ts
export const programComponentRegistry: Record<string, ComponentType<NodeComponentProps>> = {
  ...
  'why_havent_you_started': WhyHaventYouStarted,
  'motivation_explorer': MotivationExplorer,
  'future_reflection': FutureStateExplorer,
  'quit_condition_explorer': QuitConditionExplorer,
  'commitment_synthesis': CommitmentSynthesis,
  'commitment_builder': CommitmentBuilder,
  ...
};

```
## Attached files
- node componenets and action files
- ask me if you need to refer to other files