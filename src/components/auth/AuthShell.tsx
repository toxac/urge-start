// src/components/auth/AuthShell.tsx

import type { ReactNode } from 'react';

interface AuthShellProps {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
}

export function AuthShell({
  children,
  eyebrow = 'Urge',
  title,
  description,
}: AuthShellProps) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12 sm:px-8">
        <div>
          <p className="font-heading text-xl font-bold tracking-tight">
            urge
          </p>

          <div className="mt-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </p>

            <h1 className="mt-5 font-heading text-4xl font-bold leading-tight tracking-[-0.04em]">
              {title}
            </h1>

            {description ? (
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}