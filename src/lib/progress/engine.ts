import type { ProgramMission, ProgramNode } from '../../program/types';
import type { ProgressState } from './types';
import {
  getAllProgramNodes,
  getMissionForNode,
  programMissions,
} from '@/program';

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


export function getNextProgramNode(
  currentNodeKey: string | null,
  progress: ProgressState,
): ProgramNode | undefined {
  const currentNode = currentNodeKey
    ? getAllProgramNodes().find(
        (node) => node.key === currentNodeKey,
      )
    : undefined;

  const currentMission = currentNode
    ? getMissionForNode(currentNode.key)
    : undefined;

  if (!currentMission) {
    return getFirstAvailableProgramNode(progress);
  }

  const missionNodes = getMissionNodes(currentMission);

  const currentIndex = missionNodes.findIndex(
    (node) => node.key === currentNodeKey,
  );

  const nextWithinMission = missionNodes
    .slice(currentIndex + 1)
    .find((node) => isAvailable(node, progress));

  if (nextWithinMission) {
    return nextWithinMission;
  }

  const nextMission = programMissions
    .filter(
      (mission) =>
        mission.sequence > currentMission.sequence,
    )
    .sort((a, b) => a.sequence - b.sequence)
    .find((mission) =>
      getMissionNodes(mission).some((node) =>
        isAvailable(node, progress),
      ),
    );

  if (!nextMission) {
    return undefined;
  }

  return getMissionNodes(nextMission).find((node) =>
    isAvailable(node, progress),
  );
}

export function getFirstAvailableProgramNode(
  progress: ProgressState,
): ProgramNode | undefined {
  return getAllProgramNodes().find((node) =>
    isAvailable(node, progress),
  );
}