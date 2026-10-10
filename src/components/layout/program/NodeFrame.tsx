
import type { ReactNode } from 'react';
import type { ProgramNode } from '@/program/types';

type NodeFrameProps = {
  node: ProgramNode;
  locationLabel: string;
  children: ReactNode;
};

const roleLabels: Record<ProgramNode['role'], string> = {
  setup: 'Get oriented',
  investigation: 'Investigate',
  reveal: 'See what happened',
  action: 'Take action',
};

export function NodeFrame({
  node,
  locationLabel,
  children,
}: NodeFrameProps) {
  const roleLabel = roleLabels[node.role];

  return (
    <section
      aria-label={`${locationLabel} — ${roleLabel}`}
      className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 lg:p-10"
    >
      <div className="mb-8 flex items-center justify-between gap-4">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {locationLabel}
        </span>

        <span className="text-right text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {roleLabel}
        </span>
      </div>

      {children}
    </section>
  );
}
