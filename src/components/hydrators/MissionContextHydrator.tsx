'use client';

import { useEffect } from 'react';
import type { ContextResource } from '@/lib/context/requirements';
import { $nodeResources } from '@/lib/stores/resources';

interface MissionContextHydratorProps {
  contextData: Partial<Record<ContextResource, any>>;
}

export function MissionContextHydrator({ contextData }: MissionContextHydratorProps) {
  useEffect(() => {
    if (contextData.resources) {
      $nodeResources.set(contextData.resources);
    }
    // Future hydrations (contacts, observations) will go here
  }, [contextData]);

  return null;
}