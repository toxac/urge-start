'use client';

import { useState } from 'react';
import { completeProgramNode } from '@/lib/progress/manager';
import type { ProgramNode } from '@/program/types';

interface DummyNodeProps {
  node: ProgramNode;
}

export function DummyNode({ node }: DummyNodeProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    // Using the unified manager to save to DB and update Nanostores
    const result = await completeProgramNode(node.key, { status: 'dummy_completed' });
    
    if (!result.success) {
      setError(result.error || 'Failed to complete node');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-muted/50 p-4 font-mono text-xs text-muted-foreground">
        Component: <span className="font-semibold">{node.component}</span> | Role: <span className="font-semibold">{node.role}</span>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">{node.title}</h2>
        {node.intent && <p className="text-muted-foreground">{node.intent}</p>}

        {error && <div className="text-sm text-destructive">{error}</div>}

        <button
          onClick={handleComplete}
          disabled={isSubmitting}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Complete & Continue'}
        </button>
      </div>
    </div>
  );
}