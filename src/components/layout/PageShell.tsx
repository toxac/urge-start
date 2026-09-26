import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  context?: ReactNode;
}

export function PageShell({
  children,
  context,
}: PageShellProps) {
  return (
    <div className="min-h-full">
      <div
        className={[
          'mx-auto w-full max-w-7xl',
          'px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14',
          context
            ? 'grid gap-12 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-20'
            : '',
        ].join(' ')}
      >
        <main className="min-w-0">
          {children}
        </main>

        {context ? (
          <aside className="min-w-0">
            {context}
          </aside>
        ) : null}
      </div>
    </div>
  );
}