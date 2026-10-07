'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

import type {
  CreateUserTaskInput,
} from '@/lib/types/tasks';

export async function saveUserTasks(
  tasks: CreateUserTaskInput[]
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  if (tasks.length === 0) {
    return {
      success: true,
      tasks: [],
    };
  }

  const tasksToInsert = tasks.map((task) => ({
    user_id: user.id,

    title: task.title,
    description: task.description ?? null,

    task_type: task.task_type ?? 'general',
    status: 'pending',

    source_node_key: task.source_node_key ?? null,

    observation_id: task.observation_id ?? null,
    project_id: task.project_id ?? null,
    contact_id: task.contact_id ?? null,

    due_at: task.due_at ?? null,

    is_nudge_enabled:
      task.is_nudge_enabled ?? false,

    metadata: task.metadata ?? {},
  }));

  const { data, error } = await supabase
    .from('user_tasks')
    .insert(tasksToInsert)
    .select();

  if (error) {
    throw new Error(
      `Failed to save tasks: ${error.message}`
    );
  }

  return {
    success: true,
    tasks: data,
  };
}