// src/lib/program/sync.ts
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
  description: string | null;
  prompt: string | null;
  intent: string;
  component: string;
  dependencies: string[];
  resources: NonNullable<ProgramNode['resources']>;
  metadata: NonNullable<ProgramNode['metadata']>;
};

export function buildProgramNodeRows(
  missions: ProgramMission[] = programMissions,
): ProgramNodeRow[] {
  return missions.flatMap((mission) => {
    const rows: ProgramNodeRow[] = [];

    const mapNode = (node: ProgramNode, questKey: string | null = null): ProgramNodeRow => ({
      node_key: node.key,
      mission_key: mission.key,
      quest_key: questKey,
      program_version: mission.version,
      sequence: node.sequence,
      role: node.role,
      title: node.title,
      description: node.description ?? null,
      prompt: node.prompt ?? null,
      intent: node.intent,
      component: node.component,
      dependencies: node.dependencies ?? [],
      resources: node.resources ?? [],
      metadata: node.metadata ?? {},
    });

    rows.push(mapNode(mission.setup));

    for (const quest of mission.quests) {
      for (const node of quest.nodes) {
        rows.push(mapNode(node, quest.key));
      }
    }

    rows.push(mapNode(mission.reveal));

    if (mission.action) {
      rows.push(mapNode(mission.action));
    }

    return rows;
  });
}

export async function clearAndSyncProgramNodes(): Promise<{ count: number }> {
  const supabase = await createSupabaseServerClient();
  const rows = buildProgramNodeRows();

  // 1. Clear existing rows
  const { error: deleteError } = await supabase
    .from('program_nodes')
    .delete()
    .gte('sequence', 0); // Deletes all rows

  if (deleteError) {
    throw new Error(`Failed to clear program nodes: ${deleteError.message}`);
  }

  // 2. Upsert new rows
  const { error: upsertError } = await supabase
    .from('program_nodes')
    .upsert(rows, {
      onConflict: 'node_key',
    });

  if (upsertError) {
    throw new Error(`Failed to sync program nodes: ${upsertError.message}`);
  }

  return {
    count: rows.length,
  };
}