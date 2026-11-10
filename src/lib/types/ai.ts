import type { Json } from '@/database.types';
import type {
  QualificationAnswers,
  ProblemDetails,
} from '@/lib/types/observations';

export type SynthesisReflectiveItem = {
  id: string;
  title: string;
  reflection: string;
  isPrimary?: boolean;
  isCustom?: boolean;
};

export type CommitmentSynthesisInput = {
  userName?: string;
  situation: string;
  barriers: SynthesisReflectiveItem[];
  motivations: SynthesisReflectiveItem[];
  future: string;
  futureChanges?: SynthesisReflectiveItem[];
  quitConditions: SynthesisReflectiveItem[];
};

export type CommitmentSynthesisResult = {
  headline: string;
  interpretation: string;
};

export type FrictionSynthesisResult = {
  headline: string;
  interpretation: string;
};

export type LearningActionOption = {
  id: string;
  title: string;
  description: string;
};

export type LearningActionResult = {
  options: LearningActionOption[];
};

export type RejectionSynthesisResult = {
  headline: string;
  interpretation: string;
};

export type AskPreparationGuide = {
  opening: string;
  wording: string;
  avoid: string[];
  ifTheySayNo: string;
  reminder: string;
};

// reveal observation patterns

export type ObservationPatternsInput = {
  observations: Array<{
    id: string;
    title: string;
    content: string;
    context: string | null;
    focus: string | null;
    problemDetails: ProblemDetails;
  }>;
  userContext: {
    capabilities: Json;
    experience: Json;
    motivations: Json;
    resources: Json;
    desiredFuture: Json;
    networkContext: Json;
  };
};

export type ObservationPatternFinding = {
  title: string;
  description: string;
  evidenceObservationIds: string[];
};

export type ObservationExperienceConnection = {
  title: string;
  description: string;
  contextEvidence: string;
  evidenceObservationIds: string[];
};

export type ObservationTension = {
  title: string;
  description: string;
  evidenceObservationIds: string[];
};

export type ObservationQuestion = {
  question: string;
  rationale: string;
  evidenceObservationIds: string[];
};

export type ObservationPatternsResult = {
  patterns: ObservationPatternFinding[];
  experienceConnections: ObservationExperienceConnection[];
  tensions: ObservationTension[];
  questions: ObservationQuestion[];
  overallReflection: string;
};