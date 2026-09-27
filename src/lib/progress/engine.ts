import type { ProgramMission, ProgramNode } from '../../program/types.js';
import type { ProgressState } from './types.js';

export function isComplete(
  progress: ProgressState,
  nodeKey: string,
): boolean {
  return progress.completed.includes(nodeKey);
}

export function isAvailable(
  node: ProgramNode,
  progress: ProgressState,
): boolean {
  if (isComplete(progress, node.key)) {
    return false;
  }

  return (node.dependencies ?? []).every((dependency) =>
    isComplete(progress, dependency),
  );
}

export function getMissionNodes(mission: ProgramMission): ProgramNode[] {
  const nodes: ProgramNode[] = [
    mission.setup,
    ...mission.quests.flatMap((quest) => quest.nodes),
    mission.reveal,
  ];

  if (mission.action) {
    nodes.push(mission.action);
  }

  return nodes;
}

export function getNextNode(
  mission: ProgramMission,
  progress: ProgressState,
): ProgramNode | undefined {
  const nodes = getMissionNodes(mission);

  return nodes.find((node) => isAvailable(node, progress));
}

export function isMissionComplete(
  mission: ProgramMission,
  progress: ProgressState,
): boolean {
  return getMissionNodes(mission).every((node) =>
    isComplete(progress, node.key),
  );
}

export function getMissionProgress(
  mission: ProgramMission,
  progress: ProgressState,
): {
  completed: number;
  total: number;
} {
  const nodes = getMissionNodes(mission);
  const completed = nodes.filter((node) =>
    isComplete(progress, node.key),
  ).length;

  return {
    completed,
    total: nodes.length,
  };
}
