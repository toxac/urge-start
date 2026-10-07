export type CommitmentSynthesisInput = {
  situation: string;
  barriers: Array<{
    id: string;
    title: string;
    reflection: string;
  }>;
  motivations: Array<{
    id: string;
    title: string;
    reflection: string;
  }>;
  future: string;
  quitConditions: Array<{
    id: string;
    title: string;
    reflection: string;
  }>;
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