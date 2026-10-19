
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ContextResource } from '@/lib/context/requirements';

// TODO: Move these to their own domain action files later.
async function fetchContacts(userId: string) {
  return [];
}

async function fetchProjects(userId: string) {
  return [];
}

async function fetchOffers(userId: string) {
  return [];
}

export async function fetchMissionContext(
  requirements: ContextResource[],
  missionKey: string,
) {
  const supabase = await createSupabaseServerClient();
  const contextData: Partial<Record<ContextResource, any>> = {};

  if (requirements.includes('resources')) {
    const { data: resources, error } = await supabase
      .from('program_node_resources')
      .select('*')
      .eq('mission_key', missionKey);

    if (error) {
      throw new Error(`Failed to fetch mission resources: ${error.message}`);
    }

    contextData.resources = resources ?? [];
  }

  if (requirements.includes('observations')) {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: observations, error } = await supabase
      .from('user_observations')
      .select('*')
      .eq('user_id', user.id)
      .eq('domain', 'problem')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch observations: ${error.message}`);
    }

    contextData.observations = observations ?? [];
  }

  // Other resources can be added here when their fetchers are ready.

  return contextData;
}
