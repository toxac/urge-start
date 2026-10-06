'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

import {
  observationSchema,
  type ObservationFormValues,
} from '@/lib/schemas/observation';

export async function saveObservation(data: ObservationFormValues) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const parsed = observationSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error('Invalid observation data.');
  }

  const {
    title,
    content,
    context,
    observed_at,
    type,
    domain,
    focus,
    source_node_key,
  } = parsed.data;

  const { data: observation, error } = await supabase
    .from('user_observations')
    .insert({
      user_id: user.id,
      title,
      content,
      context: context || null,
      observed_at: observed_at ?? new Date().toISOString(),
      type: type ?? 'observation',
      domain: domain ?? null,
      focus: focus ?? null,
      source_node_key: source_node_key ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to save observation: ${error.message}`
    );
  }

  return {
    success: true,
    observation,
  };
}