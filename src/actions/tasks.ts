'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function saveUserTasks(
  tasks: { title: string; description: string; source_node_key: string }[]
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) throw new Error('Unauthorized');

  const tasksToInsert = tasks.map(task => ({
    user_id: user.id,
    title: task.title,
    description: task.description,
    source_node_key: task.source_node_key,
    task_type: 'general',
    status: 'pending'
  }));

  const { error } = await supabase.from('user_tasks').insert(tasksToInsert);
  if (error) throw new Error(`Failed to save tasks: ${error.message}`);
  
  return { success: true };
}