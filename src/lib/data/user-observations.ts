
import type { Database } from '@/database.types';

import {
  userObservationSchema,
  type UserObservationInput,
} from '@/lib/schemas/user-observations';

import { createSupabaseServerClient } from '@/lib/supabase/server';

type UserObservation =
  Database['public']['Tables']['user_observations']['Row'];

type UserObservationInsert =
  Database['public']['Tables']['user_observations']['Insert'];

type UserObservationUpdate =
  Database['public']['Tables']['user_observations']['Update'];

const userObservationUpdateSchema =
  userObservationSchema.partial();

/**
 * Get one observation belonging to a user.
 */
export async function getUserObservation(
  userId: string,
  observationId: string,
): Promise<UserObservation | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('user_observations')
    .select('*')
    .eq('user_id', userId)
    .eq('id', observationId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load observation: ${error.message}`,
    );
  }

  return data;
}

/**
 * List a user's observations, newest first.
 */
export async function getUserObservations(
  userId: string,
): Promise<UserObservation[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('user_observations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(
      `Failed to load observations: ${error.message}`,
    );
  }

  return data ?? [];
}

/**
 * Create an observation.
 */
export async function createUserObservation(
  userId: string,
  input: UserObservationInput,
): Promise<UserObservation> {
  const parsed = userObservationSchema.parse(input);

  const supabase = await createSupabaseServerClient();

  const values = {
    ...parsed,
    user_id: userId,
  } as UserObservationInsert;

  const { data, error } = await supabase
    .from('user_observations')
    .insert(values)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to create observation: ${error.message}`,
    );
  }

  return data;
}

/**
 * Update only the supplied fields of an observation.
 */
export async function updateUserObservation(
  userId: string,
  observationId: string,
  input: Partial<UserObservationInput>,
): Promise<UserObservation> {
  const parsed = userObservationUpdateSchema.parse(input);

  if (Object.keys(parsed).length === 0) {
    throw new Error('Provide at least one field to update.');
  }

  const supabase = await createSupabaseServerClient();

  const values = {
    ...parsed,
    updated_at: new Date().toISOString(),
  } as UserObservationUpdate;

  const { data, error } = await supabase
    .from('user_observations')
    .update(values)
    .eq('user_id', userId)
    .eq('id', observationId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to update observation: ${error.message}`,
    );
  }

  return data;
}
