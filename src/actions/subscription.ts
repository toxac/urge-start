'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getProgramSubscriptionStatus() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return null;

  // Query subscription joined with offerings to ensure we check the right product
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      status,
      offerings!inner (
        slug
      )
    `)
    .eq('user_id', user.id)
    .eq('offerings.slug', 'urge-program')
    .maybeSingle();

  if (error || !data) return null;

  return data.status;
}