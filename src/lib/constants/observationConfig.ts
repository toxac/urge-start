export interface ObservationFocusConfig {
  key: string;
  label: string;
  prompt: string;
  guidance: string;
}

export interface ObservationDomainConfig {
  key: string;
  label: string;
  focuses: ObservationFocusConfig[];
}

export const observationConfig: ObservationDomainConfig[] = [
  {
    key: 'problem',
    label: 'Problems',
    focuses: [
      {
        key: 'personal',
        label: 'Personal',
        prompt: 'What keeps annoying you? What do you wish was easier?',
        guidance:
          'Pay attention to things that frustrate you, take too long, cost more than they should, or make you think, “Why is this so difficult?”',
      },
      {
        key: 'expertise',
        label: 'Expertise',
        prompt:
          'What problems do you notice because of what you already know or do?',
        guidance:
          'Think about your work, skills, hobbies, and experience. What do you see that someone unfamiliar with this area might miss?',
      },
      {
        key: 'people',
        label: 'People',
        prompt:
          'What do people around you complain about, struggle with, or work around?',
        guidance:
          'Listen to complaints and watch what people do. Look for repeated frustrations, workarounds, and things people have simply learned to put up with.',
      },
      {
        key: 'trends',
        label: 'Trends',
        prompt:
          "What's changing, and what new problems might that create?",
        guidance:
          'Look at changes in technology, behaviour, regulations, demographics, work, and culture. New situations often create new problems.',
      },
      {
        key: 'world',
        label: 'World',
        prompt:
          "What problems are people dealing with because of what's happening around them?",
        guidance:
          'Look beyond your immediate circle. Changes in the economy, environment, infrastructure, society, or technology can create problems for people and businesses.',
      },
    ],
  },
];

export function getObservationDomainConfig(
  domain: string,
): ObservationDomainConfig | undefined {
  return observationConfig.find((item) => item.key === domain);
}