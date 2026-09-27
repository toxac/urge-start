import { describe, expect, it } from 'vitest';

import { mission1 } from '../../program/mission1.js';
import { mission2 } from '../../program/mission2.js';
import { mission3 } from '../../program/mission3.js';
import { mission4 } from '../../program/mission4.js';
import { mission5 } from '../../program/mission5.js';
import { mission6 } from '../../program/mission6.js';

import {
  getMissionNodes,
  getNextNode,
  isAvailable,
  isMissionComplete,
} from './engine.js';

import type { ProgramMission, ProgramNode } from '../../program/types.js';
import type { ProgressState } from './types.js';

const missions: ProgramMission[] = [
  mission1,
  mission2,
  mission3,
  mission4,
  mission5,
  mission6,
];

function getAllNodes(): ProgramNode[] {
  return missions.flatMap(getMissionNodes);
}

function getNodeMap(): Map<string, ProgramNode> {
  return new Map(getAllNodes().map((node) => [node.key, node]));
}

describe('real program definitions', () => {
  it('contains six missions in the correct order', () => {
    expect(missions).toHaveLength(6);

    expect(missions.map((mission) => mission.sequence)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);

    expect(missions.map((mission) => mission.title)).toEqual([
      'Move Before Ready',
      'Discover Opportunities',
      'Put It to the Test',
      'Make the Business Work',
      'Build the Machine',
      'Run the Business',
    ]);
  });

  it('has unique mission keys', () => {
    const keys = missions.map((mission) => mission.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('has unique node keys across the entire program', () => {
    const nodes = getAllNodes();
    const keys = nodes.map((node) => node.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('has no dependencies pointing to unknown nodes', () => {
    const nodeMap = getNodeMap();

    for (const node of getAllNodes()) {
      for (const dependency of node.dependencies ?? []) {
        expect(
          nodeMap.has(dependency),
          `${node.key} depends on unknown node ${dependency}`,
        ).toBe(true);
      }
    }
  });

  it('uses node keys only for dependencies', () => {
    const nodeMap = getNodeMap();
    const questKeys = new Set(
      missions.flatMap((mission) =>
        mission.quests.map((quest) => quest.key),
      ),
    );

    for (const node of getAllNodes()) {
      for (const dependency of node.dependencies ?? []) {
        expect(
          questKeys.has(dependency),
          `${node.key} depends on quest key ${dependency}`,
        ).toBe(false);

        expect(
          nodeMap.has(dependency),
          `${node.key} dependency ${dependency} is not a node key`,
        ).toBe(true);
      }
    }
  });

  it('has no dependency cycles', () => {
    const nodeMap = getNodeMap();

    const visiting = new Set<string>();
    const visited = new Set<string>();

    function visit(key: string): void {
      if (visiting.has(key)) {
        throw new Error(`Dependency cycle detected at ${key}`);
      }

      if (visited.has(key)) {
        return;
      }

      visiting.add(key);

      const node = nodeMap.get(key);

      for (const dependency of node?.dependencies ?? []) {
        visit(dependency);
      }

      visiting.delete(key);
      visited.add(key);
    }

    for (const node of getAllNodes()) {
      visit(node.key);
    }
  });

  it('starts Mission 1 at its setup node', () => {
    const progress: ProgressState = {
      completed: [],
    };

    expect(isAvailable(mission1.setup, progress)).toBe(true);

    expect(getNextNode(mission1, progress)?.key).toBe('m1-setup');
  });

  it('does not allow a completed mission node to be available again', () => {
    const progress: ProgressState = {
      completed: ['m1-setup'],
    };

    expect(isAvailable(mission1.setup, progress)).toBe(false);
  });

  it('progresses through Mission 1 dependencies correctly', () => {
    const progress: ProgressState = {
      completed: ['m1-setup'],
    };

    expect(getNextNode(mission1, progress)?.key).toBe('m1-q1-setup');

    progress.completed.push('m1-q1-setup');

    expect(getNextNode(mission1, progress)?.key).toBe('m1-q1-barriers');

    progress.completed.push('m1-q1-barriers');

    expect(getNextNode(mission1, progress)?.key).toBe(
      'm1-q1-motivation',
    );
  });

  it('requires the final quest action before Mission 1 reveal', () => {
    const progress: ProgressState = {
      completed: [],
    };

    expect(
      isAvailable(mission1.reveal, progress),
    ).toBe(false);
  });

  it('requires Mission 1 to be complete before Mission 2 starts', () => {
    const progress: ProgressState = {
      completed: [],
    };

    expect(isAvailable(mission2.setup, progress)).toBe(false);
  });

  it('requires Mission 2 to be complete before Mission 3 starts', () => {
    const progress: ProgressState = {
      completed: [],
    };

    expect(isAvailable(mission3.setup, progress)).toBe(false);
  });

  it('requires Mission 3 to be complete before Mission 4 starts', () => {
    const progress: ProgressState = {
      completed: [],
    };

    expect(isAvailable(mission4.setup, progress)).toBe(false);
  });

  it('requires Mission 4 to be complete before Mission 5 starts', () => {
    const progress: ProgressState = {
      completed: [],
    };

    expect(isAvailable(mission5.setup, progress)).toBe(false);
  });

  it('requires Mission 5 to be complete before Mission 6 starts', () => {
    const progress: ProgressState = {
      completed: [],
    };

    expect(isAvailable(mission6.setup, progress)).toBe(false);
  });

  it('does not consider Mission 1 complete before all nodes are complete', () => {
    const progress: ProgressState = {
      completed: ['m1-setup'],
    };

    expect(isMissionComplete(mission1, progress)).toBe(false);
  });
});