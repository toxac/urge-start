'use client';

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { AlertCircle, Loader2 } from 'lucide-react';

import { getNode } from '@/program/index';
import { programComponentRegistry } from './componentRegistry';
import { $progress } from '@/lib/stores/progress';
import { completeProgramNode } from '@/lib/progress/manager';

type NodeRendererProps = {
  nodeKey: string;
};

export function NodeRenderer({ nodeKey }: NodeRendererProps) {
  const progressState = useStore($progress);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const node = getNode(nodeKey);

  if (!node) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <p>Program node not found: <span className="font-mono">{nodeKey}</span></p>
      </div>
    );
  }

  const Component = programComponentRegistry[node.component];

  if (!Component) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <p>Component not registered for key: <span className="font-mono">{node.component}</span></p>
      </div>
    );
  }

  // Retrieve any existing payload if the user is revisiting this node
  // Your nanostore likely stores this in `payloads` or similar
  const nodeProgress = progressState.payloads?.[nodeKey] || {};

  const handleComplete = async (payload?: Record<string, any>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // The manager handles the server action AND updating the Nanostores
      const result = await completeProgramNode(nodeKey, payload || {});

      if (!result.success) {
        throw new Error(result.error || 'Failed to complete step.');
      }
      
      // We don't need to manually update state here because manager.ts just did it,
      // which will instantly trigger a re-render to the next node.
      
    } catch (err: any) {
      console.error('[NODE RENDERER]', err);
      setError('Something went wrong saving your progress. Please try again.');
      setIsSubmitting(false); // Only toggle false on error, success unmounts this node
    }
  };

  return (
    <div className="relative">
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {isSubmitting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <div className={isSubmitting ? 'pointer-events-none opacity-50' : ''}>
        <Component 
          node={node} 
          nodeKey={nodeKey} 
          progress={nodeProgress} 
          onComplete={handleComplete} 
        />
      </div>
    </div>
  );
}