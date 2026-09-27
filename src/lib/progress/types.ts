export type ProgressState = {
  completed: string[];
};

export type ProgramState = {
  id: string;
  user_id: string;
  program_version: number;
  current_node_key: string | null;
  created_at: string;
  updated_at: string;
};

export type ProgressRecord = {
  node_key: string;
  completed_at: string;
  payload: Record<string, unknown>;
};

export type ProgressData = {
  programState: ProgramState | null;
  progress: ProgressRecord[];
};

export type ProgressSnapshot = {
  programVersion: number;
  currentNodeKey: string | null;
  completed: string[];
};