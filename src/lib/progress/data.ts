import { createSupabaseServerClient } from '@/lib/supabase/server';

import type {
  ProgramState,
  ProgressData,
  ProgressRecord,
} from './types';

export async function getProgressData(
  userId: string,
  programVersion: number,
): Promise<ProgressData> {
  const supabase = await createSupabaseServerClient();

  const [
    { data: programState, error: programStateError },
    { data: progressRows, error: progressError },
  ] = await Promise.all([
    supabase
      .from('user_program_state')
      .select('*')
      .eq('user_id', userId)
      .eq('program_version', programVersion)
      .maybeSingle(),

    supabase
      .from('user_progress')
      .select('node_key, completed_at, payload')
      .eq('user_id', userId)
      .eq('program_version', programVersion)
      .order('completed_at', { ascending: true }),
  ]);

  if (programStateError) {
    throw new Error(
      `Failed to load program state: ${programStateError.message}`,
    );
  }

  if (progressError) {
    throw new Error(
      `Failed to load user progress: ${progressError.message}`,
    );
  }

  return {
    programState: programState as ProgramState | null,
    progress: (progressRows ?? []) as ProgressRecord[],
  };
}

export async function getProgramState(
  userId: string,
  programVersion: number,
): Promise<ProgramState | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('user_program_state')
    .select('*')
    .eq('user_id', userId)
    .eq('program_version', programVersion)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load program state: ${error.message}`);
  }

  return data as ProgramState | null;
}


export async function initializeProgramState(
  userId: string,
  programVersion: number,
  firstNodeKey: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('user_program_state')
    .upsert(
      {
        user_id: userId,
        program_version: programVersion,
        current_node_key: firstNodeKey,
      },
      {
        onConflict: 'user_id,program_version',
        ignoreDuplicates: true,
      },
    );

  if (error) {
    throw new Error(
      `Failed to initialize program state: ${error.message}`,
    );
  }
}