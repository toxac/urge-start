import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next');

  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/program';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth_callback', url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login?error=auth_callback', url.origin));
  }

  // Intercept: Check if profile exists
  const { data: profile } = await supabase
    .from('user_profile')
    .select('id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (!profile) {
    // Force new users to the onboarding flow
    return NextResponse.redirect(new URL('/onboarding', url.origin));
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}