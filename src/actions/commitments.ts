'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';


export async function saveCommitment(data: {
  statement: string;
  source_node_key: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const { data: commitment, error } = await supabase
    .from('user_commitments')
    .insert({
      user_id: user.id,
      ...data,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save commitment: ${error.message}`);
  return { success: true, commitment };
}