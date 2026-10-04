import { mission1 } from './mission1';
import { mission2 } from './mission2';
import { mission3 } from './mission3';
import { mission4 } from './mission4';
import { mission5 } from './mission5';
import { mission6 } from './mission6';

import type { ProgramMission, ProgramNode } from './types';

export const PROGRAM_VERSION = 2;

export const programMissions: ProgramMission[] = [
  mission1,
  mission2,
  mission3,
  mission4,
  mission5,
  mission6,
];

export function getMission(missionKey: string): ProgramMission | undefined {
  return programMissions.find((mission) => mission.key === missionKey);
}

export function getMissionBySequence(sequence: number): ProgramMission | undefined {
  return programMissions.find((mission) => mission.sequence === sequence);
}

export function getMissionNodes(mission: ProgramMission): ProgramNode[] {
  return [
    mission.setup,
    ...mission.quests.flatMap((quest) => quest.nodes),
    mission.reveal,
    ...(mission.action ? [mission.action] : []),
  ];
}

export function getAllProgramNodes(): ProgramNode[] {
  return programMissions.flatMap(getMissionNodes);
}

export function getNode(nodeKey: string): ProgramNode | undefined {
  return getAllProgramNodes().find((node) => node.key === nodeKey);
}

export function getMissionForNode(nodeKey: string): ProgramMission | undefined {
  return programMissions.find((mission) =>
    getMissionNodes(mission).some((node) => node.key === nodeKey),
  );
}
