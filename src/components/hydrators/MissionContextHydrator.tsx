'use client';

import { useEffect } from 'react';

import type { ContextResource } from '@/lib/context/requirements';
import type { UserObservation } from '@/lib/types/observations';
import type {
  ExperimentBlueprint,
  UserExperiment,
} from '@/lib/types/experiments';

import { $nodeResources } from '@/lib/stores/resources';
import { observationsActions } from '@/lib/stores/observations';
import {
  experimentBlueprintsActions,
  userExperimentsActions,
} from '@/lib/stores/experiments';

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
    }

    if (contextData.experiments !== undefined) {
      experimentBlueprintsActions.hydrate(
        contextData.experiments as ExperimentBlueprint[],
      );
    }

    if (contextData.user_experiments !== undefined) {
      userExperimentsActions.hydrate(
        contextData.user_experiments as UserExperiment[],
      );
    }
  }, [contextData]);

  return null;
}