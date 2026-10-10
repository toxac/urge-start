
'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { CreateUserContentInput } from '@/lib/types/user-content';

export async function createUserContent(
  input: CreateUserContentInput
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const status = input.status ?? 'draft';

  if (status !== 'draft' && status !== 'published') {
    throw new Error('Invalid post status');
  }

  const publishedAt =
    status === 'published'
      ? new Date().toISOString()
      : null;

  const { status: _status, ...contentFields } = input;

  const { data, error } = await supabase
    .from('user_content')
    .insert({
      ...contentFields,
      user_id: user.id,
      status,
      published_at: publishedAt,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to create user content: ${error.message}`
    );
  }

  if (status === 'published') {
    revalidatePath('/community/forum');
  }

  return {
    success: true,
    content: data,
  };
}
