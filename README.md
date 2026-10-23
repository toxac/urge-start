# Quest 1 Action

## Component
1. List all the qualified observations. we have to decide what is qualified from the three questions we asked in Qualification Step
2. Can promote 3 of the observations to opportunity. But they can remove or add as long as they have 3
3. Once they have three promoted then we show the button to confirm opportunities and proceed.

## Data and other implementation details
1. We have to also create opportunity store and hydrate it at mission level using MissionHydrator and Layout
2. We want to preserve all the relevant data from observation in the opportunities as user will be working on them
3. progress and navigation follow the established pattern
4. Check the language in node entry and component to make it user friendly and without any jargons

### Node Entry
```js
{
          key: 'm2-q1-action',
          sequence: 5,
          role: 'action',
          title: 'Which problems will you investigate?',
          description: `You don't have to pursue every problem you've noticed.

Choose up to three observations you'd like to understand better. Each one will become an opportunity: a problem you've decided is worth investigating, not a business idea you've committed to building.

The others stay in your observations. You can return to them whenever you like.

In the next quest, you'll start finding out whether the problems you've chosen matter to other people.`,
          prompt: 'Which problems will you take forward?',
          intent:
            'Allow the user to promote up to three observations into user_opportunities, preserving a link to each source observation and a snapshot of its qualification answers. Keep all unselected observations available. These are candidates for investigation, not validated business opportunities.',
          component: 'promote_to_opportunities',
          dependencies: ['m2-q1-reveal'],
        },
```
### Promotion Details

schema 
```sql
create table public.user_opportunities (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text not null, 
  description text null,
  problem text null,
  customer text null,
  hypothesis text null,
  status public.opportunity_status not null default 'added'::opportunity_status,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  observation_details jsonb not null default '{}'::jsonb,
  constraint user_opportunities_pkey primary key (id),
  constraint user_opportunities_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

```

### copying data from user_observations

1. copy user_observations.title -> user_opportunities.title
2. copy user_observations.content -> user_opportunities.description
3. copy user_observations.problem_details -> user_opportunities.problem_details: we will rename user_opportunities.observbation_details to problem_details to keep everything consistent

We will have to add more details to user_opportunities table as we work on opportunities

### Attached files
- src/components/hydrators/MissionContextHydrator.tsx : opportunity hydration
- src/lib/context/requirements.ts : opportunity hydration
- src/actions/context.ts : opportunity hydration
- src/lib/schemas/user-opportunities.ts
- src/app/(platform)/program/mission/[missionKey]/layout.tsx
- src/lib/types/opportunities.ts -> we don't have this still
- src/actions/opportunities.ts -> we dont have this



