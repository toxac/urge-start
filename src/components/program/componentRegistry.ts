import type { ComponentType } from 'react';
import type { ProgramNode } from '@/program/types';

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
  GapAction,
  AskingBaseline,
  VisibilityAction,
  SquadBuilder,
  PredictionRealityReveal,
  LearningAction,
  FearAudit,
  FearEvidenceReveal,
  Mission1Reveal,
  Mission1Action,
} from '@/components/program/mission-1';

import {
  OpportunitySetup,
  ObservationSetup,
  ObservationCapture,
  ObservationQualification,
  ObservationPatternsReveal,
  PromoteToOpportunities,
  ConversationSetup,
  CustomerConversations,
  ConversationReflection,
  ConversationAction,
  PathSetup,
  HelpApproach,
  PathAssessment,
  PathReveal,
  OpportunityResearchPause,
  Mission2Reveal,
  Mission2Action,
} from '@/components/program/mission-2';

import {
  ProjectStartingPoint,
  TestAccessProfile,
  PitchFraming,
  PitchAndTestReveal,
  SelectTestsAction,
  TestPrepSetup,
  TestThresholds,
  TestPreparation,
  TestHeadsUpReveal,
  TestLaunchAction,
  SignalReadingSetup,
  TestRunLog,
  SignalReading,
  SignalReadingReveal,
  SignalRouteAction,
  Mission3Synthesis,
  Mission3Action,
} from './mission-3';

import {
  BusinessStartingPoint,
  CustomerPersonas,
  RuthlessCut,
  OfferAssessmentReveal,
  OfferLockAction,
  CostsLedger,
  UnitEconomicsBreakdown,
  PricingApproaches,
  PricingInActionReveal,
  PriceLockAction,
  OfferCommunication,
  PersonaCopyTest,
  MultichannelTractionLog,
  TractionAnalysisReveal,
  OfferAndChannelAction,
  Mission4Synthesis,
  Mission4Action,
} from './mission-4';

import {
  OperateStartingPoint,
  OperateGoalsSetup,
  OperateDataIngest,
  OperateWorkspaceEntry,
  OperateCrossroadsDecision,
  Mission6Synthesis,
  Mission6Action,
} from './mission-6';

import { StandardSetupFrame } from './common/StandardSetupFrame'; 
import { RealWorldExperiment } from './common/RealWorldExperiment';


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
  'asking_baseline': StandardSetupFrame,
  'squad_builder': SquadBuilder,
  'visibility_action': VisibilityAction,
  'real_world_ask': RealWorldExperiment,
  'prediction_reality_reveal': PredictionRealityReveal,
  'learning_action': LearningAction,
  // M1Q4: Fear
  'fear_explorer': StandardSetupFrame,
  'low_threshold_ask': RealWorldExperiment,
  'fear_challenge': RealWorldExperiment,
  'fear_evidence_reveal': FearEvidenceReveal,
  'behavior_commitment': FearAudit,
  // M1 Action
  'mission_transformation': Mission1Reveal,
  'mission_transfer_action': Mission1Action,

  //Mission 2
  'opportunity_starting_point': OpportunitySetup,
  // M2Q1
  'observation_setup': ObservationSetup,
  'observation_capture' : ObservationCapture,
  'observation_qualification': ObservationQualification,
  'observation_patterns_reveal': ObservationPatternsReveal,
  'promote_to_opportunities': PromoteToOpportunities,
  // M2Q2
  'conversation_setup': ConversationSetup,
  'customer_conversations': CustomerConversations,
  'conversations_reveal': ConversationReflection,
  'conversation_action': ConversationAction,

  // Mission 2: Quest 3 
  'path_setup': PathSetup,
  'help_approach': HelpApproach,
  'path_assessment': PathAssessment,
  'path_reveal': PathReveal,
  'opportunity_research_pause': OpportunityResearchPause,
  // Mission 2 Action
  'opportunity_synthesis': Mission2Reveal,
  'opportunity_action': Mission2Action,

  // Mission 3
  'project_starting_point': ProjectStartingPoint,
  'test_access_profile': TestAccessProfile,
  'pitch_framing': PitchFraming,
  'pitch_and_test_reveal': PitchAndTestReveal,
  'select_tests_action': SelectTestsAction,
  'test_prep_setup': TestPrepSetup,
  'test_thresholds': TestThresholds,
  'test_preparation': TestPreparation,
  'test_heads_up_reveal': TestHeadsUpReveal,
  'test_launch_action': TestLaunchAction,
  'signal_reading_setup': SignalReadingSetup,
  'test_run_log': TestRunLog,
  'signal_reading': SignalReading,
  'signal_reading_reveal': SignalReadingReveal,
  'signal_route_action': SignalRouteAction,
  'mission3_synthesis': Mission3Synthesis,
  'mission3_action': Mission3Action,

  // Mission 4
  'business_starting_point': BusinessStartingPoint,
  'customer_personas': CustomerPersonas,
  'ruthless_cut': RuthlessCut,
  'offer_assessment_reveal': OfferAssessmentReveal,
  'offer_lock_action': OfferLockAction,
  'costs_ledger': CostsLedger,
  'unit_economics_breakdown': UnitEconomicsBreakdown,
  'pricing_approaches': PricingApproaches,
  'pricing_in_action_reveal': PricingInActionReveal,
  'price_lock_action': PriceLockAction,
  'offer_communication': OfferCommunication,
  'persona_copy_test': PersonaCopyTest,
  'multichannel_traction_log': MultichannelTractionLog,
  'traction_analysis_reveal': TractionAnalysisReveal,
  'offer_and_channel_action': OfferAndChannelAction,
  'mission4_synthesis': Mission4Synthesis,
  'mission4_action': Mission4Action,

  //Mission 5

  // Mission 6
  'operate_starting_point': OperateStartingPoint,
  'operate_goals_setup': OperateGoalsSetup,
  'operate_data_ingest': OperateDataIngest,
  'operate_workspace_entry': OperateWorkspaceEntry,
  'operate_crossroads_decision': OperateCrossroadsDecision,
  'mission6_synthesis': Mission6Synthesis,
  'mission6_action': Mission6Action,

};