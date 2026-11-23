import type { Database } from '@/database.types';

export type BusinessType =
  | 'saas_digital'
  | 'local_service'
  | 'online_shop'
  | 'side_hustle';

export type PaymentModel =
  | 'upfront'
  | 'deposit_balance'
  | 'subscription'
  | 'pay_on_delivery';

export type ObservedUserProfileInput = {
  id: string;
  label: string;
  situation: string;
  painExperienced: string;
  currentWorkaround: string;
  desiredOutcome: string;
};

export type ExtractedCustomerPersona = {
  id: string;
  name: string;
  summary: string;
  corePain: string;
  desiredGain: string;
  currentAlternative: string;
  triggerMoment: string;
};

export type MspFeatureItem = {
  id: string;
  label: string;
  bucket: 'must_have' | 'cut_for_later';
  reason?: string;
};

export type EconomicsLineItem = {
  category: string;
  item: string;
  amount: number;
  notes?: string;
};

export type ProjectEconomics = {
  businessType: BusinessType;
  currency: string;
  pricePerUnit: number;
  directCostPerUnit: number;
  monthlyFixedCosts: number;
  hoursPerUnit: number;
  targetMonthlyIncome: number;
  marginPerUnit: number;
  breakEvenUnitsPerMonth: number;
  unitsForIncomeGoal: number;
  lineItems: EconomicsLineItem[];
  uncertainNotes?: string;
  paymentModel?: PaymentModel;
  uploadedAt?: string;
};

export type MspBuildRequirement = {
  id: string;
  title: string;
  category: 'offer_delivery' | 'acquisition' | 'payment_ops';
  done?: boolean;
};

export type UserProjectMetadata = {
  status?: string;
  businessType?: BusinessType;
  forward_question?: string | null;
  forwardQuestion?: string;
  opportunity_snapshot?: {
    problem?: string;
    problem_details?: unknown;
    approach?: Record<string, unknown> | null;
    feasibility?: Record<string, unknown> | null;
  };
  observedProfiles?: ObservedUserProfileInput[];
  personas?: ExtractedCustomerPersona[];
  features?: MspFeatureItem[];
  painsRemoved?: string[];
  gainsCreated?: string[];
  economics?: ProjectEconomics;
  acquisitionChannel?: {
    channel: string;
    whyItFits: string;
    outreachMessage: string;
  };
  mspRequirements?: MspBuildRequirement[];
  businessPlanGeneratedAt?: string;
  [key: string]: unknown;
};

export type UserProjectOfferMetadata = {
  pains_removed?: string[];
  gains_created?: string[];
  must_have_features?: string[];
  cut_features?: string[];
  included_summary?: string;
  excluded_summary?: string;
  price_point?: number;
  currency?: string;
  payment_model?: PaymentModel;
  [key: string]: unknown;
};

export type UserProject = {
  id: string;
  user_id: string;
  opportunity_id: string | null;
  title: string;
  description: string | null;
  selected_offer_id: string | null;
  metadata: UserProjectMetadata;
  created_at: string;
  updated_at: string;
};

export type UserProjectOffer = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  promise: string | null;
  hook: string | null;
  ask: string | null;
  metadata: UserProjectOfferMetadata;
  created_at: string;
  updated_at: string;
};

export type Mission4ContextSummary = {
  project: UserProject | null;
  selectedOffer: UserProjectOffer | null;
  offers: UserProjectOffer[];
  m3ProblemStatement: string;
  m3PlanAroundNote: string;
  m3SignalStrength: string;
  m3WarmLeads: Array<{
    id: string;
    name: string;
    contact: string;
    action_taken: string;
  }>;
  m3Quotes: string[];
  m1Constraints: {
    weeklyHours?: string;
    budgetCap?: string;
    incomeGoal?: string;
  };
};

type UserProjectRow = Database['public']['Tables']['user_projects']['Row'];
type UserProjectOfferRow =
  Database['public']['Tables']['user_project_offers']['Row'];

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function mapUserProjectRow(row: UserProjectRow): UserProject {
  return {
    id: row.id,
    user_id: row.user_id,
    opportunity_id: row.opportunity_id,
    title: row.title,
    description: row.description,
    selected_offer_id: row.selected_offer_id,
    metadata: asRecord(row.metadata) as UserProjectMetadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapUserProjectOfferRow(
  row: UserProjectOfferRow,
): UserProjectOffer {
  return {
    id: row.id,
    project_id: row.project_id,
    title: row.title,
    description: row.description,
    promise: row.promise,
    hook: row.hook,
    ask: row.ask,
    metadata: asRecord(row.metadata) as UserProjectOfferMetadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}