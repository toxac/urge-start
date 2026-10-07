# Quest 3
## 'm1-q3-setup',
We need to frame it differently. We need to talk about how many people are hesitant in approaching people some feel what they have is not good enough to show it to people. Some feel bad asking for things. We need to show user how this can be a big roadblock and they in this quest are not going to think about it but go out and experience it. 
## 'm1-q3-squad',
I agree with what you havd suggested earlier. I want to keep inviting others through urge but Liked the approach you had of it not just being squad but picking people for specific purpose. They are not just there to cheer them on. 
## 'm1-q3-visible',
THis is the bit thta will change. I want user to introduce themselves to urge community. We will be using user_posts . User will create a post and we will add speical flag to identify it as introduction.
More on user_posts -> I want to let users creat and share content in the urge community. content can reflect the journey mission as category. I also later want to let users easily convert user_observations to public facing posts. Only thing that users are sharing with other is through the user_post entries.  

### user_content schema
```sql
create table public.user_content (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text null,
  content_type text not null,
  body text not null,
  status public.content_status not null default 'draft'::content_status,
  source_type text null,
  source_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_content_pkey primary key (id),
  constraint user_content_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
```

## 'm1-q3-ask',
Several nodes have same action.
Read what they have to do -> talk to people with some purpose  -> reflect on it.
other nodes which have same pattern
- m1-q4-warmup
- m1-q4-stretch

So we have the ask and then users have to go out in world, do it and reflect.
I am thinking these can have shared component. And maybe we can integrate Ai helper to help them think through approaches.
These Reflections will be saved in user_observations

# key: 'm1-q3-reveal',
based on reflections 
# 'm1-q3-action',
We should give them some behaviour reinforcement task of approaching/being more open to people. 

# quest 4
This is about handling rejection eventhough setup is very similar to quest 3 here we focus on how comfortable users are in hearing no and how they reacty to it. And what they should do to learn to handle it better. 

## 'm1-q4-setup',
## 'm1-q4-warmup',
We might have to give them scenarios. Also we need to learn who diod they ask and for what
## 'm1-q4-stretch',
similar to previous node. I thinking do we need to add custom field to node maybe inside metadata for scenarios. that way we can have a reusable components 
## 'm1-q4-reveal',
Purely about rejection
## 'm1-q4-action',
How to better handle rejectiona nd learn from it

## Note
1. I would not mind even doing all these components as unique components if it lets us create better experience for users. These two quests users are going to go out of their comfort zone so we have to treat it with care.
2. I dont have action file for user content
3. once you have read this i will give you components