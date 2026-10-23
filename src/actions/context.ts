
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ContextResource } from '@/lib/context/requirements';

import type { ProblemDetails } from '@/lib/types/observations';

export async function fetchMissionContext(
  requirements: ContextResource[],
  missionKey: string,
) {
  const supabase = await createSupabaseServerClient();

  const contextData: Record<string, unknown> = {};

  if (requirements.includes('resources')) {
    const { data: resources, error } = await supabase
      .from('program_node_resources')
      .select('*')
      .eq('mission_key', missionKey);

    if (error) {
      throw new Error(
        `Failed to fetch mission resources: ${error.message}`,
      );
    }

    contextData.resources = resources ?? [];
  }

  const needsObservations = requirements.includes('observations');
  const needsOpportunities = requirements.includes('opportunities');

  if (needsObservations || needsOpportunities) {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    if (needsObservations) {
      const { data: observations, error } = await supabase
        .from('user_observations')
        .select('*')
        .eq('user_id', user.id)
        .eq('domain', 'problem')
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(
          `Failed to fetch observations: ${error.message}`,
        );
      }

      contextData.observations = observations ?? [];
    }

    if (needsOpportunities) {
      const { data: opportunities, error } = await supabase
        .from('user_opportunities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(
          `Failed to fetch opportunities: ${error.message}`,
        );
      }

      contextData.opportunities = (opportunities ?? []).map(
        (opportunity) => ({
          ...opportunity,
          problem_details:
            opportunity.problem_details as ProblemDetails,
        }),
      );
    }
  }

  return contextData;
}

