import type { ReactNode } from 'react';

interface ContextRailProps {
  children: ReactNode;
}

export function ContextRail({
  children,
}: ContextRailProps) {
  return (
    <div className="space-y-8 text-sm">
      {children}
    </div>
  );
}