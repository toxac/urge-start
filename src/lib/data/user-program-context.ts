
import type { Database } from '@/database.types';

import {
  userProgramContextSchema,
  type UserProgramContextInput,
} from '@/lib/schemas/user-program-context';

import { createSupabaseServerClient } from '@/lib/supabase/server';

type UserProgramContext =
  Database['public']['Tables']['user_program_context']['Row'];

type UserProgramContextUpdate =
  Database['public']['Tables']['user_program_context']['Update'];

type UserProgramContextInsert =
  Database['public']['Tables']['user_program_context']['Insert'];

/**
 * Load a user's program context.
 */
export async function getUserProgramContext(
  userId: string,
): Promise<UserProgramContext | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('user_program_context')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load user program context: ${error.message}`,
    );
  }

  return data;
}

/**
 * Create or partially update a user's program context.
 *
 * Only supplied fields are updated. Fields omitted from the
 * input are preserved.
 */
export async function saveUserProgramContext(
  userId: string,
  input: UserProgramContextInput,
): Promise<UserProgramContext> {
  const parsed = userProgramContextSchema.parse(input);

  const supabase = await createSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from('user_program_context')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(
      `Failed to find user program context: ${lookupError.message}`,
    );
  }

  if (existing) {
    const updates = {
      ...parsed,
      updated_at: new Date().toISOString(),
    } as UserProgramContextUpdate;

    const { data, error } = await supabase
      .from('user_program_context')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to update user program context: ${error.message}`,
      );
    }

    return data;
  }

  const values = {
    ...parsed,
    user_id: userId,
  } as UserProgramContextInsert;

  const { data, error } = await supabase
    .from('user_program_context')
    .insert(values)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to create user program context: ${error.message}`,
    );
  }

  return data;
}
