import type { Database } from '@/database.types';

export type MspBuildRequirement = {
  id: string;
  title: string;
  category:
    | 'product_req'
    | 'marketing_pipeline'
    | 'branding_trust'
    | 'payment_ops';
  done?: boolean;
};

export type AlphaAnalysisResult = {
  deliveryVerdict: 'ready_to_launch' | 'fix_bottlenecks_first';
  whatWorked: string;
  timeAndCostReality: string;
  mustFixBeforeLaunch: string[];
  ignoreForNow: string[];
};

export type LaunchSummary = {
  launchedAt: string;
  fixesCompleted: string[];
  launchInquiries: number;
  launchCustomers: number;
  launchRevenue: number;
  launchNotes?: string;
};

export type UserProjectBuildStatus =
  | 'planning'
  | 'building'
  | 'alpha_testing'
  | 'launched'
  | 'archived';

export type BuildTrackingSummary = {
  actualSpend?: number;
  actualHours?: number;
  notes?: string;
};

export type UserProjectBuild = {
  id: string;
  user_id: string;
  project_id: string;
  offer_id: string | null;
  version_number: number;
  version_label: string;
  title: string;
  status: UserProjectBuildStatus;
  requirements: MspBuildRequirement[];
  tracking: BuildTrackingSummary;
  alpha_summary: Partial<AlphaAnalysisResult>;
  launch_summary: Partial<LaunchSummary>;
  build_completed_at: string | null;
  launched_at: string | null;
  created_at: string;
  updated_at: string;
};

type UserProjectBuildRow =
  Database['public']['Tables']['user_project_builds']['Row'];

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function mapUserProjectBuildRow(
  row: UserProjectBuildRow,
): UserProjectBuild {
  return {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    offer_id: row.offer_id,
    version_number: row.version_number,
    version_label: row.version_label,
    title: row.title,
    status: row.status as UserProjectBuildStatus,
    requirements: asArray<MspBuildRequirement>(row.requirements),
    tracking: asRecord(row.tracking) as BuildTrackingSummary,
    alpha_summary: asRecord(row.alpha_summary) as Partial<AlphaAnalysisResult>,
    launch_summary: asRecord(row.launch_summary) as Partial<LaunchSummary>,
    build_completed_at: row.build_completed_at,
    launched_at: row.launched_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}