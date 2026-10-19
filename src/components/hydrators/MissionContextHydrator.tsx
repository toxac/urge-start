
'use client';

import { useEffect } from 'react';

import type { ContextResource } from '@/lib/context/requirements';
import type { UserObservation } from '@/lib/types/observations';

import { $nodeResources } from '@/lib/stores/resources';
import { observationsActions } from '@/lib/stores/observations';

interface MissionContextHydratorProps {
  contextData: Partial<Record<ContextResource, any>>;
}

export function MissionContextHydrator({
  contextData,
}: MissionContextHydratorProps) {
  useEffect(() => {
    if (contextData.resources !== undefined) {
      $nodeResources.set(contextData.resources);
    }

    if (contextData.observations !== undefined) {
      observationsActions.hydrate(
        contextData.observations as UserObservation[],
      );
      console.log(
        '[OBSERVATIONS HYDRATED]',
        observationsActions.getByNode('m2-setup'),
      );
    }
  }, [contextData]);

  return null;
}
