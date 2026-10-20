
'use server';

import type { Json } from '@/database.types';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import {
  validatedObservationSchema,
  type ObservationFormValues,
} from '@/lib/schemas/observation';

import type {
  UserObservation,
  UserObservationInsert,
  UserObservationUpdate,
  ProblemDetails,
} from '@/lib/types/observations';

/**
 * Merge incoming problem details with existing details.
 *
 * Undefined fields are ignored so partial updates preserve existing values.
 * Explicit null values are retained, allowing callers to clear a field.
 */
function mergeProblemDetails(
  current: Json | null | undefined,
  incoming: ProblemDetails,
): Json {
  const currentObject =
    current !== null &&
    current !== undefined &&
    typeof current === 'object' &&
    !Array.isArray(current)
      ? current
      : {};

  const definedIncoming = Object.fromEntries(
    Object.entries(incoming).filter(([, value]) => value !== undefined),
  );

  return {
    ...currentObject,
    ...definedIncoming,
  } as Json;
}

/**
 * Fetch all observations belonging to the authenticated user.
 * Called by the designated hydration layer, not by individual nodes.
 */
export async function getObservations(): Promise<UserObservation[]> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('user_observations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load observations: ${error.message}`);
  }

  return data;
}

/**
 * Create or update an observation belonging to the authenticated user.
 */
export async function saveObservation(data: ObservationFormValues) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const userId = user.id;

  // Validate on the server, including problem-focus validation.
  const parsed = validatedObservationSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(
      `Invalid observation data: ${parsed.error.issues
        .map((issue) => issue.message)
        .join(', ')}`,
    );
  }

  const {
    observation_id,
    title,
    content,
    context,
    observed_at,
    type,
    domain,
    focus,
    source_node_key,
    notes,
    image_url,
    problem_details,
    metadata,
  } = parsed.data;

  // Fields omitted from an update remain unchanged.
  const updatePayload: UserObservationUpdate = {
    title,
    content,
    updated_at: new Date().toISOString(),
    ...(context !== undefined ? { context } : {}),
    ...(observed_at !== undefined ? { observed_at } : {}),
    ...(type != null ? { type } : {}),
    ...(domain !== undefined ? { domain } : {}),
    ...(focus !== undefined ? { focus } : {}),
    ...(source_node_key !== undefined ? { source_node_key } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(image_url !== undefined ? { image_url } : {}),
    ...(metadata !== undefined ? { metadata: metadata as Json } : {}),
  };

  /**
   * Update an existing observation after verifying ownership.
   * Problem details are merged so partial edits don't erase other answers.
   */
  async function updateExistingObservation(id: string) {
    const { data: current, error: fetchError } = await supabase
      .from('user_observations')
      .select('id, problem_details')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(
        `Failed to load observation: ${fetchError.message}`,
      );
    }

    if (!current) {
      throw new Error('Observation not found.');
    }

    const payload: UserObservationUpdate = {
      ...updatePayload,
      ...(problem_details !== undefined
        ? {
            problem_details: mergeProblemDetails(
              current.problem_details,
              problem_details,
            ),
          }
        : {}),
    };

    const { data: observation, error } = await supabase
      .from('user_observations')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to update observation: ${error.message}`,
      );
    }

    return observation;
  }

  // Explicit edit: update the requested observation.
  if (observation_id) {
    const observation = await updateExistingObservation(observation_id);

    return { success: true, observation };
  }

  // The user's main existing idea remains an ordinary observation.
  // Re-entry updates it instead of creating a duplicate.
  if (problem_details?.is_existing === true) {
    const { data: existing, error: lookupError } = await supabase
      .from('user_observations')
      .select('id')
      .eq('user_id', userId)
      .eq('problem_details->>is_existing', 'true')
      .maybeSingle();

    if (lookupError) {
      throw new Error(
        `Failed to find existing idea: ${lookupError.message}`,
      );
    }

    if (existing) {
      const observation = await updateExistingObservation(existing.id);

      return { success: true, observation };
    }
  }

  // Create a new observation.
  const insertPayload: UserObservationInsert = {
    user_id: userId,
    title,
    content,
    context: context ?? null,
    observed_at: observed_at ?? new Date().toISOString(),
    type: type ?? 'observation',
    domain: domain ?? null,
    focus: focus ?? null,
    source_node_key: source_node_key ?? null,
    ...(notes !== undefined ? { notes } : {}),
    ...(image_url !== undefined ? { image_url } : {}),
    ...(problem_details !== undefined
      ? { problem_details: problem_details as Json }
      : {}),
    ...(metadata !== undefined ? { metadata: metadata as Json } : {}),
  };

  const { data: observation, error } = await supabase
    .from('user_observations')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save observation: ${error.message}`);
  }

  return { success: true, observation };
}
