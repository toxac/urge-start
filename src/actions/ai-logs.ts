
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getNodeAILogs(sourceNodeKey: string) {
  const nodeKey = sourceNodeKey.trim();

  if (!nodeKey) {
    throw new Error('A source node key is required.');
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('ai_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('source_node_key', nodeKey)
    .eq('status', 'success')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load AI logs: ${error.message}`);
  }

  return data ?? [];
}
