export type ProgramNodeRole =
  | 'setup'
  | 'investigation'
  | 'reveal'
  | 'action';

export type NodeResource = {
  type: string;
  url: string;
  is_internal: boolean;
  title: string;
};

export type ProgramNode = {
  key: string;
  sequence: number;
  role: ProgramNodeRole;
  title: string;
  intent: string;
  component: string;
  dependencies?: string[];
  resources?: NodeResource[];
  description?: string;
};

export type ProgramQuest = {
  key: string;
  sequence: number;
  title: string;
  description: string;
  nodes: ProgramNode[];
};

export type ProgramMission = {
  key: string;
  version: number;
  title: string;
  sequence: number;
  question: string;
  description: string;
  transformation: {
    from: string;
    to: string;
  };
  setup: ProgramNode;
  quests: ProgramQuest[];
  reveal: ProgramNode;
  action?: ProgramNode;
};