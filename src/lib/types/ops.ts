import type { Database } from '@/database.types';

export type OpsDomain = 'general' | 'market' | 'money' | 'customer';

export type OpsRecordType = 'goal' | 'analysis' | 'plan';

export type OpsHorizon = '3_months' | '6_months';

export type OpsStatus = 'active' | 'completed' | 'archived';

export type OpsGoalContent = {
  monthlyRevenueTarget: number;
  activeCustomersTarget: number;
  repeatRateTargetPercent: number;
  maxWeeklyHours: number;
  q1Focus: string;
  q2Focus?: string;
};

export type OpsAnalysisGap = {
  id: string;
  domain: Exclude<OpsDomain, 'general'>;
  headline: string;
  evidence: string;
  diagnosisPrompt: string;
};

export type OpsAnalysisContent = {
  summary: string;
  gaps: OpsAnalysisGap[];
  generatedAt: string;
};

export type OpsPlanContent = {
  presetKey: string;
  summary: string;
  rationale: string;
  suggestedCopyOrOffer?: string;
  watchOutFor?: string;
};

export type OpsRoutedAction = {
  id: string;
  title: string;
  detail?: string;
  route_to: 'task' | 'experiment';
  hypothesis?: string;
  timeframe_days?: number;
  task_id?: string | null;
  experiment_id?: string | null;
  status: 'suggested' | 'queued' | 'done';
};

export type UserOp = {
  id: string;
  user_id: string;
  project_id: string;
  build_id: string | null;
  domain: OpsDomain;
  record_type: OpsRecordType;
  horizon: OpsHorizon | null;
  title: string;
  founder_diagnosis: string | null;
  content: Record<string, unknown>;
  actions: OpsRoutedAction[];
  status: OpsStatus;
  created_at: string;
  updated_at: string;
};

export type OpsSalesSource =
  | 'manual'
  | 'csv'
  | 'shopify'
  | 'razorpay'
  | 'stripe';

export type UserOpsSale = {
  id: string;
  user_id: string;
  project_id: string;
  order_date: string;
  external_order_id: string | null;
  customer_name: string | null;
  customer_segment: string | null;
  acquisition_channel: string | null;
  gross_amount: number;
  refund_amount: number;
  direct_cost: number;
  hours_spent: number;
  outcome_delivered: boolean;
  is_repeat: boolean;
  source: OpsSalesSource;
  notes: string | null;
  created_at: string;
};

export type OpsTrafficChannelType =
  | 'website'
  | 'store_footfall'
  | 'social'
  | 'paid_campaign'
  | 'direct_outreach';

export type OpsTrafficSource =
  | 'manual'
  | 'csv'
  | 'google_analytics'
  | 'meta'
  | 'shopify';

export type UserOpsTraffic = {
  id: string;
  user_id: string;
  project_id: string;
  period_start: string;
  period_end: string | null;
  channel_type: OpsTrafficChannelType;
  channel_name: string;
  campaign_name: string | null;
  impressions_or_footfall: number;
  visits_or_engagements: number;
  inquiries_or_leads: number;
  spend: number;
  source: OpsTrafficSource;
  created_at: string;
};

export type OpsExpenseCategory =
  | 'fixed'
  | 'variable'
  | 'marketing'
  | 'tools'
  | 'other';

export type UserOpsExpense = {
  id: string;
  user_id: string;
  project_id: string;
  expense_date: string;
  category: OpsExpenseCategory;
  item: string;
  amount: number;
  source: 'manual' | 'csv';
  created_at: string;
};

export type ProjectOpsBundle = {
  ops: UserOp[];
  sales: UserOpsSale[];
  traffic: UserOpsTraffic[];
  expenses: UserOpsExpense[];
};

type UserOpRow = Database['public']['Tables']['user_ops']['Row'];
type UserOpsSaleRow = Database['public']['Tables']['user_ops_sales']['Row'];
type UserOpsTrafficRow =
  Database['public']['Tables']['user_ops_traffic']['Row'];
type UserOpsExpenseRow =
  Database['public']['Tables']['user_ops_expenses']['Row'];

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function mapUserOpRow(row: UserOpRow): UserOp {
  return {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    build_id: row.build_id,
    domain: row.domain as OpsDomain,
    record_type: row.record_type as OpsRecordType,
    horizon: (row.horizon as OpsHorizon | null) ?? null,
    title: row.title,
    founder_diagnosis: row.founder_diagnosis,
    content: asRecord(row.content),
    actions: asArray<OpsRoutedAction>(row.actions),
    status: row.status as OpsStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapUserOpsSaleRow(row: UserOpsSaleRow): UserOpsSale {
  return {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    order_date: row.order_date,
    external_order_id: row.external_order_id,
    customer_name: row.customer_name,
    customer_segment: row.customer_segment,
    acquisition_channel: row.acquisition_channel,
    gross_amount: Number(row.gross_amount ?? 0),
    refund_amount: Number(row.refund_amount ?? 0),
    direct_cost: Number(row.direct_cost ?? 0),
    hours_spent: Number(row.hours_spent ?? 0),
    outcome_delivered: Boolean(row.outcome_delivered),
    is_repeat: Boolean(row.is_repeat),
    source: row.source as OpsSalesSource,
    notes: row.notes,
    created_at: row.created_at,
  };
}

export function mapUserOpsTrafficRow(row: UserOpsTrafficRow): UserOpsTraffic {
  return {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    period_start: row.period_start,
    period_end: row.period_end,
    channel_type: row.channel_type as OpsTrafficChannelType,
    channel_name: row.channel_name,
    campaign_name: row.campaign_name,
    impressions_or_footfall: Number(row.impressions_or_footfall ?? 0),
    visits_or_engagements: Number(row.visits_or_engagements ?? 0),
    inquiries_or_leads: Number(row.inquiries_or_leads ?? 0),
    spend: Number(row.spend ?? 0),
    source: row.source as OpsTrafficSource,
    created_at: row.created_at,
  };
}

export function mapUserOpsExpenseRow(row: UserOpsExpenseRow): UserOpsExpense {
  return {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    expense_date: row.expense_date,
    category: row.category as OpsExpenseCategory,
    item: row.item,
    amount: Number(row.amount ?? 0),
    source: row.source as 'manual' | 'csv',
    created_at: row.created_at,
  };
}