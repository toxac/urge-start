'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ContextResource } from '@/lib/context/requirements';
import { getMission, getMissionNodes } from '@/program/index';

// TODO: Move these to their own domain action files later (e.g., src/actions/contacts.ts)
async function fetchContacts(userId: string) { return []; }
async function fetchObservations(userId: string) { return []; }
async function fetchProjects(userId: string) { return []; }
async function fetchOffers(userId: string) { return []; }

export async function fetchMissionContext(
  requirements: ContextResource[],
  missionKey: string
) {
  const supabase = await createSupabaseServerClient();
  const contextData: Partial<Record<ContextResource, any>> = {};

  // Fetch Node Resources (always fetch if 'resources' is in requirements)
  if (requirements.includes('resources')) {
    const { data: resources } = await supabase
      .from('program_node_resources')
      .select('*')
      .eq('mission_key', missionKey);
      
    contextData.resources = resources || [];
  }

  // Add other fetchers (contacts, observations) here later based on requirements array

  return contextData;
}