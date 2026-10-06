import type { ReactNode } from 'react';
import type { ProgramNode } from '@/program/types';

type NodeFrameProps = {
  node: ProgramNode;
  children: ReactNode;
};

const roleLabels: Record<ProgramNode['role'], string> = {
  setup: 'Get oriented',
  investigation: 'Look closer',
  reveal: 'See what happened',
  action: 'Take action',
};

export function NodeFrame({
  node,
  children,
}: NodeFrameProps) {
  const roleLabel = roleLabels[node.role];

  return (
    <section
      aria-labelledby={`${node.key}-title`}
      className="w-full"
    >
      {/* Node orientation */}
      <div className="w-full space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {roleLabel}
          </span>
        </div>

        <div className="space-y-3">
          <h2
            id={`${node.key}-title`}
            className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            {node.title}
          </h2>

          {node.description && (
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
              {node.description}
            </p>
          )}
        </div>
      </div>

      {/* Node-specific interaction */}
      <div className="mt-10 w-full">
        {children}
      </div>
    </section>
  );
}