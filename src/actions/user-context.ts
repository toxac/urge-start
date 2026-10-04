'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function updateUserProgramContext(updates: Record<string, any>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) throw new Error('Unauthorized');

  // Upsert handles both the first-time creation and subsequent updates safely
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