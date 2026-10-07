'use server';

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

  const { data, error } = await supabase
    .from('user_content')
    .insert({
      ...input,
      user_id: user.id,
      status,
      published_at:
        status === 'published'
          ? new Date().toISOString()
          : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user content: ${error.message}`);
  }

  return {
    success: true,
    content: data,
  };
}