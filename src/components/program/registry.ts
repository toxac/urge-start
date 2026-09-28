import type { ComponentType } from 'react';

import { SituationExplorer } from '@/components/program/mission-1';

export const programComponentRegistry: Record<
  string,
  ComponentType
> = {
  situation_explorer: SituationExplorer,
};