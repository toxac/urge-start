'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Json } from '@/database.types';
import {
  mapUserOpRow,
  mapUserOpsExpenseRow,
  mapUserOpsSaleRow,
  mapUserOpsTrafficRow,
  type OpsDomain,
  type OpsExpenseCategory,
  type OpsGoalContent,
  type OpsHorizon,
  type OpsRecordType,
  type OpsRoutedAction,
  type OpsSalesSource,
  type OpsStatus,
  type OpsTrafficChannelType,
  type OpsTrafficSource,
  type ProjectOpsBundle,
  type UserOp,
  type UserOpsExpense,
  type UserOpsSale,
  type UserOpsTraffic,
} from '@/lib/types/ops';
import { mapUserExperimentRow, type UserExperiment } from '@/lib/types/experiments';

const OPS_HYPOTHESIS_KEY = 'ops_hypothesis_test';

export async function fetchProjectOpsBundle(
  projectId?: string,
): Promise<ProjectOpsBundle> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  let opsQuery = supabase
    .from('user_ops')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  let salesQuery = supabase
    .from('user_ops_sales')
    .select('*')
    .eq('user_id', user.id)
    .order('order_date', { ascending: false })
    .limit(500);

  let trafficQuery = supabase
    .from('user_ops_traffic')
    .select('*')
    .eq('user_id', user.id)
    .order('period_start', { ascending: false })
    .limit(500);

  let expensesQuery = supabase
    .from('user_ops_expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('expense_date', { ascending: false })
    .limit(500);

  if (projectId) {
    opsQuery = opsQuery.eq('project_id', projectId);
    salesQuery = salesQuery.eq('project_id', projectId);
    trafficQuery = trafficQuery.eq('project_id', projectId);
    expensesQuery = expensesQuery.eq('project_id', projectId);
  }

  const [opsRes, salesRes, trafficRes, expensesRes] = await Promise.all([
    opsQuery,
    salesQuery,
    trafficQuery,
    expensesQuery,
  ]);

  if (opsRes.error) {
    throw new Error(`Failed to fetch user_ops: ${opsRes.error.message}`);
  }
  if (salesRes.error) {
    throw new Error(`Failed to fetch user_ops_sales: ${salesRes.error.message}`);
  }
  if (trafficRes.error) {
    throw new Error(
      `Failed to fetch user_ops_traffic: ${trafficRes.error.message}`,
    );
  }
  if (expensesRes.error) {
    throw new Error(
      `Failed to fetch user_ops_expenses: ${expensesRes.error.message}`,
    );
  }

  return {
    ops: (opsRes.data ?? []).map(mapUserOpRow),
    sales: (salesRes.data ?? []).map(mapUserOpsSaleRow),
    traffic: (trafficRes.data ?? []).map(mapUserOpsTrafficRow),
    expenses: (expensesRes.data ?? []).map(mapUserOpsExpenseRow),
  };
}

export async function saveOpsGoals(params: {
  projectId: string;
  buildId?: string | null;
  horizon: OpsHorizon;
  goals: OpsGoalContent;
}): Promise<UserOp> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Archive any prior active goal record for this project
  await supabase
    .from('user_ops')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('project_id', params.projectId)
    .eq('record_type', 'goal')
    .eq('status', 'active');

  const { data, error } = await supabase
    .from('user_ops')
    .insert({
      user_id: user.id,
      project_id: params.projectId,
      build_id: params.buildId ?? null,
      domain: 'general',
      record_type: 'goal',
      horizon: params.horizon,
      title:
        params.horizon === '6_months'
          ? '6-Month Operating Targets'
          : '3-Month Operating Targets',
      content: params.goals as unknown as Json,
      actions: [] as unknown as Json,
      status: 'active',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to save operating goals: ${error.message}`);
  }

  return mapUserOpRow(data);
}

export async function createUserOpRecord(params: {
  projectId: string;
  buildId?: string | null;
  domain: OpsDomain;
  recordType: OpsRecordType;
  horizon?: OpsHorizon | null;
  title: string;
  founderDiagnosis?: string | null;
  content: Record<string, unknown>;
  actions?: OpsRoutedAction[];
  status?: OpsStatus;
}): Promise<UserOp> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('user_ops')
    .insert({
      user_id: user.id,
      project_id: params.projectId,
      build_id: params.buildId ?? null,
      domain: params.domain,
      record_type: params.recordType,
      horizon: params.horizon ?? null,
      title: params.title.trim(),
      founder_diagnosis: params.founderDiagnosis?.trim() || null,
      content: params.content as unknown as Json,
      actions: (params.actions ?? []) as unknown as Json,
      status: params.status ?? 'active',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to save ops record: ${error.message}`);
  }

  return mapUserOpRow(data);
}

/**
 * Routes a recommended action from a user_ops plan either into `user_tasks`
 * (for routine execution) or `user_experiments` using the generic `ops_hypothesis_test`
 * blueprint (for uncertain bets), then updates the action's status on `user_ops`.
 */
export async function routeOpsPlanAction(params: {
  opId: string;
  projectId: string;
  actionId: string;
  sourceNodeKey?: string;
}): Promise<{
  op: UserOp;
  createdTaskId?: string;
  createdExperiment?: UserExperiment;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: opRow, error: fetchErr } = await supabase
    .from('user_ops')
    .select('*')
    .eq('id', params.opId)
    .eq('user_id', user.id)
    .single();

  if (fetchErr || !opRow) {
    throw new Error('Operating plan not found.');
  }

  const op = mapUserOpRow(opRow);
  const targetAction = op.actions.find((a) => a.id === params.actionId);
  if (!targetAction) {
    throw new Error('Action item not found on plan.');
  }

  let createdTaskId: string | undefined;
  let createdExperiment: UserExperiment | undefined;

  if (targetAction.route_to === 'task') {
    const { data: taskRow, error: taskErr } = await supabase
      .from('user_tasks')
      .insert({
        user_id: user.id,
        title: targetAction.title,
        description:
          targetAction.detail ||
          `Operating action (${op.domain.toUpperCase()}): ${op.title}`,
        task_type: 'practice',
        source_node_key: params.sourceNodeKey ?? 'm6-q2-operate',
        status: 'pending',
      })
      .select('id')
      .single();

    if (taskErr) {
      throw new Error(`Failed to create task: ${taskErr.message}`);
    }
    createdTaskId = taskRow.id;
  } else {
    const { data: bp } = await supabase
      .from('experiments')
      .select('id')
      .eq('key', OPS_HYPOTHESIS_KEY)
      .maybeSingle();

    const { data: expRow, error: expErr } = await supabase
      .from('user_experiments')
      .insert({
        user_id: user.id,
        experiment_id: bp?.id ?? null,
        experiment_key: OPS_HYPOTHESIS_KEY,
        project_id: params.projectId,
        mission_key: 'mission-6',
        source_node_key: params.sourceNodeKey ?? 'm6-q2-operate',
        title: targetAction.title,
        setup: {
          pitch: {
            direction: targetAction.hypothesis || targetAction.title,
            pain: op.founder_diagnosis || '',
          },
          notes: `Domain: ${op.domain} · Plan ID: ${op.id}`,
        } as unknown as Json,
        threshold: {
          timeframe_days: targetAction.timeframe_days ?? 14,
        } as unknown as Json,
        status: 'live',
        started_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (expErr) {
      throw new Error(`Failed to start hypothesis test: ${expErr.message}`);
    }
    createdExperiment = mapUserExperimentRow(expRow);
  }

  const nextActions: OpsRoutedAction[] = op.actions.map((a) =>
    a.id === params.actionId
      ? {
          ...a,
          status: 'queued',
          ...(createdTaskId ? { task_id: createdTaskId } : {}),
          ...(createdExperiment
            ? { experiment_id: createdExperiment.id }
            : {}),
        }
      : a,
  );

  const { data: updatedOpRow, error: updateErr } = await supabase
    .from('user_ops')
    .update({
      actions: nextActions as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', op.id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateErr) {
    throw new Error(`Failed to update plan actions: ${updateErr.message}`);
  }

  return {
    op: mapUserOpRow(updatedOpRow),
    createdTaskId,
    createdExperiment,
  };
}

export async function ingestOpsSales(
  projectId: string,
  rows: Array<{
    order_date: string;
    external_order_id?: string | null;
    customer_name?: string | null;
    customer_segment?: string | null;
    acquisition_channel?: string | null;
    gross_amount: number;
    refund_amount?: number;
    direct_cost?: number;
    hours_spent?: number;
    outcome_delivered?: boolean;
    is_repeat?: boolean;
    source?: OpsSalesSource;
    notes?: string | null;
  }>,
): Promise<UserOpsSale[]> {
  if (rows.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const payload = rows.map((r) => ({
    user_id: user.id,
    project_id: projectId,
    order_date: r.order_date,
    external_order_id: r.external_order_id?.trim() || null,
    customer_name: r.customer_name?.trim() || null,
    customer_segment: r.customer_segment?.trim() || null,
    acquisition_channel: r.acquisition_channel?.trim() || null,
    gross_amount: Number(r.gross_amount) || 0,
    refund_amount: Number(r.refund_amount) || 0,
    direct_cost: Number(r.direct_cost) || 0,
    hours_spent: Number(r.hours_spent) || 0,
    outcome_delivered: r.outcome_delivered ?? true,
    is_repeat: Boolean(r.is_repeat),
    source: r.source ?? 'manual',
    notes: r.notes?.trim() || null,
  }));

  const { data, error } = await supabase
    .from('user_ops_sales')
    .insert(payload)
    .select('*');

  if (error) {
    throw new Error(`Failed to save sales records: ${error.message}`);
  }

  return (data ?? []).map(mapUserOpsSaleRow);
}

export async function ingestOpsTraffic(
  projectId: string,
  rows: Array<{
    period_start: string;
    period_end?: string | null;
    channel_type: OpsTrafficChannelType;
    channel_name: string;
    campaign_name?: string | null;
    impressions_or_footfall?: number;
    visits_or_engagements?: number;
    inquiries_or_leads?: number;
    spend?: number;
    source?: OpsTrafficSource;
  }>,
): Promise<UserOpsTraffic[]> {
  if (rows.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const payload = rows.map((r) => ({
    user_id: user.id,
    project_id: projectId,
    period_start: r.period_start,
    period_end: r.period_end || null,
    channel_type: r.channel_type,
    channel_name: r.channel_name.trim(),
    campaign_name: r.campaign_name?.trim() || null,
    impressions_or_footfall: Math.max(
      0,
      Math.round(Number(r.impressions_or_footfall) || 0),
    ),
    visits_or_engagements: Math.max(
      0,
      Math.round(Number(r.visits_or_engagements) || 0),
    ),
    inquiries_or_leads: Math.max(
      0,
      Math.round(Number(r.inquiries_or_leads) || 0),
    ),
    spend: Number(r.spend) || 0,
    source: r.source ?? 'manual',
  }));

  const { data, error } = await supabase
    .from('user_ops_traffic')
    .insert(payload)
    .select('*');

  if (error) {
    throw new Error(`Failed to save traffic & campaign data: ${error.message}`);
  }

  return (data ?? []).map(mapUserOpsTrafficRow);
}

export async function ingestOpsExpenses(
  projectId: string,
  rows: Array<{
    expense_date: string;
    category: OpsExpenseCategory;
    item: string;
    amount: number;
    source?: 'manual' | 'csv';
  }>,
): Promise<UserOpsExpense[]> {
  if (rows.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const payload = rows.map((r) => ({
    user_id: user.id,
    project_id: projectId,
    expense_date: r.expense_date,
    category: r.category,
    item: r.item.trim(),
    amount: Number(r.amount) || 0,
    source: r.source ?? 'manual',
  }));

  const { data, error } = await supabase
    .from('user_ops_expenses')
    .insert(payload)
    .select('*');

  if (error) {
    throw new Error(`Failed to save operating expenses: ${error.message}`);
  }

  return (data ?? []).map(mapUserOpsExpenseRow);
}