'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Tables, TablesInsert } from '@/database.types';

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return user;
}

export async function getCurrentProfile(userId: string): Promise<Tables<'user_profile'> | null> {
  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return profile;
}

export async function setupUserOnboarding(
  profileData: Omit<TablesInsert<'user_profile'>, 'user_id' | 'id' | 'created_at' | 'updated_at'>,
  intent: 'try' | 'join'
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) throw new Error('Unauthorized');

  // 1. Create Profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profile')
    .insert({
      user_id: user.id,
      ...profileData,
    })
    .select()
    .single();

  if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);

  // 2. Initialize Program State to Mission 1 Setup
  const { error: stateError } = await supabase
    .from('user_program_state')
    .insert({
      user_id: user.id,
      current_node_key: 'm1-setup',
      program_version: 2,
    });

  if (stateError) throw new Error(`Program state initialization failed: ${stateError.message}`);

  // 3. Assign Subscription (Trial or Pending Checkout)
  const { data: offering } = await supabase
    .from('offerings')
    .select('id')
    .eq('slug', 'urge-program')
    .single();

  if (offering) {
    await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        offering_id: offering.id,
        status: intent === 'try' ? 'trialing' : 'pending_payment',
      });
  }

  return { success: true, profile };
}