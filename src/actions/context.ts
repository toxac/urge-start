'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ContextResource } from '@/lib/context/requirements';
import { getMission, getMissionNodes } from '@/program/index';

// TODO: Move these to their own domain action files later (e.g., src/actions/contacts.ts)
async function fetchContacts(userId: string) { return []; }
async function fetchObservations(userId: string) { return []; }
async function fetchProjects(userId: string) { return []; }
async function fetchOffers(userId: string) { return []; }

export async function fetchMissionContext(resources: ContextResource[], missionKey: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) throw new Error('Unauthorized');

  const contextData: Partial<Record<ContextResource, any>> = {};

  await Promise.all(
    resources.map(async (resource) => {
      switch (resource) {
        // ... existing cases ...
        case 'resources':
          const { data } = await supabase
            .from('program_node_resources')
            .select('*')
            .eq('mission_key', missionKey);
            
          contextData.resources = data || [];
          break;
      }
    })
  );

  return contextData;
}