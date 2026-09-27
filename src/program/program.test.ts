import { describe, expect, it } from 'vitest';

import {
  getAllProgramNodes,
  getMissionNodes,
  getMissionForNode,
  getMissionBySequence,
  getNode,
  getMission,
  programMissions,
  PROGRAM_VERSION,
} from './index.js';
import { validateProgram } from './validation.js';

const missions = programMissions;

describe('canonical program', () => {
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

  it('uses one program version', () => {
    expect(PROGRAM_VERSION).toBe(2);
    expect(new Set(missions.map((mission) => mission.version))).toEqual(
      new Set([PROGRAM_VERSION]),
    );
  });

  it('resolves missions and nodes from the canonical index', () => {
    expect(getMission('mission-1')?.title).toBe('Move Before Ready');
    expect(getMissionBySequence(3)?.title).toBe('Put It to the Test');

    const node = getNode('m1-q1-action');
    expect(node?.title).toBe('Draw your line in the sand.');
    expect(getMissionForNode('m1-q1-action')?.key).toBe('mission-1');
  });

  it('flattens the complete program without duplicate node keys', () => {
    const nodes = getAllProgramNodes();
    const keys = nodes.map((node) => node.key);

    expect(new Set(keys).size).toBe(keys.length);
    expect(nodes.length).toBe(
      missions.reduce(
        (total, mission) => total + getMissionNodes(mission).length,
        0,
      ),
    );
  });

  it('validates the complete program', () => {
    expect(() => validateProgram(missions)).not.toThrow();
  });
});

describe('program validation', () => {
  it('rejects duplicate mission keys', () => {
    const broken = [...missions, { ...missions[0], sequence: 7 }];

    expect(() => validateProgram(broken)).toThrow(/Duplicate mission key/);
  });

  it('rejects duplicate node keys', () => {
    const broken = missions.map((mission) => ({
      ...mission,
      setup:
        mission.sequence === 2
          ? { ...mission.setup, key: 'm1-setup' }
          : mission.setup,
    }));

    expect(() => validateProgram(broken)).toThrow(/Duplicate node key/);
  });

  it('rejects unknown dependencies', () => {
    const broken = missions.map((mission) =>
      mission.sequence === 1
        ? {
            ...mission,
            setup: {
              ...mission.setup,
              dependencies: ['does-not-exist'],
            },
          }
        : mission,
    );

    expect(() => validateProgram(broken)).toThrow(/depends on unknown node/);
  });

  it('rejects dependencies on a later mission', () => {
    const broken = missions.map((mission) =>
      mission.sequence === 1
        ? {
            ...mission,
            setup: {
              ...mission.setup,
              dependencies: [missions[1].setup.key],
            },
          }
        : mission,
    );

    expect(() => validateProgram(broken)).toThrow(/later mission/);
  });

  it('rejects dependency cycles', () => {
    const broken = missions.map((mission) =>
      mission.sequence === 1
        ? {
            ...mission,
            setup: {
              ...mission.setup,
              dependencies: ['m1-action'],
            },
            action: mission.action
              ? {
                  ...mission.action,
                  dependencies: [mission.setup.key],
                }
              : mission.action,
          }
        : mission,
    );

    expect(() => validateProgram(broken)).toThrow(/Dependency cycle detected/);
  });

  it('requires the correct node roles for mission boundaries', () => {
    const broken = missions.map((mission) =>
      mission.sequence === 1
        ? {
            ...mission,
            reveal: { ...mission.reveal, role: 'action' as const },
          }
        : mission,
    );

    expect(() => validateProgram(broken)).toThrow(/must have role "reveal"/);
  });
});