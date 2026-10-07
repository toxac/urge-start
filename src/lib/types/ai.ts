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