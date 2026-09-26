import { type NextRequest } from 'next/server';

import { updateSupabaseSession } from './src/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    /*
     * Run proxy on all routes except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - common image/file extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};