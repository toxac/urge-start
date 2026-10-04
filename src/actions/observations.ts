'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function saveObservation(data: {
  title: string;
  content: string;
  domain?: string;
  focus?: string;
  source_node_key: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const { data: observation, error } = await supabase
    .from('user_observations')
    .insert({
      user_id: user.id,
      ...data,
      observed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save observation: ${error.message}`);
  return { success: true, observation };
}