'use server';

import { invokeAIStandard } from '@/actions/ai';
import type {
  EconomicsAssessmentResult,
  ExtractedCustomerPersona,
  MspFeatureItem,
  ObservedUserProfileInput,
  OfferAssessmentResult,
  ProjectEconomics,
} from '@/lib/types/projects';

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

export async function extractCustomerPersonas(params: {
  projectTitle: string;
  problemStatement: string;
  profiles: ObservedUserProfileInput[];
  m3Quotes: string[];
  nodeKey?: string;
  regenerate?: boolean;
}): Promise<{
  personas: ExtractedCustomerPersona[];
  painsRemoved: string[];
  gainsCreated: string[];
}> {
  const sourceNodeKey = params.nodeKey?.trim() || 'm4-q1-personas';

  if (!params.profiles || params.profiles.length === 0) {
    throw new Error('Upload or add at least one customer observation row first.');
  }

  const systemPrompt = `
You are Urge, helping a first-time founder turn raw notes about real people into 1 or 2 concrete customer personas for a Minimum Sellable Product.

Analyze the founder's observed user rows and Mission 3 quotes, and return ONLY valid JSON in this exact structure:
{
  "personas": [
    {
      "id": "persona_1",
      "name": "Short descriptive persona label (e.g. Time-Strapped Independent Cafe Owner)",
      "summary": "1-2 plain sentences describing who they are and their context.",
      "corePain": "The sharpest recurring frustration or cost they deal with.",
      "desiredGain": "What a real win looks like to them in plain words.",
      "currentAlternative": "What they currently use or do instead.",
      "triggerMoment": "The exact moment they look for help or feel the pain hardest."
    }
  ],
  "painsRemoved": ["string"],
  "gainsCreated": ["string"]
}

RULES:
- Extract 1 persona if all rows describe the same group, or 2 distinct personas if there are two clear segments. Never invent a 3rd.
- Base every detail strictly on the supplied rows and quotes—do not invent demographics or market statistics.
- painsRemoved: 2 to 4 specific pains your v1 offer must eliminate.
- gainsCreated: 2 to 4 concrete outcomes/wins your v1 offer creates.
- Keep the language grounded, specific, and completely free of marketing buzzwords.
`;

  const result = await invokeAIStandard({
    systemPrompt,
    userPrompt: JSON.stringify({
      projectTitle: params.projectTitle,
      problemStatement: params.problemStatement,
      observedProfiles: params.profiles,
      m3Quotes: params.m3Quotes,
    }),
    componentKey: 'customer_personas',
    sourceNodeKey,
    purpose: 'extract_customer_personas',
    requireJson: true,
    temperature: params.regenerate ? 0.5 : 0.25,
  });

  if (!result.success || !result.content) {
    throw new Error(
      result.error || 'Could not extract personas from your sheet.',
    );
  }

  try {
    const parsed: unknown = JSON.parse(result.content);
    if (!isRecord(parsed) || !Array.isArray(parsed.personas)) {
      throw new Error('Invalid persona JSON structure.');
    }

    const personas: ExtractedCustomerPersona[] = parsed.personas
      .filter(isRecord)
      .slice(0, 2)
      .map((p, idx) => ({
        id: typeof p.id === 'string' && p.id ? p.id : `persona_${idx + 1}`,
        name:
          typeof p.name === 'string' && p.name.trim()
            ? p.name.trim()
            : `Target Customer ${idx + 1}`,
        summary: typeof p.summary === 'string' ? p.summary.trim() : '',
        corePain: typeof p.corePain === 'string' ? p.corePain.trim() : '',
        desiredGain:
          typeof p.desiredGain === 'string' ? p.desiredGain.trim() : '',
        currentAlternative:
          typeof p.currentAlternative === 'string'
            ? p.currentAlternative.trim()
            : '',
        triggerMoment:
          typeof p.triggerMoment === 'string' ? p.triggerMoment.trim() : '',
      }));

    if (personas.length === 0) {
      throw new Error('No personas returned.');
    }

    return {
      personas,
      painsRemoved: parseStringArray(parsed.painsRemoved).slice(0, 4),
      gainsCreated: parseStringArray(parsed.gainsCreated).slice(0, 4),
    };
  } catch (err) {
    console.error('[MISSION 4 EXTRACT PERSONAS]', err);
    throw new Error(
      'Could not interpret the persona summary. Please try again.',
    );
  }
}

export async function assessMinimumSellableOffer(params: {
  projectTitle: string;
  problemStatement: string;
  m3Constraint: string;
  personas: ExtractedCustomerPersona[];
  painsRemoved: string[];
  gainsCreated: string[];
  features: MspFeatureItem[];
  m3Quotes: string[];
  nodeKey?: string;
  regenerate?: boolean;
}): Promise<OfferAssessmentResult> {
  const sourceNodeKey = params.nodeKey?.trim() || 'm4-q1-reveal';

  const mustHaves = params.features.filter((f) => f.bucket === 'must_have');
  const cutItems = params.features.filter((f) => f.bucket === 'cut_for_later');

  const systemPrompt = `
You are Urge, acting as a ruthless, practical product advisor helping a first-time founder shape a Minimum Sellable Product (MSP).

Your job is to check whether their "Must have to sell (v1)" list actually solves the customer's core pain without bloating v1, and draft a crisp, honest v1 offer based ONLY on what they kept.

Return ONLY valid JSON in this exact structure:
{
  "alignmentNotes": ["string"],
  "scopeWarnings": ["string"],
  "gapsToWatch": ["string"],
  "suggestedOffer": {
    "title": "Short, clear name for the v1 offer",
    "promise": "1-2 sentences stating the concrete outcome the buyer gets and how fast.",
    "includedSummary": "Plain bullet-style or comma-separated list of what is included in v1.",
    "excludedSummary": "What is explicitly NOT included in v1 so expectations stay clear.",
    "hook": "Why a buyer would choose this over their current workaround, grounded in their real quotes.",
    "ask": "One clear step to buy, book, or reserve a v1 spot."
  }
}

RULES:
- alignmentNotes: 1 to 3 points showing which Must-Have items directly address a core pain or gain.
- scopeWarnings: 1 to 2 candid warnings if any Must-Have item looks like unnecessary bloat, violates their Mission 3 constraint, or can be delivered manually first. Return empty array if v1 is already lean.
- gapsToWatch: 1 to 2 points if a critical pain from their persona is left unaddressed. Return empty array if covered.
- suggestedOffer: Must rely ONLY on the Must-Have items—never sneak Cut-for-Later features into v1. Do not invent specific prices yet (pricing happens in Quest 2).
- Keep language concrete, plain-spoken, and free of hype.
`;

  const result = await invokeAIStandard({
    systemPrompt,
    userPrompt: JSON.stringify({
      projectTitle: params.projectTitle,
      problemStatement: params.problemStatement,
      m3Constraint: params.m3Constraint,
      personas: params.personas,
      painsRemoved: params.painsRemoved,
      gainsCreated: params.gainsCreated,
      mustHaveFeatures: mustHaves,
      cutForLaterFeatures: cutItems,
      m3Quotes: params.m3Quotes,
    }),
    componentKey: 'offer_assessment_reveal',
    sourceNodeKey,
    purpose: 'assess_minimum_sellable_offer',
    requireJson: true,
    temperature: params.regenerate ? 0.5 : 0.25,
  });

  if (!result.success || !result.content) {
    throw new Error(
      result.error || 'Could not assess your v1 offer right now.',
    );
  }

  try {
    const parsed: unknown = JSON.parse(result.content);
    if (!isRecord(parsed) || !isRecord(parsed.suggestedOffer)) {
      throw new Error('Invalid offer assessment structure.');
    }

    const offer = parsed.suggestedOffer;

    return {
      alignmentNotes: parseStringArray(parsed.alignmentNotes).slice(0, 3),
      scopeWarnings: parseStringArray(parsed.scopeWarnings).slice(0, 3),
      gapsToWatch: parseStringArray(parsed.gapsToWatch).slice(0, 2),
      suggestedOffer: {
        title:
          typeof offer.title === 'string' && offer.title.trim()
            ? offer.title.trim()
            : `${params.projectTitle} — Early Access v1`,
        promise: typeof offer.promise === 'string' ? offer.promise.trim() : '',
        includedSummary:
          typeof offer.includedSummary === 'string'
            ? offer.includedSummary.trim()
            : mustHaves.map((m) => m.label).join(', '),
        excludedSummary:
          typeof offer.excludedSummary === 'string'
            ? offer.excludedSummary.trim()
            : cutItems.map((c) => c.label).join(', '),
        hook: typeof offer.hook === 'string' ? offer.hook.trim() : '',
        ask: typeof offer.ask === 'string' ? offer.ask.trim() : '',
      },
    };
  } catch (err) {
    console.error('[MISSION 4 OFFER ASSESSMENT]', err);
    throw new Error(
      'Could not interpret the offer assessment. Please try again.',
    );
  }
}

export async function assessUnitEconomics(params: {
  projectTitle: string;
  businessType: string;
  economics: ProjectEconomics;
  m1Constraints: {
    weeklyHours?: string;
    budgetCap?: string;
    incomeGoal?: string;
  };
  nodeKey?: string;
  regenerate?: boolean;
}): Promise<EconomicsAssessmentResult> {
  const sourceNodeKey = params.nodeKey?.trim() || 'm4-q2-reveal';

  const systemPrompt = `
You are Urge, acting as a candid, practical financial peer helping a first-time founder check their version 1 pricing and unit economics.

Analyze their uploaded costs, chosen price, pricing rationale, and Mission 1 constraints (available weekly hours, budget cap, and monthly take-home income goal).

Return ONLY valid JSON in this exact structure:
{
  "marginHealth": "1-2 direct sentences evaluating profit left per sale after direct and acquisition costs.",
  "volumeReality": "1-2 direct sentences on how many monthly sales are needed to cover fixed bills, pay back setup costs, and hit their income goal—and whether that volume is realistic for v1.",
  "timeCeiling": "1-2 direct sentences comparing the weekly hours required at goal volume against their available weekly hours.",
  "verdict": "solid" | "tight" | "unviable"
}

RULES:
- Use the exact numbers and currency symbol provided in the input.
- If weeklyHoursAtIncomeGoal exceeds availableWeeklyHours, call that out clearly—they will burn out unless they raise price, cut delivery hours, or productize.
- If oneTimeSetupCosts exceeds their Mission 1 budget cap, point it out plainly.
- "solid" = healthy margin, realistic v1 sales volume, fits within weekly hours.
- "tight" = works at small scale, but thin margin or tight hours will squeeze them as volume grows.
- "unviable" = negative margin, setup cost way over budget, or mathematically impossible within available weekly hours.
- Keep it plain-spoken, grounded, and free of MBA jargon.
`;

  const result = await invokeAIStandard({
    systemPrompt,
    userPrompt: JSON.stringify({
      projectTitle: params.projectTitle,
      businessType: params.businessType,
      currency: params.economics.currency,
      pricePerUnit: params.economics.pricePerUnit,
      pricingApproach: params.economics.pricingApproach,
      pricingRationale: params.economics.pricingRationale,
      oneTimeSetupCosts: params.economics.oneTimeSetupCosts,
      monthlyFixedCosts: params.economics.monthlyFixedCosts,
      directCostPerUnit: params.economics.directCostPerUnit,
      cacPerUnit: params.economics.cacPerUnit,
      hoursPerUnit: params.economics.hoursPerUnit,
      marginPerUnit: params.economics.marginPerUnit,
      marginPercent: params.economics.marginPercent,
      breakEvenUnitsPerMonth: params.economics.breakEvenUnitsPerMonth,
      setupPaybackUnits: params.economics.setupPaybackUnits,
      targetMonthlyIncome: params.economics.targetMonthlyIncome,
      unitsForIncomeGoal: params.economics.unitsForIncomeGoal,
      availableWeeklyHours: params.economics.availableWeeklyHours,
      weeklyHoursAtIncomeGoal: params.economics.weeklyHoursAtIncomeGoal,
      uncertainNotes: params.economics.uncertainNotes,
      m1BudgetCap: params.m1Constraints.budgetCap || 'Not specified',
    }),
    componentKey: 'pricing_in_action_reveal',
    sourceNodeKey,
    purpose: 'assess_unit_economics',
    requireJson: true,
    temperature: params.regenerate ? 0.4 : 0.15,
  });

  if (!result.success || !result.content) {
    throw new Error(
      result.error || 'Could not assess your unit economics right now.',
    );
  }

  try {
    const parsed: unknown = JSON.parse(result.content);
    if (
      !isRecord(parsed) ||
      typeof parsed.marginHealth !== 'string' ||
      typeof parsed.volumeReality !== 'string' ||
      typeof parsed.timeCeiling !== 'string'
    ) {
      throw new Error('Invalid unit economics assessment structure.');
    }

    const verdict =
      parsed.verdict === 'solid' ||
      parsed.verdict === 'tight' ||
      parsed.verdict === 'unviable'
        ? parsed.verdict
        : 'tight';

    return {
      marginHealth: parsed.marginHealth.trim(),
      volumeReality: parsed.volumeReality.trim(),
      timeCeiling: parsed.timeCeiling.trim(),
      verdict,
    };
  } catch (err) {
    console.error('[MISSION 4 UNIT ECONOMICS]', err);
    throw new Error(
      'Could not interpret the financial reality check. Please try again.',
    );
  }
}