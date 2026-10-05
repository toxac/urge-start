// src/actions/progress.ts
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getNextNodeKey } from '@/lib/program/navigation';
import { PROGRAM_VERSION } from '@/program/index';

export async function submitNodeCompletion(nodeKey: string, payload: Record<string, any> = {}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // 1. Insert/Update progress record
  const { error: progressError } = await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      node_key: nodeKey,
      program_version: PROGRAM_VERSION,
      payload,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,node_key' });

  if (progressError) {
    throw new Error(`Failed to save progress: ${progressError.message}`);
  }

  // 2. Determine state advancement
  const { data: currentState } = await supabase
    .from('user_program_state')
    .select('current_node_key')
    .eq('user_id', user.id)
    .single();

  const nextNodeKey = getNextNodeKey(nodeKey);
  let finalCurrentNode = currentState?.current_node_key;

  // Only advance the pointer if the user completed their active frontier node
  if (!currentState?.current_node_key || currentState.current_node_key === nodeKey) {
    if (nextNodeKey) {
      const { error: stateError } = await supabase
        .from('user_program_state')
        .upsert({
          user_id: user.id,
          program_version: PROGRAM_VERSION,
          current_node_key: nextNodeKey,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,program_version' });
        
      if (stateError) {
        throw new Error(`Failed to update program state: ${stateError.message}`);
      }
      finalCurrentNode = nextNodeKey;
    }
  }

  return {
    success: true,
    completedNodeKey: nodeKey,
    nextNodeKey: finalCurrentNode,
  };
}


export async function getProgramHydrationData() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const [stateRes, progressRes] = await Promise.all([
    supabase
      .from('user_program_state')
      .select('current_node_key, program_version')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('user_progress')
      .select('node_key, payload')
      .eq('user_id', user.id)
  ]);

  return {
    programState: stateRes.data,
    progress: progressRes.data || []
  };
}