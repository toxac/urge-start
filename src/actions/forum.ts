
'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ForumStream =
  | 'for-you'
  | 'introductions'
  | 'insight'
  | 'experiment'
  | 'question'
  | 'reflection'
  | 'milestone';

export type ForumReactionType =
  | 'helpful'
  | 'experienced_this'
  | 'interesting'
  | 'courage';

export type ForumResponseType =
  | 'experience'
  | 'question'
  | 'perspective'
  | 'suggestion'
  | 'answer';

const PAGE_SIZE = 12;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function assertUuid(value: string, label: string) {
  if (!isUuid(value)) {
    throw new Error(`Invalid ${label}`);
  }
}

async function getAuthenticatedSupabase() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return { supabase, user };
}

/**
 * Fetch the published forum feed.
 *
 * Page numbering starts at 1.
 * Stream filters:
 * - for-you: all published posts
 * - introductions: introduction category
 * - remaining streams: matching post_intent
 */
export async function getForumPosts(input?: {
  stream?: ForumStream;
  category?: string;
  userId?: string;
  search?: string;
  sort?: 'latest' | 'discussed';
  page?: number;
}) {
  const { supabase } = await getAuthenticatedSupabase();

  const page = Math.max(1, Math.floor(input?.page ?? 1));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  if (input?.userId) {
    assertUuid(input.userId, 'user ID');
  }

  let query = supabase
    .from('forum_posts')
    .select('*', { count: 'exact' });

  if (input?.stream === 'introductions') {
    query = query.eq('category', 'introduction');
  } else if (input?.stream && input.stream !== 'for-you') {
    query = query.eq('post_intent', input.stream);
  }

  if (input?.category) {
    query = query.eq('category', input.category);
  }

  if (input?.userId) {
    query = query.eq('user_id', input.userId);
  }

  const search = input?.search?.trim();

  if (search) {
    // Search titles and bodies without interpolating raw user input
    // into PostgREST filter syntax.
    query = query.textSearch('body', search, {
      type: 'websearch',
      config: 'english',
    });
  }

  if (input?.sort === 'discussed') {
    query = query
      .order('comment_count', { ascending: false })
      .order('published_at', { ascending: false });
  } else {
    query = query.order('published_at', { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(`Failed to fetch forum posts: ${error.message}`);
  }

  return {
    posts: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    hasMore: (count ?? 0) > to + 1,
  };
}

/**
 * Fetch one published post.
 */
export async function getForumPost(postId: string) {
  assertUuid(postId, 'post ID');

  const { supabase } = await getAuthenticatedSupabase();

  const { data, error } = await supabase
    .from('forum_posts')
    .select('*')
    .eq('id', postId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch forum post: ${error.message}`);
  }

  return data;
}

/**
 * Fetch published comments and replies for a post.
 * Author profiles are fetched separately to avoid relying on
 * an unconfigured foreign-key relationship in Supabase.
 */
export async function getForumComments(postId: string) {
  assertUuid(postId, 'post ID');

  const { supabase } = await getAuthenticatedSupabase();

  const { data: comments, error } = await supabase
    .from('content_comments')
    .select(
      'id, content_id, user_id, parent_id, response_type, body, status, created_at, updated_at',
    )
    .eq('content_id', postId)
    .eq('status', 'published')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch comments: ${error.message}`);
  }

  if (!comments?.length) {
    return [];
  }

  const userIds = [...new Set(comments.map((comment) => comment.user_id))];

  const { data: profiles, error: profileError } = await supabase
    .from('user_profile')
    .select('user_id, username, display_name, avatar_url')
    .in('user_id', userIds);

  if (profileError) {
    throw new Error(
      `Failed to fetch comment authors: ${profileError.message}`,
    );
  }

  const profileByUserId = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile]),
  );

  return comments.map((comment) => ({
    ...comment,
    author: profileByUserId.get(comment.user_id) ?? null,
  }));
}

/**
 * Toggle a reaction on a published post.
 *
 * Selecting the same reaction again removes it.
 * Selecting a different reaction changes the existing reaction.
 */
export async function toggleForumReaction(input: {
  postId: string;
  reactionType: ForumReactionType;
}) {
  assertUuid(input.postId, 'post ID');

  const allowedReactions: ForumReactionType[] = [
    'helpful',
    'experienced_this',
    'interesting',
    'courage',
  ];

  if (!allowedReactions.includes(input.reactionType)) {
    throw new Error('Invalid reaction type');
  }

  const { supabase, user } = await getAuthenticatedSupabase();

  const { data: post, error: postError } = await supabase
    .from('user_content')
    .select('id')
    .eq('id', input.postId)
    .eq('status', 'published')
    .maybeSingle();

  if (postError) {
    throw new Error(`Failed to verify post: ${postError.message}`);
  }

  if (!post) {
    throw new Error('Post not found');
  }

  const { data: existing, error: existingError } = await supabase
    .from('content_reactions')
    .select('id, reaction_type')
    .eq('content_id', input.postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Failed to fetch existing reaction: ${existingError.message}`,
    );
  }

  if (existing?.reaction_type === input.reactionType) {
    const { error } = await supabase
      .from('content_reactions')
      .delete()
      .eq('id', existing.id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to remove reaction: ${error.message}`);
    }

    revalidatePath('/community/forum');
    revalidatePath(`/community/forum/${input.postId}`);

    return { reaction: null };
  }

  if (existing) {
    const { error } = await supabase
      .from('content_reactions')
      .update({ reaction_type: input.reactionType })
      .eq('id', existing.id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to update reaction: ${error.message}`);
    }
  } else {
    const { error } = await supabase.from('content_reactions').insert({
      content_id: input.postId,
      user_id: user.id,
      reaction_type: input.reactionType,
    });

    if (error) {
      throw new Error(`Failed to add reaction: ${error.message}`);
    }
  }

  revalidatePath('/community/forum');
  revalidatePath(`/community/forum/${input.postId}`);

  return { reaction: input.reactionType };
}

/**
 * Add a comment or a reply to a published post.
 */
export async function createForumComment(input: {
  postId: string;
  body: string;
  responseType: ForumResponseType;
  parentId?: string | null;
}) {
  assertUuid(input.postId, 'post ID');

  if (input.parentId) {
    assertUuid(input.parentId, 'parent comment ID');
  }

  const body = input.body.trim();

  if (!body || body.length > 10000) {
    throw new Error('Response must contain between 1 and 10,000 characters');
  }

  const allowedResponseTypes: ForumResponseType[] = [
    'experience',
    'question',
    'perspective',
    'suggestion',
    'answer',
  ];

  if (!allowedResponseTypes.includes(input.responseType)) {
    throw new Error('Invalid response type');
  }

  const { supabase, user } = await getAuthenticatedSupabase();

  const { data: post, error: postError } = await supabase
    .from('user_content')
    .select('id')
    .eq('id', input.postId)
    .eq('status', 'published')
    .maybeSingle();

  if (postError) {
    throw new Error(`Failed to verify post: ${postError.message}`);
  }

  if (!post) {
    throw new Error('Post not found');
  }

  const { data, error } = await supabase
    .from('content_comments')
    .insert({
      content_id: input.postId,
      user_id: user.id,
      parent_id: input.parentId ?? null,
      response_type: input.responseType,
      body,
      status: 'published',
    })
    .select(
      'id, content_id, user_id, parent_id, response_type, body, status, created_at, updated_at',
    )
    .single();

  if (error) {
    throw new Error(`Failed to create response: ${error.message}`);
  }

  revalidatePath('/community/forum');
  revalidatePath(`/community/forum/${input.postId}`);

  return { success: true, comment: data };
}

