import type { ProgramMission, ProgramNode } from './types.js';

export const EXPECTED_PROGRAM_VERSION = 2;

function formatLocation(mission: ProgramMission, node?: ProgramNode): string {
  return node ? `${mission.key} / ${node.key}` : mission.key;
}

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function validateProgram(missions: ProgramMission[]): void {
  assert(missions.length > 0, 'Program must contain at least one mission.');

  const missionKeys = new Set<string>();
  const missionSequences = new Set<number>();
  const nodeMap = new Map<string, ProgramNode>();
  const nodeMissionMap = new Map<string, ProgramMission>();

  const orderedMissions = [...missions].sort(
    (a, b) => a.sequence - b.sequence,
  );

  orderedMissions.forEach((mission, index) => {
    const expectedSequence = index + 1;

    assert(
      mission.sequence === expectedSequence,
      `Mission ${mission.key} must have sequence ${expectedSequence}; received ${mission.sequence}.`,
    );

    assert(
      Number.isInteger(mission.sequence) && mission.sequence > 0,
      `Mission ${mission.key} must have a positive integer sequence.`,
    );

    assert(
      !missionKeys.has(mission.key),
      `Duplicate mission key: ${mission.key}.`,
    );

    assert(
      !missionSequences.has(mission.sequence),
      `Duplicate mission sequence: ${mission.sequence}.`,
    );

    assert(
      mission.version === EXPECTED_PROGRAM_VERSION,
      `Mission ${mission.key} uses program version ${mission.version}; expected ${EXPECTED_PROGRAM_VERSION}.`,
    );

    assert(
      mission.setup.role === 'setup',
      `${formatLocation(mission, mission.setup)} must have role "setup".`,
    );

    assert(
      mission.reveal.role === 'reveal',
      `${formatLocation(mission, mission.reveal)} must have role "reveal".`,
    );

    if (mission.action) {
      assert(
        mission.action.role === 'action',
        `${formatLocation(mission, mission.action)} must have role "action".`,
      );
    }

    assert(
      mission.quests.length > 0,
      `Mission ${mission.key} must contain at least one quest.`,
    );

    missionKeys.add(mission.key);
    missionSequences.add(mission.sequence);

    const missionNodes = [
      mission.setup,
      ...mission.quests.flatMap((quest) => quest.nodes),
      mission.reveal,
      ...(mission.action ? [mission.action] : []),
    ];

    assert(
      new Set(missionNodes.map((node) => node.key)).size === missionNodes.length,
      `Mission ${mission.key} contains duplicate node keys.`,
    );

    const addNode = (node: ProgramNode) => {
      assert(
        !nodeMap.has(node.key),
        `Duplicate node key across program: ${node.key}.`,
      );

      assert(
        Number.isInteger(node.sequence) && node.sequence > 0,
        `${formatLocation(mission, node)} must have a positive integer sequence.`,
      );

      nodeMap.set(node.key, node);
      nodeMissionMap.set(node.key, mission);
    };

    addNode(mission.setup);

    mission.quests.forEach((quest, questIndex) => {
      const expectedQuestSequence = questIndex + 1;

      assert(
        quest.sequence === expectedQuestSequence,
        `${mission.key} quest ${quest.key} must have sequence ${expectedQuestSequence}; received ${quest.sequence}.`,
      );

      assert(
        quest.nodes.length > 0,
        `${mission.key} quest ${quest.key} must contain at least one node.`,
      );

      const questSequences = new Set<number>();

      quest.nodes.forEach((node, nodeIndex) => {
        const expectedNodeSequence = nodeIndex + 1;

        assert(
          node.sequence === expectedNodeSequence,
          `${mission.key} quest ${quest.key} node ${node.key} must have sequence ${expectedNodeSequence}; received ${node.sequence}.`,
        );

        assert(
          !questSequences.has(node.sequence),
          `Duplicate node sequence ${node.sequence} in ${mission.key} quest ${quest.key}.`,
        );

        questSequences.add(node.sequence);
        addNode(node);
      });
    });

    addNode(mission.reveal);

    if (mission.action) {
      addNode(mission.action);
    }
  });

  for (const node of nodeMap.values()) {
    const mission = nodeMissionMap.get(node.key);
    assert(mission, `Could not determine mission for node ${node.key}.`);

    const dependencies = node.dependencies ?? [];
    const dependencySet = new Set<string>();

    for (const dependency of dependencies) {
      assert(
        !dependencySet.has(dependency),
        `${node.key} contains duplicate dependency ${dependency}.`,
      );
      dependencySet.add(dependency);

      const dependencyNode = nodeMap.get(dependency);

      assert(
        dependencyNode,
        `${node.key} depends on unknown node ${dependency}.`,
      );

      const dependencyMission = nodeMissionMap.get(dependency);
      assert(
        dependencyMission,
        `Could not determine mission for dependency ${dependency}.`,
      );

      assert(
        dependencyMission.sequence <= mission.sequence,
        `${node.key} depends on ${dependency}, which belongs to a later mission (${dependencyMission.sequence} > ${mission.sequence}).`,
      );
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(nodeKey: string): void {
    if (visiting.has(nodeKey)) {
      throw new Error(`Dependency cycle detected at ${nodeKey}.`);
    }

    if (visited.has(nodeKey)) {
      return;
    }

    visiting.add(nodeKey);

    for (const dependency of nodeMap.get(nodeKey)?.dependencies ?? []) {
      visit(dependency);
    }

    visiting.delete(nodeKey);
    visited.add(nodeKey);
  }

  for (const nodeKey of nodeMap.keys()) {
    visit(nodeKey);
  }
}