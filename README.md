## Data Model observations and Opportunities

## Table User_observation

```sql
create table public.user_observations (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text not null,
  content text not null,
  type text not null default 'observation'::text,
  domain text null,
  focus text null,
  observed_at timestamp with time zone null,
  source_node_key text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  context text null,
  constraint user_observations_pkey primary key (id),
  constraint user_observations_source_node_key_fkey foreign KEY (source_node_key) references program_nodes (node_key) on delete set null,
  constraint user_observations_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

```
### general enhancements
- We should add a text array column for notes, so that users can add additional notes to each
- We need have a image_url column and we also have to create observations storage buckets with right RLS
- metadata : right now its quite vague what i suggest is lets keep it for now but add another column for problem_details (json) where we can save additional structured details and qualification for problem

## mission 2 specific 
- type: observation (fixed for mission2)
- domain: problem (fixed for mission2)
- focus: 'personal', 'people', 'zone_of_influence', 'changes', 'markets',
- new problem_details columns shape (we might not use all):
   - is_existing : to save if this is an existsing problem
   - who
   - description (what)
   - where
   - can_reach? (can reach people who have this problem)
   - workaround
   - why_unsolved
   - current_option (exisisting solutions)
   - understands: qualification 1
   - cares: qualification 2
   - can_solve : qualification 3



## Table user_opportunities

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
  constraint user_opportunities_pkey primary key (id),
  constraint user_opportunities_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

```

we can create observation_details copy over problem_details from user observation. rest of this table we will look at when we get to quest 2

