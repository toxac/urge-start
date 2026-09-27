import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PROGRAM_VERSION } from '@/program';

import { getFirstAvailableProgramNode } from './engine';
import { getProgressData } from './data';
import type { ProgressData } from './types';

export async function initializeProgram(
  userId: string,
): Promise<ProgressData> {
  const supabase = await createSupabaseServerClient();

  const { data: existingState, error: stateError } =
    await supabase
      .from('user_program_state')
      .select('*')
      .eq('user_id', userId)
      .eq('program_version', PROGRAM_VERSION)
      .maybeSingle();

  if (stateError) {
    throw new Error(
      `Failed to load program state: ${stateError.message}`,
    );
  }

  if (existingState) {
    const progressData = await getProgressData(
      userId,
      PROGRAM_VERSION,
    );

    return progressData;
  }

  const firstNode = getFirstAvailableProgramNode({
    completed: [],
  });

  if (!firstNode) {
    throw new Error(
      'Program has no available starting node',
    );
  }

  const { error: insertError } = await supabase
  .from('user_program_state')
  .upsert(
    {
      user_id: userId,
      program_version: PROGRAM_VERSION,
      current_node_key: firstNode.key,
    },
    {
      onConflict: 'user_id',
      ignoreDuplicates: true,
    },
  );

  if (insertError) {
    throw new Error(
      `Failed to initialize program state: ${insertError.message}`,
    );
  }

  return getProgressData(
    userId,
    PROGRAM_VERSION,
  );
}