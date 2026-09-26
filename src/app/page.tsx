import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16 sm:px-8">
        <div className="max-w-3xl">
          <p className="font-heading text-2xl font-bold tracking-tight">
            urge
          </p>

          <h1 className="mt-10 font-heading text-5xl font-bold leading-tight tracking-[-0.04em] sm:text-6xl">
            You don't need to be ready.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Urge helps you stop thinking about starting
            and start finding out.
          </p>
        </div>
      </div>
    </main>
  );
}