import { programMissions } from '@/program';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import type {
  ProgramMission,
  ProgramNode,
} from '@/program/types';

export type ProgramNodeRow = {
  node_key: string;
  mission_key: string;
  quest_key: string | null;
  program_version: number;
  sequence: number;
  role: ProgramNode['role'];
  title: string;
  intent: string;
  component: string;
  dependencies: string[];
  resources: NonNullable<ProgramNode['resources']>;
};

export function buildProgramNodeRows(
  missions: ProgramMission[] = programMissions,
): ProgramNodeRow[] {
  return missions.flatMap((mission) => {
    const rows: ProgramNodeRow[] = [];

    rows.push({
      node_key: mission.setup.key,
      mission_key: mission.key,
      quest_key: null,
      program_version: mission.version,
      sequence: mission.setup.sequence,
      role: mission.setup.role,
      title: mission.setup.title,
      intent: mission.setup.intent,
      component: mission.setup.component,
      dependencies: mission.setup.dependencies ?? [],
      resources: mission.setup.resources ?? [],
    });

    for (const quest of mission.quests) {
      for (const node of quest.nodes) {
        rows.push({
          node_key: node.key,
          mission_key: mission.key,
          quest_key: quest.key,
          program_version: mission.version,
          sequence: node.sequence,
          role: node.role,
          title: node.title,
          intent: node.intent,
          component: node.component,
          dependencies: node.dependencies ?? [],
          resources: node.resources ?? [],
        });
      }
    }

    rows.push({
      node_key: mission.reveal.key,
      mission_key: mission.key,
      quest_key: null,
      program_version: mission.version,
      sequence: mission.reveal.sequence,
      role: mission.reveal.role,
      title: mission.reveal.title,
      intent: mission.reveal.intent,
      component: mission.reveal.component,
      dependencies: mission.reveal.dependencies ?? [],
      resources: mission.reveal.resources ?? [],
    });

    if (mission.action) {
      rows.push({
        node_key: mission.action.key,
        mission_key: mission.key,
        quest_key: null,
        program_version: mission.version,
        sequence: mission.action.sequence,
        role: mission.action.role,
        title: mission.action.title,
        intent: mission.action.intent,
        component: mission.action.component,
        dependencies: mission.action.dependencies ?? [],
        resources: mission.action.resources ?? [],
      });
    }

    return rows;
  });
}

export async function syncProgramNodes(): Promise<{ count: number }> {
  const supabase = await createSupabaseServerClient();
  const rows = buildProgramNodeRows();

  const { error } = await supabase
    .from('program_nodes')
    .upsert(rows, {
      onConflict: 'node_key',
    });

  if (error) {
    throw new Error(`Failed to sync program nodes: ${error.message}`);
  }

  return {
    count: rows.length,
  };
}