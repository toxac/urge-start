import type {
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/database.types';

export type UserTask = Tables<'user_tasks'>;

export type UserTaskInsert = TablesInsert<'user_tasks'>;

export type UserTaskUpdate = TablesUpdate<'user_tasks'>;

export type UserTaskType =
  | 'general'
  | 'venture'
  | 'practice'
  | 'anchor';

export type UserTaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type UserTaskRecurrence =
  | 'once'
  | 'daily'
  | 'weekly';

export type UserTaskMetadata = Json;

export type CreateUserTaskInput = {
  title: string;
  description?: string;
  task_type?: UserTaskType;
  source_node_key?: string;

  observation_id?: string;
  project_id?: string;
  contact_id?: string;

  due_at?: string;
  is_nudge_enabled?: boolean;

  metadata?: UserTaskMetadata;
};

export type UpdateUserTaskInput = {
  title?: string;
  description?: string | null;
  task_type?: UserTaskType;
  status?: UserTaskStatus;

  due_at?: string | null;
  completed_at?: string | null;

  is_nudge_enabled?: boolean;

  metadata?: UserTaskMetadata;
};