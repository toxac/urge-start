import { describe, expect, it } from 'vitest';

import { programMissions } from '@/program/index';
import { buildProgramNodeRows } from './sync';

describe('buildProgramNodeRows', () => {
  it('creates a row for every program node', () => {
    const rows = buildProgramNodeRows();

    const expectedCount = programMissions.reduce(
      (total, mission) => {
        return (
          total +
          1 +
          mission.quests.reduce(
            (questTotal, quest) =>
              questTotal + quest.nodes.length,
            0,
          ) +
          1 +
          (mission.action ? 1 : 0)
        );
      },
      0,
    );

    expect(rows).toHaveLength(expectedCount);
  });

  it('preserves mission and node keys', () => {
    const rows = buildProgramNodeRows();

    for (const row of rows) {
      expect(row.node_key).toBeTruthy();
      expect(row.mission_key).toBeTruthy();
    }
  });

  it('uses null quest_key for mission-level nodes', () => {
    const rows = buildProgramNodeRows();

    const missionLevelRows = rows.filter(
      (row) => row.quest_key === null,
    );

    expect(missionLevelRows.length).toBeGreaterThan(0);
  });

  it('assigns quest_key to quest nodes', () => {
    const rows = buildProgramNodeRows();

    const questRows = rows.filter(
      (row) => row.quest_key !== null,
    );

    expect(questRows.length).toBeGreaterThan(0);
  });

  it('preserves dependencies', () => {
    const rows = buildProgramNodeRows();

    for (const row of rows) {
      expect(Array.isArray(row.dependencies)).toBe(true);
    }
  });

  it('is deterministic', () => {
    const first = buildProgramNodeRows();
    const second = buildProgramNodeRows();

    expect(first).toEqual(second);
  });
});