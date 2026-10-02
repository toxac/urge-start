// src/components/hydrators/ProgramHydrator.tsx
'use client';

import { useEffect } from 'react';
import { programStateActions } from '@/lib/stores/program-state';
import { progressActions } from '@/lib/stores/progress';

interface ProgramHydratorProps {
  serverState: { current_node_key: string | null; program_version: number } | null;
  serverProgress: { node_key: string; payload: any }[];
}

export function ProgramHydrator({ serverState, serverProgress }: ProgramHydratorProps) {
  useEffect(() => {
    // If no state exists, default to the very first node of the program
    const activeNode = serverState?.current_node_key || 'm1-setup';
    const version = serverState?.program_version || 2;

    programStateActions.hydrate(activeNode, version);
    progressActions.hydrate(serverProgress);
  }, [serverState, serverProgress]);

  return null;
}