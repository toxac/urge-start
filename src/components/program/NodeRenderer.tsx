'use client';

import { getNode } from '@/program/index'; // Adjust path if index is elsewhere
import { programComponentRegistry } from './registry';
import { AlertCircle } from 'lucide-react';

type NodeRendererProps = {
  nodeKey: string;
};

export function NodeRenderer({ nodeKey }: NodeRendererProps) {
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

  return <Component node={node} />;
}