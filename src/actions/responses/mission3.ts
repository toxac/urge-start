'use server';

import { invokeAILight, invokeAIStandard } from '@/actions/ai';
import type {
  ExperimentMetricDefinition,
  ExperimentPitchSetup,
  PitchReviewResult,
  SignalReadingResult,
  UserExperimentResults,
  UserExperimentThreshold,
} from '@/lib/types/experiments';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePitchReview(content: string): PitchReviewResult {
  const parsed: unknown = JSON.parse(content);
  if (!isRecord(parsed)) {
    throw new Error('AI returned an invalid pitch review.');
  }

  return {
    whatWorks: parseStringArray(parsed.whatWorks).slice(0, 3),
    watchOut: parseStringArray(parsed.watchOut).slice(0, 3),
    sharperVersions: parseStringArray(parsed.sharperVersions).slice(0, 2),
  };
}

export async function reviewMission3Pitch(params: {
  projectTitle: string;
  pitch: ExperimentPitchSetup;
  nodeKey?: string;
  regenerate?: boolean;
}): Promise<PitchReviewResult> {
  const sourceNodeKey = params.nodeKey?.trim() || 'm3-q1-reveal';

  if (!params.pitch?.pain?.trim()) {
    throw new Error('Describe the problem before reviewing your pitch.');
  }

  const systemPrompt = `
You are Urge, acting as a plain-spoken, practical peer helping a first-time entrepreneur frame an early problem test.

The founder is NOT selling a finished product or naming final prices yet. They want to put the problem in front of real people to see if people want it solved enough to take a small action (like replying, signing up, or booking an early spot).

Review their four-part pitch framing and return ONLY valid JSON in this exact structure:
{
  "whatWorks": ["string"],
  "watchOut": ["string"],
  "sharperVersions": ["string"]
}

RULES:
- whatWorks: 1 to 2 short, specific points on what is already clear and relatable.
- watchOut: 1 to 2 short points if anything sounds vague, uses jargon, over-promises unbuilt features, or mentions premature pricing. Return an empty array if nothing needs fixing.
- sharperVersions: 1 to 2 natural, plain-spoken ways they could state the problem + direction + small ask in 2-3 sentences, preserving their exact meaning without marketing buzzwords.
- Do not judge whether the business will succeed or tell them which test to pick.
- Keep every bullet concise (1-2 sentences max).
`;

  const result = await invokeAILight({
    systemPrompt,
    userPrompt: JSON.stringify({
      projectTitle: params.projectTitle,
      audience: params.pitch.audience ?? '',
      pain: params.pitch.pain ?? '',
      direction: params.pitch.direction ?? '',
      ask: params.pitch.ask ?? '',
    }),
    componentKey: 'pitch_and_test_reveal',
    sourceNodeKey,
    purpose: 'pitch_review',
    requireJson: true,
    temperature: params.regenerate ? 0.55 : 0.3,
  });

  if (!result.success || !result.content) {
    throw new Error(result.error || 'Could not review your pitch right now.');
  }

  try {
    return parsePitchReview(result.content);
  } catch (error) {
    console.error('[MISSION 3 PITCH REVIEW]', error);
    throw new Error('Could not interpret the pitch review. Please try again.');
  }
}

export async function readMission3Signals(params: {
  projectTitle: string;
  experiments: Array<{
    title: string;
    passNumber: number;
    where?: string;
    metrics: ExperimentMetricDefinition[];
    threshold: UserExperimentThreshold;
    results: UserExperimentResults;
  }>;
  quotes: string[];
  nodeKey?: string;
  regenerate?: boolean;
}): Promise<SignalReadingResult> {
  const sourceNodeKey = params.nodeKey?.trim() || 'm3-q3-read';

  const systemPrompt = `
You are Urge, helping a first-time founder read what came back from their real-world problem tests.

You are a mirror, not an oracle. Keep facts strictly separate from interpretation, and leave the decision to the founder.

Return ONLY valid JSON in this exact structure:
{
  "shows": "string",
  "mightMean": "string",
  "unclear": "string"
}

RULES:
- shows: State only the concrete facts—what was run, the recorded numbers compared against the pre-launch targets, and notable themes from what people actually said. An honest zero is a clear fact.
- mightMean: Offer 2-3 plausible interpretations of why people acted or didn't act (e.g., framing, channel fit, urgency of the problem, or audience match). Use tentative language ("might suggest", "could mean"). Never state conclusions as certainty.
- unclear: Point out 1-3 things these results still do not answer (e.g., small sample size, warm contacts vs. strangers, or whether people would commit further).
- Do NOT tell the founder whether to proceed, iterate, or quit.
- Do NOT invent numbers or quotes not present in the input.
- Keep each section clear, direct, and grounded (2-4 sentences each).
`;

  const result = await invokeAIStandard({
    systemPrompt,
    userPrompt: JSON.stringify({
      projectTitle: params.projectTitle,
      experiments: params.experiments,
      quotes: params.quotes,
    }),
    componentKey: 'signal_reading',
    sourceNodeKey,
    purpose: 'signal_reading',
    requireJson: true,
    temperature: params.regenerate ? 0.45 : 0.25,
  });

  if (!result.success || !result.content) {
    throw new Error(result.error || 'Could not generate a signal read.');
  }

  try {
    const parsed: unknown = JSON.parse(result.content);
    if (
      !isRecord(parsed) ||
      typeof parsed.shows !== 'string' ||
      typeof parsed.mightMean !== 'string' ||
      typeof parsed.unclear !== 'string'
    ) {
      throw new Error('Invalid signal reading shape.');
    }

    return {
      shows: parsed.shows.trim(),
      mightMean: parsed.mightMean.trim(),
      unclear: parsed.unclear.trim(),
    };
  } catch (error) {
    console.error('[MISSION 3 SIGNAL READING]', error);
    throw new Error(
      'Could not interpret the signal summary. Please try again.',
    );
  }
}