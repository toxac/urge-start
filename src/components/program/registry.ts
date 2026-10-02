import type { ComponentType } from 'react';
import type { ProgramNode } from '@/program/types';

import { DummyNode } from './DummyNode';

export type NodeComponentProps = {
  node: ProgramNode;
};

export const programComponentRegistry: Record<string, ComponentType<NodeComponentProps>> = {
  // Setup
  'situation_explorer': DummyNode,
  
  // Q1: Draw the Line
  'barrier_reflection': DummyNode,
  'why_havent_you_started': DummyNode,
  'motivation_explorer': DummyNode,
  'future_reflection': DummyNode,
  'quit_condition_explorer': DummyNode,
  'commitment_synthesis': DummyNode,
  'commitment_builder': DummyNode,

  // Q2: What You Already Have
  'asset_inventory_intro': DummyNode,
  'resource_inventory': DummyNode,
  'contact_inventory': DummyNode,
  'capability_inventory': DummyNode,
  'experience_inventory': DummyNode,
  'asset_reveal': DummyNode,
  'gap_action': DummyNode,

  // Q3: Make the Ask
  'asking_baseline': DummyNode,
  'squad_builder': DummyNode,
  'visibility_action': DummyNode,
  'real_world_ask': DummyNode,
  'prediction_reality_reveal': DummyNode,
  'learning_action': DummyNode,

  // Q4: Test Your Fear
  'fear_explorer': DummyNode,
  'low_threshold_ask': DummyNode,
  'fear_challenge': DummyNode,
  'fear_evidence_reveal': DummyNode,
  'behavior_commitment': DummyNode,

  // Mission Reveal & Action
  'mission_transformation': DummyNode,
  'mission_transfer_action': DummyNode,
};