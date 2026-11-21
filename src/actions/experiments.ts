'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/database.types';
import {
  mapExperimentBlueprintRow,
  mapUserExperimentRow,
  type CreateUserExperimentInput,
  type ExperimentBlueprint,
  type ExperimentCategory,
  type Mission3ContextSummary,
  type UpdateUserExperimentInput,
  type UserExperiment,
  type UserExperimentReflection,
  type UserExperimentResults,
  type UserExperimentSetup,
  type UserExperimentThreshold,
} from '@/lib/types/experiments';

type UserExperimentInsert =
  Database['public']['Tables']['user_experiments']['Insert'];
type UserExperimentUpdate =
  Database['public']['Tables']['user_experiments']['Update'];

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function fetchExperimentBlueprints(options?: {
  missionKey?: string;
  category?: ExperimentCategory;
}): Promise<ExperimentBlueprint[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('experiments')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (options?.missionKey) {
    query = query.eq('mission_key', options.missionKey);
  }
  if (options?.category) {
    query = query.eq('category', options.category);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch experiment blueprints: ${error.message}`);
  }

  return (data ?? []).map(mapExperimentBlueprintRow);
}

export async function fetchUserExperiments(options?: {
  missionKey?: string;
  projectId?: string;
}): Promise<UserExperiment[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  let query = supabase
    .from('user_experiments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (options?.missionKey) {
    query = query.eq('mission_key', options.missionKey);
  }
  if (options?.projectId) {
    query = query.eq('project_id', options.projectId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch user experiments: ${error.message}`);
  }

  return (data ?? []).map(mapUserExperimentRow);
}

export async function createUserExperiments(
  inputs: CreateUserExperimentInput[],
): Promise<UserExperiment[]> {
  if (inputs.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const rows: UserExperimentInsert[] = inputs.map((item) => ({
    user_id: user.id,
    experiment_id: item.experimentId ?? null,
    experiment_key: item.experimentKey,
    project_id: item.projectId ?? null,
    opportunity_id: item.opportunityId ?? null,
    mission_key: item.missionKey ?? 'mission-3',
    source_node_key: item.sourceNodeKey ?? null,
    pass_number: item.passNumber ?? 1,
    previous_experiment_id: item.previousExperimentId ?? null,
    title: item.title,
    setup: (item.setup ?? {}) as unknown as Json,
    custom_metrics: (item.customMetrics ?? []) as unknown as Json,
    threshold: (item.threshold ?? {}) as unknown as Json,
    status: item.status ?? 'draft',
  }));

  const { data, error } = await supabase
    .from('user_experiments')
    .insert(rows)
    .select('*');

  if (error) {
    throw new Error(`Failed to create user experiments: ${error.message}`);
  }

  return (data ?? []).map(mapUserExperimentRow);
}

export async function updateUserExperiment(
  id: string,
  patch: UpdateUserExperimentInput,
): Promise<UserExperiment> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const updatePayload: UserExperimentUpdate = {};

  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.setup !== undefined) {
    updatePayload.setup = patch.setup as unknown as Json;
  }
  if (patch.customMetrics !== undefined) {
    updatePayload.custom_metrics = patch.customMetrics as unknown as Json;
  }
  if (patch.threshold !== undefined) {
    updatePayload.threshold = patch.threshold as unknown as Json;
  }
  if (patch.results !== undefined) {
    updatePayload.results = patch.results as unknown as Json;
  }
  if (patch.reflection !== undefined) {
    updatePayload.reflection = patch.reflection as unknown as Json;
  }
  if (patch.sharedContentId !== undefined) {
    updatePayload.shared_content_id = patch.sharedContentId;
  }
  if (patch.status !== undefined) updatePayload.status = patch.status;
  if (patch.startedAt !== undefined) updatePayload.started_at = patch.startedAt;
  if (patch.completedAt !== undefined) {
    updatePayload.completed_at = patch.completedAt;
  }

  const { data, error } = await supabase
    .from('user_experiments')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update experiment: ${error.message}`);
  }

  return mapUserExperimentRow(data);
}

export async function lockUserExperimentThreshold(
  id: string,
  threshold: UserExperimentThreshold,
): Promise<UserExperiment> {
  const lockedThreshold: UserExperimentThreshold = {
    ...threshold,
    locked_at: threshold.locked_at ?? new Date().toISOString(),
  };

  return updateUserExperiment(id, {
    threshold: lockedThreshold,
    status: 'ready',
  });
}

export async function launchUserExperiment(
  id: string,
  options?: {
    setup?: UserExperimentSetup;
    sharedContentId?: string | null;
  },
): Promise<UserExperiment> {
  return updateUserExperiment(id, {
    ...(options?.setup ? { setup: options.setup } : {}),
    ...(options?.sharedContentId !== undefined
      ? { sharedContentId: options.sharedContentId }
      : {}),
    status: 'live',
    startedAt: new Date().toISOString(),
  });
}

export async function logUserExperimentResults(
  id: string,
  results: UserExperimentResults,
): Promise<UserExperiment> {
  return updateUserExperiment(id, {
    results: {
      ...results,
      last_logged_at: new Date().toISOString(),
    },
  });
}

export async function saveUserExperimentReflection(
  id: string,
  reflection: UserExperimentReflection,
  options?: { markCompleted?: boolean },
): Promise<UserExperiment> {
  return updateUserExperiment(id, {
    reflection,
    ...(options?.markCompleted
      ? {
          status: 'completed',
          completedAt: new Date().toISOString(),
        }
      : {}),
  });
}

export async function createNextExperimentPass(
  previousId: string,
  sourceNodeKey?: string,
): Promise<UserExperiment> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: prevRow, error: fetchError } = await supabase
    .from('user_experiments')
    .select('*')
    .eq('id', previousId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !prevRow) {
    throw new Error('Could not find previous experiment run.');
  }

  const prev = mapUserExperimentRow(prevRow);

  await updateUserExperiment(prev.id, { status: 'iterated' });

  const [created] = await createUserExperiments([
    {
      experimentId: prev.experiment_id,
      experimentKey: prev.experiment_key,
      projectId: prev.project_id,
      opportunityId: prev.opportunity_id,
      missionKey: prev.mission_key,
      sourceNodeKey: sourceNodeKey ?? prev.source_node_key,
      passNumber: prev.pass_number + 1,
      previousExperimentId: prev.id,
      title: prev.title,
      setup: {
        pitch: prev.setup.pitch,
        where: prev.setup.where,
        channels: prev.setup.channels,
      },
      customMetrics: prev.custom_metrics,
      threshold: {
        targets: prev.threshold.targets,
        timeframe_days: prev.threshold.timeframe_days,
        strong_signal_note: prev.threshold.strong_signal_note,
        weak_signal_note: prev.threshold.weak_signal_note,
      },
      status: 'draft',
    },
  ]);

  return created;
}

export async function deleteUserExperiment(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('user_experiments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete experiment: ${error.message}`);
  }
}

export async function fetchMission3ContextSummary(): Promise<Mission3ContextSummary> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const [projectsRes, opportunitiesRes, obsRes] = await Promise.all([
    supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('user_opportunities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_observations')
      .select('content, type, domain')
      .eq('user_id', user.id)
      .eq('domain', 'problem')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const projects = (projectsRes.data ?? []) as Array<Record<string, unknown>>;
  const activeProjectRow =
    projects.find((p) => p.status === 'active') ?? projects[0] ?? null;

  const opportunities = (opportunitiesRes.data ?? []) as Array<
    Record<string, unknown>
  >;
  const linkedOppId =
    typeof activeProjectRow?.opportunity_id === 'string'
      ? activeProjectRow.opportunity_id
      : null;

  const matchedOppRow =
    (linkedOppId
      ? opportunities.find((o) => o.id === linkedOppId)
      : undefined) ??
    opportunities[0] ??
    null;

  const m2Quotes = (obsRes.data ?? [])
    .map((row) => (typeof row.content === 'string' ? row.content.trim() : ''))
    .filter(Boolean)
    .slice(0, 4);

  return {
    project: activeProjectRow
      ? {
          id: String(activeProjectRow.id),
          title:
            typeof activeProjectRow.title === 'string'
              ? activeProjectRow.title
              : 'Untitled Project',
          description:
            typeof activeProjectRow.description === 'string'
              ? activeProjectRow.description
              : null,
          opportunity_id: linkedOppId,
          metadata: asRecord(activeProjectRow.metadata),
        }
      : null,
    opportunity: matchedOppRow
      ? {
          id: String(matchedOppRow.id),
          title:
            typeof matchedOppRow.title === 'string'
              ? matchedOppRow.title
              : 'Selected Opportunity',
          problem:
            typeof matchedOppRow.problem === 'string'
              ? matchedOppRow.problem
              : null,
          description:
            typeof matchedOppRow.description === 'string'
              ? matchedOppRow.description
              : null,
          metadata: asRecord(matchedOppRow.metadata),
        }
      : null,
    m2Quotes,
  };
}