# Mission 1 Quest 2 Enhancement nased on feedback

## node-m1-q2-capabilities
component mapping: 'capability_inventory': CapabilityInventory

Right now the capability node is quite basic and we are missing out quite a lot of strengths users might have. We need to make the list capture all the kay ability we think would be constructive for users. They dont need to have everything. We don't want to keep adding new ability cards which will make the task cumbersome. I have another idea as well we can have key theme and let users tell us in free form and we can extract things from it in structured manner. So we can have a textbox for creativity and innovation and then we can grab details from users input like what kind of creativity, if they have some experience and if they have applied it somewhere. Its and idea. Some of the additional ability which is not currenty explicit in the node component.

- Ability to be creative
- Come up with innovation solutions
- being able to evaluate and mitigate risks and roadblocks
- Ability to strategise and plan
- Ability to communicate clearly
- Connect and network with strangers
- Good listener
- persuasiveness
- empathy and conviction.


### Node Entry
```ts
{
          key: 'm1-q2-capabilities',
          sequence: 4,
          role: 'investigation',
          title: 'What can you already do?',
          description:
            'You have probably learned more useful things than you give yourself credit for. Look for capabilities you already use to solve problems.',
          prompt:
            'What can you already do that could be useful?',
          intent:
            'Surface practical capabilities through problems the user already solves.',
          component: 'capability_inventory',
          dependencies: ['m1-q2-network'],
        },
```

## Tasks
- Evaluate component based on feedback
- Evaluate my suggestion of having struture textboxes and we extract data using AI and then format and save it
- We will need to also figure out how to implment STT for textarea
- lets address each of these before we update the component


## mission1 quest 2 nodes

```ts
{
      key: 'q2',
      sequence: 2,
      title: 'What You Already Have',
      description:
        'Look beyond what you think you lack. Find the people, skills, experience, resources, and access already within reach.',

      nodes: [
        {
          key: 'm1-q2-setup',
          sequence: 1,
          role: 'setup',
          title: 'You are not starting from zero.',
          description: `Before you decide what you need to start a business, take stock of what you already have.

In this quest, you'll explore the skills you've built, the experiences you've had, the people you know, and the resources you can draw on. You might discover useful strengths you take for granted, or realise you have more to work with than you thought.

You don't need to have everything. The goal is to see what you can build on—and where there may be gaps to work around.`,
          prompt:
            'What are you starting with?',
          intent:
            'Shift the user from thinking about what they lack to noticing the resources, people, capabilities, and experience already within reach.',
          component: 'asset_inventory_intro',
          dependencies: ['m1-q1-action'],
        },

        {
          key: 'm1-q2-inventory',
          sequence: 2,
          role: 'investigation',
          title: 'What resources are already within reach?',
          description:
            'Resources are not just money. Time, tools, spaces, information, technology, and other forms of access can all change what is possible.',
          prompt:
            'What resources could you use right now?',
          intent:
            'Identify current resources and perceived constraints.',
          component: 'resource_inventory',
          dependencies: ['m1-q2-setup'],
        },

        {
          key: 'm1-q2-network',
          sequence: 3,
          role: 'investigation',
          title: 'Who is already within reach?',
          description: `Think about the people you know, the groups you're part of, and the communities you can access.

You don't need to know how these connections might help you yet. For now, the goal is to recognise who's already around you and make a record you can return to as you explore opportunities.`,
          prompt:
            'Who could you talk to, learn from, or ask for help?',
          intent:
            'Build an inventory of the people, groups and communities the user already has connections to.',
          component: 'contact_inventory',
          dependencies: ['m1-q2-inventory'],
        },

        {
          key: 'm1-q2-capabilities',
          sequence: 4,
          role: 'investigation',
          title: 'What can you already do?',
          description:
            'You have probably learned more useful things than you give yourself credit for. Look for capabilities you already use to solve problems.',
          prompt:
            'What can you already do that could be useful?',
          intent:
            'Surface practical capabilities through problems the user already solves.',
          component: 'capability_inventory',
          dependencies: ['m1-q2-network'],
        },

        {
          key: 'm1-q2-experience',
          sequence: 5,
          role: 'investigation',
          title: 'What have you already lived through?',
          description:
            'Your experience is bigger than your job history. Work, hobbies, side projects, communities, failures, and problems you have solved can all give you useful context.',
          prompt:
            'What experiences might give you an advantage here?',
          intent:
            'Find useful experience across work, hobbies, side projects, failures, communities, and personal problems.',
          component: 'experience_inventory',
          dependencies: ['m1-q2-capabilities'],
        },

        {
          key: 'm1-q2-reveal',
          sequence: 6,
          role: 'reveal',
          title: 'You have more to work with than you thought.',
          description:
            'Now compare what you thought you were missing with what you actually have available.',
          intent:
            'Compare perceived gaps with actual assets while making genuine remaining gaps visible.',
          component: 'asset_reveal',
          dependencies: ['m1-q2-experience'],
        },

        {
          key: 'm1-q2-action',
          sequence: 7,
          role: 'action',
          title: 'What still needs attention?',
          description:
            'You do not need to close every gap before you begin. Identify the ones that actually matter now.',
          prompt:
            'Which gap is worth doing something about first?',
          intent:
            'Turn genuine gaps into concrete next steps without forcing the user to solve everything now.',
          component: 'gap_action',
          dependencies: ['m1-q2-reveal'],
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