'use server';

import { invokeAIStandard } from '@/actions/ai';
import type { AlphaAnalysisResult } from '@/lib/types/builds';

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

export async function readAlphaTestSignals(params: {
  projectTitle: string;
  offerTitle: string;
  offerPromise: string;
  usersOnboarded: number;
  outcomesDelivered: number;
  actualHoursPerBuyer: number;
  estimatedHoursPerBuyer: number;
  buyerQuotesAndBlockers: string[];
  notes: string;
  nodeKey?: string;
  regenerate?: boolean;
}): Promise<AlphaAnalysisResult> {
  const sourceNodeKey = params.nodeKey?.trim() || 'm5-q2-read';

  const systemPrompt = `
You are Urge, helping a founder evaluate the results of their Founding Alpha Test (delivering v1 to their first 3-5 buyers).

Compare what actually happened against their v1 promise and their Mission 4 estimated delivery hours per buyer.

Return ONLY valid JSON in this exact structure:
{
  "deliveryVerdict": "ready_to_launch" | "fix_bottlenecks_first",
  "whatWorked": "2 sentences summarizing how many buyers got the promised outcome and what clicked.",
  "timeAndCostReality": "2 direct sentences comparing actualHoursPerBuyer against estimatedHoursPerBuyer and what that means for their margins/capacity.",
  "mustFixBeforeLaunch": ["string"],
  "ignoreForNow": ["string"]
}

RULES:
- Base everything strictly on the numbers and quotes provided.
- "ready_to_launch" = majority of alpha buyers achieved the outcome and delivery hours are close to estimate.
- "fix_bottlenecks_first" = low outcome completion, major onboarding confusion, or actual delivery hours far exceed estimate.
- mustFixBeforeLaunch: 1 to 3 concrete fixes that directly blocked delivery or wasted founder time.
- ignoreForNow: 1 to 2 nice-to-have feature requests that can wait until after public launch.
`;

  const result = await invokeAIStandard({
    systemPrompt,
    userPrompt: JSON.stringify(params),
    componentKey: 'alpha_signal_read',
    sourceNodeKey,
    purpose: 'read_alpha_test_signals',
    requireJson: true,
    temperature: params.regenerate ? 0.45 : 0.2,
  });

  if (!result.success || !result.content) {
    throw new Error(
      result.error || 'Could not analyze your Alpha test results.',
    );
  }

  try {
    const parsed: unknown = JSON.parse(result.content);
    if (
      !isRecord(parsed) ||
      typeof parsed.whatWorked !== 'string' ||
      typeof parsed.timeAndCostReality !== 'string'
    ) {
      throw new Error('Invalid Alpha analysis response shape.');
    }

    const deliveryVerdict =
      parsed.deliveryVerdict === 'ready_to_launch' ||
      parsed.deliveryVerdict === 'fix_bottlenecks_first'
        ? parsed.deliveryVerdict
        : 'fix_bottlenecks_first';

    return {
      deliveryVerdict,
      whatWorked: parsed.whatWorked.trim(),
      timeAndCostReality: parsed.timeAndCostReality.trim(),
      mustFixBeforeLaunch: parseStringArray(parsed.mustFixBeforeLaunch).slice(
        0,
        3,
      ),
      ignoreForNow: parseStringArray(parsed.ignoreForNow).slice(0, 2),
    };
  } catch (err) {
    console.error('[MISSION 5 ALPHA SIGNAL READ]', err);
    throw new Error(
      'Could not interpret the Alpha test analysis. Please try again.',
    );
  }
}