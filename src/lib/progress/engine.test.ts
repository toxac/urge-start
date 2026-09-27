import { describe, expect, it } from 'vitest';
import type { ProgramMission, ProgramNode } from '../../program/types.js';
import {
  getMissionNodes,
  getMissionProgress,
  getNextNode,
  isAvailable,
  isComplete,
  isMissionComplete,
} from './engine.js';
import type { ProgressState } from './types.js';

const node = (
  key: string,
  sequence: number,
  role: ProgramNode['role'] = 'investigation',
  dependencies?: string[],
): ProgramNode => ({
  key,
  sequence,
  role,
  title: key,
  intent: key,
  component: 'test',
  ...(dependencies ? { dependencies } : {}),
});

const mission: ProgramMission = {
  key: 'm1',
  version: 1,
  title: 'Test Mission',
  sequence: 1,
  question: 'Test?',
  description: 'Test mission',
  transformation: {
    from: 'before',
    to: 'after',
  },
  setup: node('m1-setup', 1, 'setup'),
  quests: [
    {
      key: 'q1',
      sequence: 1,
      title: 'Quest 1',
      description: 'First quest',
      nodes: [
        node('m1-q1-setup', 1, 'setup', ['m1-setup']),
        node('m1-q1-action', 2, 'action', ['m1-q1-setup']),
      ],
    },
  ],
  reveal: node('m1-reveal', 1, 'reveal', ['m1-q1-action']),
  action: node('m1-action', 2, 'action', ['m1-reveal']),
};

describe('progress engine', () => {
  it('checks completion by node key', () => {
    const progress: ProgressState = {
      completed: ['m1-setup'],
    };

    expect(isComplete(progress, 'm1-setup')).toBe(true);
    expect(isComplete(progress, 'm1-q1-setup')).toBe(false);
  });

  it('checks node dependencies', () => {
    const progress: ProgressState = {
      completed: ['m1-setup'],
    };

    expect(isAvailable(mission.setup, progress)).toBe(false);
    expect(isAvailable(mission.quests[0]!.nodes[0]!, progress)).toBe(true);
  });

  it('returns nodes in program order', () => {
    expect(getMissionNodes(mission).map((node) => node.key)).toEqual([
      'm1-setup',
      'm1-q1-setup',
      'm1-q1-action',
      'm1-reveal',
      'm1-action',
    ]);
  });

  it('returns the first available node', () => {
    const progress: ProgressState = {
      completed: ['m1-setup'],
    };

    expect(getNextNode(mission, progress)?.key).toBe('m1-q1-setup');
  });

  it('does not move past an incomplete dependency', () => {
    const progress: ProgressState = {
      completed: ['m1-setup'],
    };

    expect(getNextNode(mission, progress)?.key).toBe('m1-q1-setup');
    expect(isAvailable(mission.reveal, progress)).toBe(false);
  });

  it('detects a completed mission', () => {
    const progress: ProgressState = {
      completed: [
        'm1-setup',
        'm1-q1-setup',
        'm1-q1-action',
        'm1-reveal',
        'm1-action',
      ],
    };

    expect(isMissionComplete(mission, progress)).toBe(true);
    expect(getNextNode(mission, progress)).toBeUndefined();
  });

  it('returns mission progress', () => {
    const progress: ProgressState = {
      completed: ['m1-setup', 'm1-q1-setup'],
    };

    expect(getMissionProgress(mission, progress)).toEqual({
      completed: 2,
      total: 5,
    });
  });
});
