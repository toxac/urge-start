'use server';

import { invokeAIStandard } from '@/actions/ai';
import type {
  OpsAnalysisContent,
  OpsAnalysisGap,
  OpsDomain,
  OpsGoalContent,
  OpsPlanContent,
  OpsRoutedAction,
} from '@/lib/types/ops';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function analyzeOperatingGaps(params: {
  projectTitle: string;
  businessType: string;
  currency: string;
  goals: OpsGoalContent | null;
  m4Economics: {
    pricePerUnit: number;
    directCostPerUnit: number;
    monthlyFixedCosts: number;
    hoursPerUnit: number;
    availableWeeklyHours: number;
  };
  metricsSummary: {
    netRevenue: number;
    netProfit: number;
    totalOrders: number;
    repeatRatePercent: number;
    outcomeRatePercent: number;
    avgHoursPerOrder: number;
    totalInquiries: number;
    inquiryToSalePercent: number;
    actualCac: number;
  };
  recentSalesNotes: string[];
  topChannels: Array<{
    channel: string;
    inquiries: number;
    orders: number;
    spend: number;
  }>;
  nodeKey?: string;
}): Promise<OpsAnalysisContent> {
  const sourceNodeKey = params.nodeKey?.trim() || 'm6-q2-operate';

  const systemPrompt = `
You are Urge, an intelligent startup copilot helping a founder run their newly launched business using fundamentals—not throwing money at problems.

Inspect their live operating metrics against their quarterly goals and Mission 4 unit economics, and identify 2 or 3 concrete gaps across Market, Money, and Customer.

CRITICAL PEDAGOGICAL RULE:
Do NOT jump straight to prescribing solutions. For each gap, craft a sharp, thought-provoking "diagnosisPrompt" that asks the founder to explain the root cause from their own front-line observation BEFORE they unlock the planner.

Return ONLY valid JSON in this exact structure:
{
  "summary": "2 direct sentences summarizing overall health against goals and unit economics.",
  "gaps": [
    {
      "id": "gap_1",
      "domain": "market" | "money" | "customer",
      "headline": "Short, concrete gap title (e.g. Inquiries are stalling before payment)",
      "evidence": "1-2 sentences citing their exact numbers from sales, traffic, or unit economics.",
      "diagnosisPrompt": "One sharp question asking the founder what they think is causing this gap."
    }
  ]
}

RULES:
- Cite exact numbers and currency symbol from input.
- If data is still sparse (e.g., 0 or few rows), point out the blind spot honestly and ask what front-line signal they are seeing this week.
- Return 2 to 3 gaps covering distinct domains where possible (market, money, customer).
`;

  const result = await invokeAIStandard({
    systemPrompt,
    userPrompt: JSON.stringify(params),
    componentKey: 'ops_gap_analysis',
    sourceNodeKey,
    purpose: 'analyze_operating_gaps',
    requireJson: true,
    temperature: 0.25,
  });

  if (!result.success || !result.content) {
    throw new Error(
      result.error || 'Could not analyze your operating numbers right now.',
    );
  }

  try {
    const parsed: unknown = JSON.parse(result.content);
    if (
      !isRecord(parsed) ||
      typeof parsed.summary !== 'string' ||
      !Array.isArray(parsed.gaps)
    ) {
      throw new Error('Invalid gap analysis response structure.');
    }

    const gaps: OpsAnalysisGap[] = parsed.gaps
      .filter(isRecord)
      .slice(0, 3)
      .map((g, idx) => {
        const domain =
          g.domain === 'market' ||
          g.domain === 'money' ||
          g.domain === 'customer'
            ? g.domain
            : 'market';
        return {
          id: typeof g.id === 'string' && g.id ? g.id : `gap_${idx + 1}`,
          domain,
          headline:
            typeof g.headline === 'string' && g.headline.trim()
              ? g.headline.trim()
              : 'Operational Bottleneck',
          evidence: typeof g.evidence === 'string' ? g.evidence.trim() : '',
          diagnosisPrompt:
            typeof g.diagnosisPrompt === 'string' && g.diagnosisPrompt.trim()
              ? g.diagnosisPrompt.trim()
              : 'What do you think is causing this in your day-to-day conversations?',
        };
      });

    return {
      summary: parsed.summary.trim(),
      gaps,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[MISSION 6 GAP ANALYSIS]', err);
    throw new Error(
      'Could not interpret the operating gap analysis. Please try again.',
    );
  }
}

export async function generateDomainOpsPlan(params: {
  projectTitle: string;
  businessType: string;
  currency: string;
  domain: Exclude<OpsDomain, 'general'>;
  presetKey: string;
  presetLabel: string;
  founderDiagnosis: string;
  offerTitle: string;
  offerPrice: number;
  metricsSummary: Record<string, unknown>;
  recentNotes: string[];
  nodeKey?: string;
}): Promise<{
  planTitle: string;
  plan: OpsPlanContent;
  actions: OpsRoutedAction[];
}> {
  const sourceNodeKey = params.nodeKey?.trim() || 'm6-q2-operate';

  const systemPrompt = `
You are Urge, acting as a fundamentals-first startup copilot. The founder has already diagnosed their bottleneck in their own words. Now build a focused, low-cost, practical plan for their selected domain (${params.domain}) and preset use case (${params.presetLabel}).

Return ONLY valid JSON in this exact structure:
{
  "planTitle": "Short, concrete plan title",
  "plan": {
    "presetKey": "${params.presetKey}",
    "summary": "2-3 sentences validating or refining the founder's diagnosis and outlining the move.",
    "rationale": "1-2 sentences explaining why this fixes the root cause without throwing money at ads or bloat.",
    "suggestedCopyOrOffer": "Optional ready-to-send script, offer tweak, or check-in message.",
    "watchOutFor": "One common trap to avoid while executing this."
  },
  "actions": [
    {
      "id": "act_1",
      "title": "Concrete action title",
      "detail": "Specific instructions on how to execute it.",
      "route_to": "task" | "experiment",
      "hypothesis": "Required if route_to is experiment: what we expect to move in sales/traffic/retention.",
      "timeframe_days": 7,
      "status": "suggested"
    }
  ]
}

ROUTING RULES FOR "actions" (generate 2 to 4 items):
- Use "route_to": "task" when the action is a known fix or immediate execution (e.g. follow up with 12 warm leads, send 30-day value recap to 4 renewing buyers, audit unused software bills).
- Use "route_to": "experiment" ONLY when testing an uncertain hypothesis over 7–14 days (e.g. pitching a new adjacent customer segment, testing a bundle/annual offer, testing a referral ask script). Remember: experiment results will be read from their regular sales/traffic data—do not ask them to track duplicate spreadsheets.
`;

  const result = await invokeAIStandard({
    systemPrompt,
    userPrompt: JSON.stringify(params),
    componentKey: `ops_planner_${params.domain}`,
    sourceNodeKey,
    purpose: 'generate_domain_ops_plan',
    requireJson: true,
    temperature: 0.35,
  });

  if (!result.success || !result.content) {
    throw new Error(
      result.error || 'Could not generate your operating plan right now.',
    );
  }

  try {
    const parsed: unknown = JSON.parse(result.content);
    if (
      !isRecord(parsed) ||
      !isRecord(parsed.plan) ||
      !Array.isArray(parsed.actions)
    ) {
      throw new Error('Invalid domain planner JSON shape.');
    }

    const p = parsed.plan;
    const actions: OpsRoutedAction[] = parsed.actions
      .filter(isRecord)
      .slice(0, 4)
      .map((a, idx) => {
        const routeTo = a.route_to === 'experiment' ? 'experiment' : 'task';
        return {
          id: typeof a.id === 'string' && a.id ? a.id : `act_${idx + 1}`,
          title:
            typeof a.title === 'string' && a.title.trim()
              ? a.title.trim()
              : `Action ${idx + 1}`,
          detail: typeof a.detail === 'string' ? a.detail.trim() : undefined,
          route_to: routeTo,
          ...(routeTo === 'experiment'
            ? {
                hypothesis:
                  typeof a.hypothesis === 'string'
                    ? a.hypothesis.trim()
                    : typeof a.title === 'string'
                      ? a.title.trim()
                      : '',
                timeframe_days:
                  typeof a.timeframe_days === 'number' ? a.timeframe_days : 14,
              }
            : {}),
          status: 'suggested',
        };
      });

    return {
      planTitle:
        typeof parsed.planTitle === 'string' && parsed.planTitle.trim()
          ? parsed.planTitle.trim()
          : params.presetLabel,
      plan: {
        presetKey: params.presetKey,
        summary: typeof p.summary === 'string' ? p.summary.trim() : '',
        rationale: typeof p.rationale === 'string' ? p.rationale.trim() : '',
        suggestedCopyOrOffer:
          typeof p.suggestedCopyOrOffer === 'string' &&
          p.suggestedCopyOrOffer.trim()
            ? p.suggestedCopyOrOffer.trim()
            : undefined,
        watchOutFor:
          typeof p.watchOutFor === 'string' && p.watchOutFor.trim()
            ? p.watchOutFor.trim()
            : undefined,
      },
      actions,
    };
  } catch (err) {
    console.error('[MISSION 6 DOMAIN PLANNER]', err);
    throw new Error(
      'Could not interpret the generated operating plan. Please try again.',
    );
  }
}

export async function synthesizeOperatingWindow(params: {
  projectTitle: string;
  currency: string;
  horizon: string;
  goals: OpsGoalContent | null;
  metricsSummary: Record<string, unknown>;
  completedExperiments: Array<{
    title: string;
    worked?: string;
    howItWorked?: string;
  }>;
  crossroadsChoice: string;
  crossroadsReason: string;
  nodeKey?: string;
}): Promise<{
  headline: string;
  scorecardRead: string;
  provenPlaybook: string[];
  next30DayFocus: string;
}> {
  const sourceNodeKey = params.nodeKey?.trim() || 'm6-reveal';

  const systemPrompt = `
You are Urge, synthesizing a founder's 3-to-6-month operating window into an honest Operating Scorecard and Proven Playbook.

Return ONLY valid JSON in this exact structure:
{
  "headline": "1 crisp sentence summarizing what they proved over this operating window.",
  "scorecardRead": "2-3 sentences comparing their actual revenue, net profit, repeat rate, and hours against their quarterly targets.",
  "provenPlaybook": ["string"],
  "next30DayFocus": "2 sentences translating their chosen crossroads decision into an immediate 30-day priority."
}

RULES:
- Use exact numbers and currency symbol from the input.
- provenPlaybook: 2 to 4 concrete lessons or repeatable habits proven by their sales, traffic, and experiment reflections.
- Keep it grounded, direct, and free of corporate fluff.
`;

  const result = await invokeAIStandard({
    systemPrompt,
    userPrompt: JSON.stringify(params),
    componentKey: 'mission6_synthesis',
    sourceNodeKey,
    purpose: 'synthesize_operating_window',
    requireJson: true,
    temperature: 0.25,
  });

  if (!result.success || !result.content) {
    throw new Error(
      result.error || 'Could not generate your operating scorecard.',
    );
  }

  try {
    const parsed: unknown = JSON.parse(result.content);
    if (
      !isRecord(parsed) ||
      typeof parsed.headline !== 'string' ||
      typeof parsed.scorecardRead !== 'string'
    ) {
      throw new Error('Invalid synthesis JSON structure.');
    }

    const playbook = Array.isArray(parsed.provenPlaybook)
      ? parsed.provenPlaybook
          .filter((x): x is string => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 4)
      : [];

    return {
      headline: parsed.headline.trim(),
      scorecardRead: parsed.scorecardRead.trim(),
      provenPlaybook: playbook,
      next30DayFocus:
        typeof parsed.next30DayFocus === 'string'
          ? parsed.next30DayFocus.trim()
          : '',
    };
  } catch (err) {
    console.error('[MISSION 6 SYNTHESIS]', err);
    throw new Error(
      'Could not interpret the operating scorecard. Please try again.',
    );
  }
}