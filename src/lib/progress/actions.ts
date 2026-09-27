'use server';

import type { Json } from '@/database.types';
import { getAuthenticatedUser } from '@/lib/auth';
import { getMissionForNode, getNode } from '@/program';

import {
  getProgressData,
} from './data';

import {
  getNextProgramNode,
} from './engine';

import type {
  ProgressSnapshot,
} from './types';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function completeNode(
  nodeKey: string,
  payload: Json = {},
): Promise<ProgressSnapshot> {
  const user = await getAuthenticatedUser();

  const node = getNode(nodeKey);

  if (!node) {
    throw new Error('Program node not found');
  }

  const mission = getMissionForNode(nodeKey);

  if (!mission) {
    throw new Error('Program mission not found');
  }

  const programVersion = mission.version;

  const progressData = await getProgressData(
    user.id,
    programVersion,
  );

  if (!progressData.programState) {
    throw new Error('Program state not found');
  }

  if (
    progressData.programState.current_node_key !== nodeKey
  ) {
    throw new Error('This is not the current program node');
  }

  const progress = {
    completed: progressData.progress.map(
      (record) => record.node_key,
    ),
  };

  if (
    node.dependencies &&
    !node.dependencies.every((dependency) =>
      progress.completed.includes(dependency),
    )
  ) {
    throw new Error('Node dependencies are not complete');
  }

  const nextProgress = {
    completed: [
      ...new Set([
        ...progress.completed,
        nodeKey,
      ]),
    ],
  };

  const nextNode = getNextProgramNode(
    nodeKey,
    nextProgress,
  );

  const supabase = await createSupabaseServerClient();

  const nextNodeKey = nextNode?.key;

const { data, error } = await supabase.rpc(
  'complete_program_node',
  {
    p_node_key: nodeKey,
    p_program_version: programVersion,
    ...(nextNodeKey
      ? { p_next_node_key: nextNodeKey }
      : {}),
    p_payload: payload,
  },
);

  if (error) {
    throw new Error(
      `Failed to complete node: ${error.message}`,
    );
  }

  const result = data?.[0];

  if (!result) {
    throw new Error(
      'Progress update returned no result',
    );
  }

  return {
    programVersion: result.program_version,
    currentNodeKey: result.current_node_key,
    completed: result.completed ?? [],
  };
}