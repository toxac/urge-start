import { cache } from 'react';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export const getAuthenticatedUser = cache(
  async () => {
    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      redirect('/login');
    }

    return user;
  },
);

export const getCurrentProfile = cache(
  async (userId: string) => {
    const supabase =
      await createSupabaseServerClient();

    const {
      data: profile,
      error,
    } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return profile;
  },
);