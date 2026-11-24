'use server';

import { invokeAIStandard } from '@/actions/ai';
import type {
  EconomicsAssessmentResult,
  ExtractedCustomerPersona,
  MspFeatureItem,
  ObservedUserProfileInput,
  OfferAssessmentResult,
  ProjectEconomics,
  ChannelCopyDraft, PersonaCopyFeedback, TractionAnalysisResult, TractionChannelKey
} from '@/lib/types/projects';

import {ChannelBreakdownEntry} from '@/lib/types/experiments';


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


export async function generateAndStressTestChannelCopy(params: {
  projectTitle: string;
  offerTitle: string;
  offerPromise: string;
  includedSummary: string;
  excludedSummary: string;
  priceLabel: string;
  paymentModel: string;
  buyingStep: string;
  coreAngle: string;
  channels: Array<{ key: TractionChannelKey; label: string }>;
  personas: ExtractedCustomerPersona[];
  nodeKey?: string;
  regenerate?: boolean;
}): Promise<{
  channelDrafts: ChannelCopyDraft[];
  personaFeedback: PersonaCopyFeedback[];
}> {
  const sourceNodeKey = params.nodeKey?.trim() || 'm4-q3-persona-test';

  const systemPrompt = `
You are Urge, helping a first-time founder prepare clear, honest offer communication for multiple channels and stress-test that message against their target customer personas.

Return ONLY valid JSON in this exact structure:
{
  "channelDrafts": [
    {
      "channel": "channel_key_from_input",
      "channelLabel": "Channel Label",
      "headlineOrHook": "Opening line, subject line, or flyer headline",
      "messageBody": "Concise, concrete copy stating the problem solved, what v1 includes, the starting price, and payment model.",
      "ctaStep": "Clear single next step to buy, book, or claim an early spot."
    }
  ],
  "personaFeedback": [
    {
      "personaName": "Name of persona from input",
      "reaction": "1-2 sentences in plain, realistic language showing how this buyer reads the offer and price.",
      "frictionPoint": "The #1 question, doubt, or price hesitation that might stop them from acting.",
      "suggestedFix": "One concrete tweak to the copy or proof to remove that hesitation."
    }
  ]
}

RULES:
- Generate exactly one draft per channel supplied in the input, preserving the exact channel key and channelLabel.
- Tailor format naturally:
  - landing_page: crisp headline + 3 short bullets + price + button CTA
  - direct_outreach: personal, under-110-word WhatsApp/email/DM note
  - social_post: scroll-stopping hook + short story/problem + clear priced v1 invite
  - local_flyer: bold 6-word headline + 3 bullets + price + QR/WhatsApp booking step
  - community_drop: helpful, non-spammy peer post inviting founding pilot members at the transparent price
- Every draft MUST state the real starting price plainly—no hiding price.
- Simulate realistic feedback for each supplied persona (or 1 general target buyer if none supplied). Never flatter—surface real objections.
`;

  const result = await invokeAIStandard({
    systemPrompt,
    userPrompt: JSON.stringify(params),
    componentKey: 'persona_copy_test',
    sourceNodeKey,
    purpose: 'generate_and_stress_test_channel_copy',
    requireJson: true,
    temperature: params.regenerate ? 0.55 : 0.3,
  });

  if (!result.success || !result.content) {
    throw new Error(
      result.error || 'Could not generate channel drafts and persona check.',
    );
  }

  try {
    const parsed: unknown = JSON.parse(result.content);
    if (
      !isRecord(parsed) ||
      !Array.isArray(parsed.channelDrafts) ||
      !Array.isArray(parsed.personaFeedback)
    ) {
      throw new Error('Invalid channel copy response shape.');
    }

    const channelDrafts: ChannelCopyDraft[] = parsed.channelDrafts
      .filter(isRecord)
      .map((item, idx) => {
        const fallback = params.channels[idx] ?? {
          key: 'direct_outreach' as TractionChannelKey,
          label: 'Direct Outreach',
        };
        return {
          channel: (typeof item.channel === 'string'
            ? item.channel
            : fallback.key) as TractionChannelKey,
          channelLabel:
            typeof item.channelLabel === 'string' && item.channelLabel.trim()
              ? item.channelLabel.trim()
              : fallback.label,
          headlineOrHook:
            typeof item.headlineOrHook === 'string'
              ? item.headlineOrHook.trim()
              : '',
          messageBody:
            typeof item.messageBody === 'string' ? item.messageBody.trim() : '',
          ctaStep:
            typeof item.ctaStep === 'string' ? item.ctaStep.trim() : '',
        };
      });

    const personaFeedback: PersonaCopyFeedback[] = parsed.personaFeedback
      .filter(isRecord)
      .map((item, idx) => ({
        personaName:
          typeof item.personaName === 'string' && item.personaName.trim()
            ? item.personaName.trim()
            : `Target Buyer ${idx + 1}`,
        reaction:
          typeof item.reaction === 'string' ? item.reaction.trim() : '',
        frictionPoint:
          typeof item.frictionPoint === 'string'
            ? item.frictionPoint.trim()
            : '',
        suggestedFix:
          typeof item.suggestedFix === 'string' ? item.suggestedFix.trim() : '',
      }));

    return { channelDrafts, personaFeedback };
  } catch (err) {
    console.error('[MISSION 4 CHANNEL COPY TEST]', err);
    throw new Error(
      'Could not interpret the channel copy feedback. Please try again.',
    );
  }
}

export async function analyzeMultiChannelTraction(params: {
  projectTitle: string;
  offerTitle: string;
  priceLabel: string;
  channelBreakdown: ChannelBreakdownEntry[];
  objectionsAndQuotes: string[];
  notes: string;
  dryRunSummary?: string;
  nodeKey?: string;
  regenerate?: boolean;
}): Promise<TractionAnalysisResult> {
  const sourceNodeKey = params.nodeKey?.trim() || 'm4-q3-reveal';

  const systemPrompt = `
You are Urge, helping a first-time founder read the results of a multi-channel priced offer test.

Compare conversion and engagement across all tested channels, separate facts from guesses, and return ONLY valid JSON in this exact structure:
{
  "shows": "2-3 sentences stating the concrete numbers across channels (reach, inquiries, and paid/committed buyers).",
  "channelWinner": "2 sentences naming which channel performed strongest (or noting if none converted yet) and why.",
  "priceAndScopeFriction": "2 sentences summarizing what objections or hesitations surfaced around the price, payment terms, or v1 features.",
  "unclear": "1-2 sentences pointing out what still needs to be proven in Mission 5 (e.g., stranger repeatability or fulfillment speed)."
}

RULES:
- Stick strictly to the numbers and quotes provided. An honest zero is a clear fact.
- Do not invent conversion benchmarks or flatter weak results.
`;

  const result = await invokeAIStandard({
    systemPrompt,
    userPrompt: JSON.stringify(params),
    componentKey: 'traction_analysis_reveal',
    sourceNodeKey,
    purpose: 'analyze_multichannel_traction',
    requireJson: true,
    temperature: params.regenerate ? 0.45 : 0.2,
  });

  if (!result.success || !result.content) {
    throw new Error(
      result.error || 'Could not analyze your traction results.',
    );
  }

  try {
    const parsed: unknown = JSON.parse(result.content);
    if (
      !isRecord(parsed) ||
      typeof parsed.shows !== 'string' ||
      typeof parsed.channelWinner !== 'string' ||
      typeof parsed.priceAndScopeFriction !== 'string' ||
      typeof parsed.unclear !== 'string'
    ) {
      throw new Error('Invalid traction analysis shape.');
    }

    return {
      shows: parsed.shows.trim(),
      channelWinner: parsed.channelWinner.trim(),
      priceAndScopeFriction: parsed.priceAndScopeFriction.trim(),
      unclear: parsed.unclear.trim(),
    };
  } catch (err) {
    console.error('[MISSION 4 TRACTION ANALYSIS]', err);
    throw new Error(
      'Could not interpret the traction analysis. Please try again.',
    );
  }
}