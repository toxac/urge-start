import type { ComponentType } from 'react';
import type { ProgramNode } from '@/program/types';

import { DummyNode } from './DummyNode';
import { 
  SituationExplorer, 
  FutureStateExplorer, 
  MotivationExplorer, 
  WhyHaventYouStarted, 
  QuitConditionExplorer,
  CommitmentSynthesis,
  CommitmentBuilder,
  ResourceInventory,
  NetworkMapper,
  CapabilityInventory,
  ExperienceMiner,
  AssetReveal,
  GapAction
} from '@/components/program/mission-1';
// We will create this common component next
import { StandardSetupFrame } from './common/StandardSetupFrame'; 

export type NodeComponentProps = {
  node: ProgramNode;
  nodeKey: string;
  progress: { payload?: Record<string, any>; completed?: boolean };
  onComplete: (payload?: Record<string, any>) => Promise<void>;
};

export const programComponentRegistry: Record<string, ComponentType<NodeComponentProps>> = {
  // Mission 1 Setup
  'situation_explorer': SituationExplorer,
  
  // M1Q1: Draw the Line
  'barrier_reflection': StandardSetupFrame, // Reusing a common component!
  'why_havent_you_started': WhyHaventYouStarted,
  'motivation_explorer': MotivationExplorer,
  'future_reflection': FutureStateExplorer,
  'quit_condition_explorer': QuitConditionExplorer,
  'commitment_synthesis': CommitmentSynthesis,
  'commitment_builder': CommitmentBuilder,
  //M1Q2: What You Already Have
  'asset_inventory_intro': StandardSetupFrame,
  'resource_inventory': ResourceInventory, 
  'contact_inventory': NetworkMapper,
  'capability_inventory': CapabilityInventory,
  'experience_inventory': ExperienceMiner,
  'asset_reveal': AssetReveal,
  'gap_action': GapAction,
  // M1Q3: Make the Ask
  'asking_baseline': DummyNode,
  'squad_builder': DummyNode,
  'visibility_action': DummyNode,
  'real_world_ask': DummyNode,
  'prediction_reality_reveal': DummyNode,
  'learning_action': DummyNode,
  // M1Q4: Fear
  'fear_explorer': DummyNode,
  'low_threshold_ask': DummyNode,
  'fear_challenge': DummyNode,
  'fear_evidence_reveal': DummyNode,
  'behavior_commitment': DummyNode,

  // ... (keep the rest mapped to DummyNode for now)
};