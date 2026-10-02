'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ContextResource } from '@/lib/context/requirements';

// TODO: Move these to their own domain action files later (e.g., src/actions/contacts.ts)
async function fetchContacts(userId: string) { return []; }
async function fetchObservations(userId: string) { return []; }
async function fetchProjects(userId: string) { return []; }
async function fetchOffers(userId: string) { return []; }

export async function fetchMissionContext(resources: ContextResource[]) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) throw new Error('Unauthorized');

  const contextData: Partial<Record<ContextResource, any>> = {};

  // Execute only the fetchers declared in the mission's requirements
  await Promise.all(
    resources.map(async (resource) => {
      switch (resource) {
        case 'contacts':
          contextData.contacts = await fetchContacts(user.id);
          break;
        case 'observations':
          contextData.observations = await fetchObservations(user.id);
          break;
        case 'projects':
          contextData.projects = await fetchProjects(user.id);
          break;
        case 'offers':
          contextData.offers = await fetchOffers(user.id);
          break;
        case 'resources':
          // Special case: might need missionKey instead of userId later
          contextData.resources = [];
          break;
      }
    })
  );

  return contextData;
}