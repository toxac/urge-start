import { PROGRAM_VERSION } from '@/program';

import {
  getProgramState,
  getProgressData,
  initializeProgramState,
} from './data';
import { getFirstAvailableProgramNode } from './engine';
import type { ProgressData } from './types';

export async function initializeProgram(
  userId: string,
): Promise<ProgressData> {
  const existingState = await getProgramState(
    userId,
    PROGRAM_VERSION,
  );

  if (existingState) {
    return getProgressData(userId, PROGRAM_VERSION);
  }

  const firstNode = getFirstAvailableProgramNode({
    completed: [],
  });

  if (!firstNode) {
    throw new Error('Program has no available starting node');
  }

  await initializeProgramState(
    userId,
    PROGRAM_VERSION,
    firstNode.key,
  );

  return getProgressData(userId, PROGRAM_VERSION);
}