
import type { Json } from '@/database.types';

// -----------------------------------------------------------------------------
// Program structure
// -----------------------------------------------------------------------------

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

export type ProgramNodePacing = {
  delay_days: number;
  isStrict?: boolean;
};

export type ProgramNodeMetadata = Record<string, Json | undefined>;

export type ProgramNode = {
  key: string;
  sequence: number;
  role: ProgramNodeRole;
  title: string;
  intent: string;
  component: string;

  description?: string;
  prompt?: string;

  dependencies?: string[];
  resources?: NodeResource[];
  pacing?: ProgramNodePacing;
  metadata?: ProgramNodeMetadata;
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

export type ProgramDefinition = {
  version: number;
  missions: ProgramMission[];
};

// -----------------------------------------------------------------------------
// Node completion and routing
// -----------------------------------------------------------------------------

// Keep the existing payload shape compatible with current node components.
// We can tighten this type after checking all completion payloads.
export type ProgramNodeCompletionPayload = Record<string, any>;

export type ProgramNodeCompletionHandler = (
  payload?: ProgramNodeCompletionPayload,
  nextNodeKey?: string,
) => Promise<void>;

// -----------------------------------------------------------------------------
// Mission 1: real-world experiment metadata
// -----------------------------------------------------------------------------

export type RealWorldExperimentMetadata = {
  experiment: {
    type: 'asking';
    difficulty: 'low' | 'meaningful' | 'stretch';
    purpose:
      | 'practice_asking'
      | 'experience_rejection'
      | 'test_identified_fear';
    prompt: string;
    framing: string;
    scenarioHints: string[];
  };
};
