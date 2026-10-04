'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Tables } from '@/database.types';

export async function getCurrentProgramContext(userId: string): Promise<Tables<'user_program_context'> | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('user_program_context')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching program context:', error);
    return null;
  }

  return data;
}

export async function updateUserProgramContext(updates: Record<string, any>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('user_program_context')
    .upsert(
      { user_id: user.id, ...updates, updated_at: new Date().toISOString() }, 
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to update program context: ${error.message}`);
  return { success: true, userContext: data };
}

export async function updateUserProfile(updates: Record<string, any>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('user_profile')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update profile: ${error.message}`);
  return { success: true, profile: data };
}