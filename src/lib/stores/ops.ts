import { computed, map } from 'nanostores';
import { $activeProject } from '@/lib/stores/projects';
import type {
  OpsGoalContent,
  ProjectOpsBundle,
  UserOp,
  UserOpsExpense,
  UserOpsSale,
  UserOpsTraffic,
} from '@/lib/types/ops';

export type ProjectOpsState = {
  ops: UserOp[];
  sales: UserOpsSale[];
  traffic: UserOpsTraffic[];
  expenses: UserOpsExpense[];
  hydrated: boolean;
};

export const $projectOps = map<ProjectOpsState>({
  ops: [],
  sales: [],
  traffic: [],
  expenses: [],
  hydrated: false,
});

export const opsActions = {
  hydrate(bundle: ProjectOpsBundle) {
    $projectOps.set({
      ops: bundle.ops,
      sales: bundle.sales,
      traffic: bundle.traffic,
      expenses: bundle.expenses,
      hydrated: true,
    });
  },

  upsertOp(item: UserOp) {
    const current = $projectOps.get();
    const exists = current.ops.some((o) => o.id === item.id);
    $projectOps.set({
      ...current,
      ops: exists
        ? current.ops.map((o) => (o.id === item.id ? item : o))
        : [item, ...current.ops],
      hydrated: true,
    });
  },

  prependSales(items: UserOpsSale[]) {
    if (items.length === 0) return;
    const current = $projectOps.get();
    $projectOps.set({
      ...current,
      sales: [...items, ...current.sales],
      hydrated: true,
    });
  },

  prependTraffic(items: UserOpsTraffic[]) {
    if (items.length === 0) return;
    const current = $projectOps.get();
    $projectOps.set({
      ...current,
      traffic: [...items, ...current.traffic],
      hydrated: true,
    });
  },

  prependExpenses(items: UserOpsExpense[]) {
    if (items.length === 0) return;
    const current = $projectOps.get();
    $projectOps.set({
      ...current,
      expenses: [...items, ...current.expenses],
      hydrated: true,
    });
  },
};

export const $activeProjectOps = computed(
  [$activeProject, $projectOps],
  (project, state) => {
    if (!project) {
      return {
        ops: [] as UserOp[],
        sales: [] as UserOpsSale[],
        traffic: [] as UserOpsTraffic[],
        expenses: [] as UserOpsExpense[],
        activeGoal: null as UserOp | null,
        goalContent: null as OpsGoalContent | null,
      };
    }

    const ops = state.ops.filter((o) => o.project_id === project.id);
    const sales = state.sales.filter((s) => s.project_id === project.id);
    const traffic = state.traffic.filter((t) => t.project_id === project.id);
    const expenses = state.expenses.filter((e) => e.project_id === project.id);

    const activeGoal =
      ops.find((o) => o.record_type === 'goal' && o.status === 'active') ??
      ops.find((o) => o.record_type === 'goal') ??
      null;

    const goalContent = activeGoal
      ? (activeGoal.content as unknown as OpsGoalContent)
      : null;

    return {
      ops,
      sales,
      traffic,
      expenses,
      activeGoal,
      goalContent,
    };
  },
);

export const $opsMetricsSummary = computed($activeProjectOps, (bundle) => {
  const { sales, traffic, expenses } = bundle;

  const grossRevenue = sales.reduce((s, r) => s + r.gross_amount, 0);
  const refunds = sales.reduce((s, r) => s + r.refund_amount, 0);
  const netRevenue = grossRevenue - refunds;
  const directCosts = sales.reduce((s, r) => s + r.direct_cost, 0);
  const adSpend = traffic.reduce((s, r) => s + r.spend, 0);
  const operatingExpenses = expenses.reduce((s, r) => s + r.amount, 0);
  const netProfit = netRevenue - directCosts - adSpend - operatingExpenses;

  const totalOrders = sales.length;
  const repeatOrders = sales.filter((s) => s.is_repeat).length;
  const repeatRatePercent =
    totalOrders > 0 ? Math.round((repeatOrders / totalOrders) * 100) : 0;

  const outcomesDeliveredCount = sales.filter(
    (s) => s.outcome_delivered,
  ).length;
  const outcomeRatePercent =
    totalOrders > 0
      ? Math.round((outcomesDeliveredCount / totalOrders) * 100)
      : 100;

  const totalHoursSpent = sales.reduce((s, r) => s + r.hours_spent, 0);
  const avgHoursPerOrder =
    totalOrders > 0 ? Number((totalHoursSpent / totalOrders).toFixed(1)) : 0;

  const totalInquiries = traffic.reduce(
    (s, r) => s + r.inquiries_or_leads,
    0,
  );
  const inquiryToSalePercent =
    totalInquiries > 0 ? Math.round((totalOrders / totalInquiries) * 100) : 0;
  const actualCac =
    totalOrders > 0 ? Math.round(adSpend / totalOrders) : 0;

  return {
    grossRevenue,
    refunds,
    netRevenue,
    directCosts,
    adSpend,
    operatingExpenses,
    netProfit,
    totalOrders,
    repeatOrders,
    repeatRatePercent,
    outcomeRatePercent,
    totalHoursSpent,
    avgHoursPerOrder,
    totalInquiries,
    inquiryToSalePercent,
    actualCac,
  };
});