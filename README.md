## user_content table
```sql
create table public.user_content (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text null,
  body text not null,
  category text null,
  post_intent text null,
  status text not null default 'draft'::text,
  source_type text null,
  source_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_content_pkey primary key (id),
  constraint user_content_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_content_post_intent_check check (
    (
      (post_intent is null)
      or (
        post_intent = any (
          array[
            'insight'::text,
            'experiment'::text,
            'question'::text,
            'reflection'::text,
            'milestone'::text
          ]
        )
      )
    )
  ),
  constraint user_content_body_length_check check (
    (
      (
        char_length(
          TRIM(
            both
            from
              body
          )
        ) > 0
      )
      and (char_length(body) <= 20000)
    )
  ),
  constraint user_content_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'published'::text,
          'hidden'::text,
          'archived'::text
        ]
      )
    )
  ),
  constraint user_content_title_length_check check (
    (
      (title is null)
      or (char_length(title) <= 200)
    )
  ),
  constraint user_content_published_intent_check check (
    (
      (status <> 'published'::text)
      or (category = 'introduction'::text)
      or (post_intent is not null)
    )
  ),
  constraint user_content_category_check check (
    (
      (category is null)
      or (
        category = any (
          array[
            'introduction'::text,
            'opportunity'::text,
            'test'::text,
            'planning'::text,
            'build'::text,
            'launch'::text,
            'operate'::text
          ]
        )
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists user_content_feed_idx on public.user_content using btree (published_at desc) TABLESPACE pg_default
where
  (status = 'published'::text);

create index IF not exists user_content_category_feed_idx on public.user_content using btree (category, published_at desc) TABLESPACE pg_default
where
  (status = 'published'::text);

create index IF not exists user_content_intent_feed_idx on public.user_content using btree (post_intent, published_at desc) TABLESPACE pg_default
where
  (status = 'published'::text);

create index IF not exists user_content_author_feed_idx on public.user_content using btree (user_id, published_at desc) TABLESPACE pg_default
where
  (status = 'published'::text);

create index IF not exists user_content_author_status_idx on public.user_content using btree (user_id, status) TABLESPACE pg_default;

create trigger user_content_updated_at BEFORE
update on user_content for EACH row
execute FUNCTION set_updated_at ();

```

## forum_posts view
```sql
create view public.forum_posts
with
  (security_invoker = true) as
select
  c.id,
  c.user_id,
  c.title,
  c.body,
  c.category,
  c.post_intent,
  c.published_at,
  c.created_at,
  c.updated_at,
  p.username,
  p.display_name,
  p.avatar_url,
  p.city,
  p.country,
  (
    select
      count(*) as count
    from
      content_reactions r
    where
      r.content_id = c.id
  ) as reaction_count,
  (
    select
      count(*) as count
    from
      content_comments cm
    where
      cm.content_id = c.id
      and cm.status = 'published'::text
  ) as comment_count,
  (
    select
      r.reaction_type
    from
      content_reactions r
    where
      r.content_id = c.id
      and r.user_id = (
        (
          select
            auth.uid () as uid
        )
      )
    limit
      1
  ) as my_reaction
from
  user_content c
  left join user_profile_public p on p.user_id = c.user_id
where
  c.status = 'published'::text;

```

## user_contact schema

```sql
create table public.user_contacts (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name text not null,
  organization text null,
  context jsonb null,
  contact_details jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  status text not null default 'pending'::text,
  metadata jsonb not null default '{}'::jsonb,
  email text null,
  roles text[] not null default '{}'::text[],
  constraint user_contacts_pkey primary key (id),
  constraint user_contacts_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_contacts_status_check check (
    (
      status = any (
        array[
          'not_invited'::text,
          'prepared'::text,
          'sent'::text,
          'accepted'::text,
          'declined'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

```