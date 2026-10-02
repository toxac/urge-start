
import type { Database } from '@/database.types';

import {
  userOpportunitySchema,
  type UserOpportunityInput,
} from '@/lib/schemas/user-opportunities';

import { createSupabaseServerClient } from '@/lib/supabase/server';

type UserOpportunity =
  Database['public']['Tables']['user_opportunities']['Row'];

type UserOpportunityInsert =
  Database['public']['Tables']['user_opportunities']['Insert'];

type UserOpportunityUpdate =
  Database['public']['Tables']['user_opportunities']['Update'];

const userOpportunityUpdateSchema =
  userOpportunitySchema.partial();

/**
 * Get one opportunity belonging to a user.
 */
export async function getUserOpportunity(
  userId: string,
  opportunityId: string,
): Promise<UserOpportunity | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('user_opportunities')
    .select('*')
    .eq('user_id', userId)
    .eq('id', opportunityId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load opportunity: ${error.message}`,
    );
  }

  return data;
}

/**
 * List a user's opportunities, newest first.
 */
export async function getUserOpportunities(
  userId: string,
): Promise<UserOpportunity[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('user_opportunities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(
      `Failed to load opportunities: ${error.message}`,
    );
  }

  return data ?? [];
}

/**
 * Create an opportunity.
 */
export async function createUserOpportunity(
  userId: string,
  input: UserOpportunityInput,
): Promise<UserOpportunity> {
  const parsed = userOpportunitySchema.parse(input);

  const supabase = await createSupabaseServerClient();

  const values = {
    ...parsed,
    user_id: userId,
  } as UserOpportunityInsert;

  const { data, error } = await supabase
    .from('user_opportunities')
    .insert(values)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to create opportunity: ${error.message}`,
    );
  }

  return data;
}

/**
 * Update only the supplied fields of an opportunity.
 */
export async function updateUserOpportunity(
  userId: string,
  opportunityId: string,
  input: Partial<UserOpportunityInput>,
): Promise<UserOpportunity> {
  const parsed = userOpportunityUpdateSchema.parse(input);

  if (Object.keys(parsed).length === 0) {
    throw new Error('Provide at least one field to update.');
  }

  const supabase = await createSupabaseServerClient();

  const values = {
    ...parsed,
    updated_at: new Date().toISOString(),
  } as UserOpportunityUpdate;

  const { data, error } = await supabase
    .from('user_opportunities')
    .update(values)
    .eq('user_id', userId)
    .eq('id', opportunityId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to update opportunity: ${error.message}`,
    );
  }

  return data;
}
