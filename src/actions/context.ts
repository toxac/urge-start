'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ContextResource } from '@/lib/context/requirements';
import type { ProblemDetails } from '@/lib/types/observations';
import {
  mapExperimentBlueprintRow,
  mapUserExperimentRow,
} from '@/lib/types/experiments';
import {
  mapUserProjectOfferRow,
  mapUserProjectRow,
} from '@/lib/types/projects';
import { mapUserProjectBuildRow } from '@/lib/types/builds';
import {
  mapUserOpRow,
  mapUserOpsExpenseRow,
  mapUserOpsSaleRow,
  mapUserOpsTrafficRow,
} from '@/lib/types/ops';

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

  if (requirements.includes('experiments')) {
    const { data: experiments, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(
        `Failed to fetch experiment blueprints: ${error.message}`,
      );
    }

    contextData.experiments = (experiments ?? []).map(
      mapExperimentBlueprintRow,
    );
  }

  const needsObservations = requirements.includes('observations');
  const needsOpportunities = requirements.includes('opportunities');
  const needsUserExperiments = requirements.includes('user_experiments');
  const needsProjects = requirements.includes('projects');
  const needsOffers = requirements.includes('offers');
  const needsBuilds = requirements.includes('builds');
  const needsOps = requirements.includes('ops');

  if (
    needsObservations ||
    needsOpportunities ||
    needsUserExperiments ||
    needsProjects ||
    needsOffers ||
    needsBuilds
  ) {
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

    if (needsUserExperiments) {
      const { data: userExperiments, error } = await supabase
        .from('user_experiments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(
          `Failed to fetch user experiments: ${error.message}`,
        );
      }

      contextData.user_experiments = (userExperiments ?? []).map(
        mapUserExperimentRow,
      );
    }

    if (needsProjects) {
      const { data: projects, error } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch projects: ${error.message}`);
      }

      contextData.projects = (projects ?? []).map(mapUserProjectRow);
    }

    if (needsOffers) {
      const { data: offers, error } = await supabase
        .from('user_project_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch offers: ${error.message}`);
      }

      contextData.offers = (offers ?? []).map(mapUserProjectOfferRow);
    }

    if (needsBuilds) {
      const { data: builds, error } = await supabase
        .from('user_project_builds')
        .select('*')
        .eq('user_id', user.id)
        .order('version_number', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch builds: ${error.message}`);
      }

      contextData.builds = (builds ?? []).map(mapUserProjectBuildRow);
    }

    if (needsOps) {
      const [opsRes, salesRes, trafficRes, expensesRes] = await Promise.all([
        supabase
          .from('user_ops')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_ops_sales')
          .select('*')
          .eq('user_id', user.id)
          .order('order_date', { ascending: false })
          .limit(500),
        supabase
          .from('user_ops_traffic')
          .select('*')
          .eq('user_id', user.id)
          .order('period_start', { ascending: false })
          .limit(500),
        supabase
          .from('user_ops_expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('expense_date', { ascending: false })
          .limit(500),
      ]);

      if (opsRes.error) {
        throw new Error(`Failed to fetch user_ops: ${opsRes.error.message}`);
      }
      if (salesRes.error) {
        throw new Error(
          `Failed to fetch user_ops_sales: ${salesRes.error.message}`,
        );
      }
      if (trafficRes.error) {
        throw new Error(
          `Failed to fetch user_ops_traffic: ${trafficRes.error.message}`,
        );
      }
      if (expensesRes.error) {
        throw new Error(
          `Failed to fetch user_ops_expenses: ${expensesRes.error.message}`,
        );
      }

      contextData.ops = {
        ops: (opsRes.data ?? []).map(mapUserOpRow),
        sales: (salesRes.data ?? []).map(mapUserOpsSaleRow),
        traffic: (trafficRes.data ?? []).map(mapUserOpsTrafficRow),
        expenses: (expensesRes.data ?? []).map(mapUserOpsExpenseRow),
      };
    }
  }

  return contextData;
}