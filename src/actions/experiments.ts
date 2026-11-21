'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/database.types';
import type {
  ExperimentBlueprint,
  ExperimentCategory,
  ExperimentHeadsUp,
  ExperimentMatchingRules,
  ExperimentMetricDefinition,
  UserExperiment,
  UserExperimentReflection,
  UserExperimentResults,
  UserExperimentSetup,
  UserExperimentStatus,
  UserExperimentThreshold,
} from '@/lib/types/experiments';

type ExperimentRow = Database['public']['Tables']['experiments']['Row'];
type UserExperimentRow =
  Database['public']['Tables']['user_experiments']['Row'];
type UserExperimentInsert =
  Database['public']['Tables']['user_experiments']['Insert'];
type UserExperimentUpdate =
  Database['public']['Tables']['user_experiments']['Update'];

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function mapExperimentBlueprintRow(
  row: ExperimentRow,
): ExperimentBlueprint {
  return {
    id: row.id,
    key: row.key,
    mission_key: row.mission_key,
    category: row.category as ExperimentCategory,
    involves_people: row.involves_people,
    name: row.name,
    one_line: row.one_line,
    tells_you: row.tells_you,
    cost_estimate: row.cost_estimate,
    strong_signal_guide: row.strong_signal_guide,
    weak_signal_guide: row.weak_signal_guide,
    best_when: row.best_when,
    resource_slug: row.resource_slug,
    metrics: asArray<ExperimentMetricDefinition>(row.metrics),
    matching_rules: asRecord(row.matching_rules) as ExperimentMatchingRules,
    prep_checklist: asArray<string>(row.prep_checklist),
    heads_up: asRecord(row.heads_up) as ExperimentHeadsUp,
    prompt_template: row.prompt_template,
    is_active: row.is_active,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapUserExperimentRow(row: UserExperimentRow): UserExperiment {
  return {
    id: row.id,
    user_id: row.user_id,
    experiment_id: row.experiment_id,
    experiment_key: row.experiment_key,
    project_id: row.project_id,
    opportunity_id: row.opportunity_id,
    mission_key: row.mission_key,
    source_node_key: row.source_node_key,
    pass_number: row.pass_number,
    previous_experiment_id: row.previous_experiment_id,
    title: row.title,
    setup: asRecord(row.setup) as UserExperimentSetup,
    custom_metrics: asArray<ExperimentMetricDefinition>(row.custom_metrics),
    threshold: asRecord(row.threshold) as UserExperimentThreshold,
    results: asRecord(row.results) as UserExperimentResults,
    reflection: asRecord(row.reflection) as UserExperimentReflection,
    shared_content_id: row.shared_content_id,
    status: row.status as UserExperimentStatus,
    started_at: row.started_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
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

export type CreateUserExperimentInput = {
  experimentId?: string | null;
  experimentKey: string;
  projectId?: string | null;
  opportunityId?: string | null;
  missionKey?: string;
  sourceNodeKey?: string | null;
  passNumber?: number;
  previousExperimentId?: string | null;
  title: string;
  setup?: UserExperimentSetup;
  customMetrics?: ExperimentMetricDefinition[];
  threshold?: UserExperimentThreshold;
  status?: UserExperimentStatus;
};

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

export type UpdateUserExperimentInput = {
  title?: string;
  setup?: UserExperimentSetup;
  customMetrics?: ExperimentMetricDefinition[];
  threshold?: UserExperimentThreshold;
  results?: UserExperimentResults;
  reflection?: UserExperimentReflection;
  sharedContentId?: string | null;
  status?: UserExperimentStatus;
  startedAt?: string | null;
  completedAt?: string | null;
};

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