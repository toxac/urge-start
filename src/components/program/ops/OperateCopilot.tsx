'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Compass,
  DollarSign,
  FlaskConical,
  HeartHandshake,
  Loader2,
  Megaphone,
  RefreshCw,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import {
  $activeBuild,
  $activeProject,
  $selectedOffer,
} from '@/lib/stores/projects';
import {
  $activeProjectOps,
  $opsMetricsSummary,
  opsActions,
} from '@/lib/stores/ops';
import {
  $userExperiments,
  userExperimentsActions,
} from '@/lib/stores/experiments';
import {
  createUserOpRecord,
  fetchOpsTasks,
  routeOpsPlanAction,
  updateOpsTaskStatus,
  
} from '@/actions/ops';
import {
  analyzeOperatingGaps,
  generateDomainOpsPlan,
} from '@/actions/responses/mission6';
import { saveUserExperimentReflection } from '@/actions/experiments';
import { OpsDataIngestModal } from './OpsDataIngestModal';
import type {
  OpsAnalysisContent,
  OpsAnalysisGap,
  OpsDomain,
  UserOp,
  OpsTaskSummary,
} from '@/lib/types/ops';
import type { UserExperiment } from '@/lib/types/experiments';

type PlannerDomain = Exclude<OpsDomain, 'general'>;

const DOMAIN_PRESETS: Record<
  PlannerDomain,
  {
    label: string;
    subtitle: string;
    presets: Array<{ key: string; label: string; promptHint: string }>;
  }
> = {
  market: {
    label: 'Market Planner',
    subtitle: 'Acquisition, campaigns, segments & offer positioning',
    presets: [
      {
        key: 'convert_open_leads',
        label: 'Convert stalled inquiries',
        promptHint: 'Why are warm leads hesitating before paying?',
      },
      {
        key: 'weekly_campaign_sprint',
        label: 'Run a ₹0 / low-cost weekly campaign',
        promptHint: 'Which proven channel has been under-worked this week?',
      },
      {
        key: 'test_customer_segment',
        label: 'Test an adjacent customer group',
        promptHint: 'Which customer type closed fastest or got best results?',
      },
      {
        key: 'sharpen_offer_hook',
        label: 'Sharpen offer & positioning',
        promptHint: 'What objection comes up most in buyer replies?',
      },
    ],
  },
  money: {
    label: 'Money Planner',
    subtitle: 'Margins, delivery time drift, pricing & cash flow',
    presets: [
      {
        key: 'cut_delivery_hours',
        label: 'Fix delivery time creep',
        promptHint: 'Which repetitive delivery step is eating extra hours?',
      },
      {
        key: 'trim_overhead',
        label: 'Minimize recurring costs',
        promptHint: 'Which tool or variable cost is not paying for itself?',
      },
      {
        key: 'upsell_or_pricing',
        label: 'Increase revenue per buyer',
        promptHint: 'What add-on, bundle, or upfront term would buyers value?',
      },
    ],
  },
  customer: {
    label: 'Customer Planner',
    subtitle: 'Value delivery, engagement, renewals & referrals',
    presets: [
      {
        key: 'rescue_quiet_buyers',
        label: 'Re-engage quiet buyers before churn',
        promptHint: 'What stops buyers from using or completing v1 in week 2?',
      },
      {
        key: 'earn_renewals',
        label: 'Prepare 30-day value recap & renewal',
        promptHint: 'What measurable outcome did active buyers get this month?',
      },
      {
        key: 'peak_value_referrals',
        label: 'Ask happy buyers for proof & intros',
        promptHint: 'Which buyer had a clear win this week?',
      },
    ],
  },
};

export function OperateCopilot() {
  const router = useRouter();
  const project = useStore($activeProject);
  const offer = useStore($selectedOffer);
  const activeBuild = useStore($activeBuild);
  const opsBundle = useStore($activeProjectOps);
  const metrics = useStore($opsMetricsSummary);
  const userExpsState = useStore($userExperiments);

  const [ingestOpen, setIngestOpen] = useState(false);
  const [tasks, setTasks] = useState<OpsTaskSummary[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Gap Analysis state
  const [analyzingGaps, setAnalyzingGaps] = useState(false);
  const [selectedGap, setSelectedGap] = useState<OpsAnalysisGap | null>(null);

  // Planner state (Founder Diagnosis -> Preset Plan -> Action Routing)
  const [plannerDomain, setPlannerDomain] = useState<PlannerDomain>('market');
  const [presetKey, setPresetKey] = useState<string>(
    DOMAIN_PRESETS.market.presets[0].key,
  );
  const [founderDiagnosis, setFounderDiagnosis] = useState('');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [routingActionId, setRoutingActionId] = useState<string | null>(null);

  // Reflection state for active ops_hypothesis_test experiments
  const [reflectingExpId, setReflectingExpId] = useState<string | null>(null);
  const [workedChoice, setWorkedChoice] = useState<'yes' | 'partially' | 'no'>(
    'yes',
  );
  const [howItWorked, setHowItWorked] = useState('');
  const [nextMove, setNextMove] = useState('');
  const [savingReflection, setSavingReflection] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchOpsTasks()
      .then((list) => {
        if (alive) {
          setTasks(list);
          setLoadingTasks(false);
        }
      })
      .catch(() => {
        if (alive) setLoadingTasks(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const econ = project?.metadata?.economics;
  const currency = offer?.metadata?.currency ?? econ?.currency ?? '₹';
  const goals = opsBundle.goalContent;

  const latestAnalysisOp = useMemo(
    () => opsBundle.ops.find((o) => o.record_type === 'analysis') ?? null,
    [opsBundle.ops],
  );
  const analysisContent = latestAnalysisOp
    ? (latestAnalysisOp.content as unknown as OpsAnalysisContent)
    : null;

  const recentPlans = useMemo(
    () => opsBundle.ops.filter((o) => o.record_type === 'plan').slice(0, 5),
    [opsBundle.ops],
  );

  const opsExperiments: UserExperiment[] = useMemo(() => {
    return userExpsState.allIds
      .map((id) => userExpsState.byId[id])
      .filter(
        (e): e is UserExperiment =>
          Boolean(e) && e.experiment_key === 'ops_hypothesis_test',
      );
  }, [userExpsState]);

  function handleSelectDomain(domain: PlannerDomain) {
    setPlannerDomain(domain);
    setPresetKey(DOMAIN_PRESETS[domain].presets[0].key);
    setError(null);
  }

  function handleDiagnoseGap(gap: OpsAnalysisGap) {
    setSelectedGap(gap);
    handleSelectDomain(gap.domain);
    setFounderDiagnosis('');
  }

  async function handleRunGapAnalysis() {
    if (!project || analyzingGaps) return;
    setAnalyzingGaps(true);
    setError(null);

    try {
      const channelMap = new Map<
        string,
        { channel: string; inquiries: number; orders: number; spend: number }
      >();
      for (const t of opsBundle.traffic) {
        const curr = channelMap.get(t.channel_name) ?? {
          channel: t.channel_name,
          inquiries: 0,
          orders: 0,
          spend: 0,
        };
        curr.inquiries += t.inquiries_or_leads;
        curr.spend += t.spend;
        channelMap.set(t.channel_name, curr);
      }
      for (const s of opsBundle.sales) {
        const ch = s.acquisition_channel || 'Direct';
        const curr = channelMap.get(ch) ?? {
          channel: ch,
          inquiries: 0,
          orders: 0,
          spend: 0,
        };
        curr.orders += 1;
        channelMap.set(ch, curr);
      }

      const result = await analyzeOperatingGaps({
        projectTitle: project.title,
        businessType: project.metadata?.businessType ?? 'side_hustle',
        currency,
        goals,
        m4Economics: {
          pricePerUnit: econ?.pricePerUnit ?? 0,
          directCostPerUnit: econ?.directCostPerUnit ?? 0,
          monthlyFixedCosts: econ?.monthlyFixedCosts ?? 0,
          hoursPerUnit: econ?.hoursPerUnit ?? 0,
          availableWeeklyHours: econ?.availableWeeklyHours ?? 10,
        },
        metricsSummary: {
          netRevenue: metrics.netRevenue,
          netProfit: metrics.netProfit,
          totalOrders: metrics.totalOrders,
          repeatRatePercent: metrics.repeatRatePercent,
          outcomeRatePercent: metrics.outcomeRatePercent,
          avgHoursPerOrder: metrics.avgHoursPerOrder,
          totalInquiries: metrics.totalInquiries,
          inquiryToSalePercent: metrics.inquiryToSalePercent,
          actualCac: metrics.actualCac,
        },
        recentSalesNotes: opsBundle.sales
          .map((s) => s.notes)
          .filter((n): n is string => Boolean(n))
          .slice(0, 8),
        topChannels: Array.from(channelMap.values()),
      });

      const savedOp = await createUserOpRecord({
        projectId: project.id,
        buildId: activeBuild?.id ?? null,
        domain: 'general',
        recordType: 'analysis',
        title: 'Operating Gap Analysis',
        content: result as unknown as Record<string, unknown>,
      });
      opsActions.upsertOp(savedOp);
      if (result.gaps[0]) {
        handleDiagnoseGap(result.gaps[0]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not run gap analysis.',
      );
    } finally {
      setAnalyzingGaps(false);
    }
  }

  async function handleGeneratePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!project || generatingPlan) return;
    if (!founderDiagnosis.trim()) {
      setError(
        'Write your own diagnosis first—what do you think is causing this?',
      );
      return;
    }

    setGeneratingPlan(true);
    setError(null);

    try {
      const presetObj =
        DOMAIN_PRESETS[plannerDomain].presets.find((p) => p.key === presetKey) ??
        DOMAIN_PRESETS[plannerDomain].presets[0];

      const generated = await generateDomainOpsPlan({
        projectTitle: project.title,
        businessType: project.metadata?.businessType ?? 'side_hustle',
        currency,
        domain: plannerDomain,
        presetKey: presetObj.key,
        presetLabel: presetObj.label,
        founderDiagnosis: founderDiagnosis.trim(),
        offerTitle: offer?.title ?? project.title,
        offerPrice: offer?.metadata?.price_point ?? econ?.pricePerUnit ?? 0,
        metricsSummary: metrics as unknown as Record<string, unknown>,
        recentNotes: opsBundle.sales
          .map((s) => s.notes)
          .filter((n): n is string => Boolean(n))
          .slice(0, 6),
      });

      const savedPlan = await createUserOpRecord({
        projectId: project.id,
        buildId: activeBuild?.id ?? null,
        domain: plannerDomain,
        recordType: 'plan',
        title: generated.planTitle,
        founderDiagnosis: founderDiagnosis.trim(),
        content: generated.plan as unknown as Record<string, unknown>,
        actions: generated.actions,
      });

      opsActions.upsertOp(savedPlan);
      setFounderDiagnosis('');
      setSelectedGap(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not generate plan.',
      );
    } finally {
      setGeneratingPlan(false);
    }
  }

  async function handleRouteAction(op: UserOp, actionId: string) {
    if (!project || routingActionId) return;
    setRoutingActionId(actionId);
    setError(null);

    try {
      const res = await routeOpsPlanAction({
        opId: op.id,
        projectId: project.id,
        actionId,
      });
      opsActions.upsertOp(res.op);

      if (res.createdTaskId) {
        const refreshedTasks = await fetchOpsTasks();
        setTasks(refreshedTasks);
      }
      if (res.createdExperiment) {
        userExperimentsActions.upsert(res.createdExperiment);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not queue action.',
      );
    } finally {
      setRoutingActionId(null);
    }
  }

  async function handleToggleTask(task: OpsTaskSummary) {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)),
    );
    await updateOpsTaskStatus(task.id, nextStatus);
  }

  async function handleSaveExperimentReflection(exp: UserExperiment) {
    if (savingReflection || !howItWorked.trim()) return;
    setSavingReflection(true);
    setError(null);

    try {
      const updated = await saveUserExperimentReflection(
        exp.id,
        {
          ...exp.reflection,
          worked: workedChoice,
          how_it_worked: howItWorked.trim(),
          next_move: nextMove.trim() || undefined,
        },
        { markCompleted: true },
      );
      userExperimentsActions.upsert(updated);
      setReflectingExpId(null);
      setHowItWorked('');
      setNextMove('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save reflection.',
      );
    } finally {
      setSavingReflection(false);
    }
  }

  const activePreset =
    DOMAIN_PRESETS[plannerDomain].presets.find((p) => p.key === presetKey) ??
    DOMAIN_PRESETS[plannerDomain].presets[0];

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Baseline & KPI Header */}
      <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {opsBundle.activeGoal?.horizon === '6_months'
                  ? '6-Month Window'
                  : '3-Month Window'}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Live Operating Baseline
              </span>
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {project?.title ?? 'Your Operating Business'}
            </h1>
            {goals?.q1Focus && (
              <p className="text-xs text-muted-foreground">
                Current Focus: <strong className="text-foreground">{goals.q1Focus}</strong>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIngestOpen(true)}
              className="h-11 rounded-full px-5 text-sm font-semibold"
            >
              <Upload className="mr-2 h-4 w-4" />
              Update Data / CSV
            </Button>

            <Button
              type="button"
              onClick={() =>
                router.push(
                  '/program?mission=mission-6&node=m6-q2-operate&operateComplete=1',
                )
              }
              className="h-11 rounded-full px-6 text-sm font-semibold"
            >
              Review Crossroads
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 4 Fundamentals Pulse Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Net Revenue vs. Monthly Goal
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {currency}
              {metrics.netRevenue.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Goal: {currency}
              {(goals?.monthlyRevenueTarget ?? 0).toLocaleString()}/mo · Net
              Profit:{' '}
              <strong className="text-emerald-700">
                {currency}
                {metrics.netProfit.toLocaleString()}
              </strong>
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Market · Funnel Conversion
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {metrics.totalOrders} orders
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              From {metrics.totalInquiries} inquiries ({metrics.inquiryToSalePercent}
              % close) · CAC: {currency}
              {metrics.actualCac}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Customer · Value &amp; Loyalty
            </p>
            <p className="mt-1 text-2xl font-bold text-primary">
              {metrics.repeatRatePercent}% repeat
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Goal: {goals?.repeatRateTargetPercent ?? 25}% ·{' '}
              {metrics.outcomeRatePercent}% got promised outcome
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Time Reality vs. M4 Estimate
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {metrics.avgHoursPerOrder} hrs/sale
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              M4 Est: {econ?.hoursPerUnit ?? 0} hrs · Cap:{' '}
              {goals?.maxWeeklyHours ?? econ?.availableWeeklyHours ?? 15}h/wk
            </p>
          </div>
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* 2. Gap Analysis Strip */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Operating Gap Analysis
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleRunGapAnalysis()}
            disabled={analyzingGaps}
            className="rounded-full"
          >
            {analyzingGaps ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Scanning numbers…
              </>
            ) : (
              <>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                {analysisContent ? 'Re-scan for gaps' : 'Scan my numbers for gaps'}
              </>
            )}
          </Button>
        </div>

        {analysisContent ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              {analysisContent.summary}
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {analysisContent.gaps.map((gap) => (
                <div
                  key={gap.id}
                  className={`flex flex-col justify-between space-y-3 rounded-xl border p-4 text-xs ${
                    selectedGap?.id === gap.id
                      ? 'border-primary bg-primary/[0.04]'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="space-y-1.5">
                    <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                      {gap.domain}
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      {gap.headline}
                    </p>
                    <p className="leading-5 text-muted-foreground">
                      {gap.evidence}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDiagnoseGap(gap)}
                    className="w-full justify-between"
                  >
                    <span>Diagnose this gap</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Click &ldquo;Scan my numbers for gaps&rdquo; whenever you upload new
            sales or traffic data to spot bottlenecks across Market, Money, and
            Customer.
          </p>
        )}
      </section>

      {/* 3. Main Split: Preset Domain Planners (Left) + Tasks & Hypothesis Experiments (Right) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Founder Diagnosis -> Preset Planner -> Action Router */}
        <section className="space-y-6 rounded-2xl border border-border bg-card p-6 lg:col-span-7">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Compass className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                What Do I Do Next? · Copilot Planner
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Diagnose first, then plan across Market, Money, or Customer
            </h2>
          </div>

          {/* 3 Functional Unit Tabs */}
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['market', 'Market', Megaphone],
                ['money', 'Money', DollarSign],
                ['customer', 'Customer', HeartHandshake],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectDomain(key)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold transition ${
                  plannerDomain === key
                    ? 'border-primary bg-primary/[0.06] text-primary'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Preset Use-Case Pills */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Choose a focused scenario:
            </p>
            <div className="flex flex-wrap gap-2">
              {DOMAIN_PRESETS[plannerDomain].presets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => setPresetKey(preset.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    presetKey === preset.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 1: Mandatory Founder Diagnosis */}
          <form onSubmit={(e) => void handleGeneratePlan(e)} className="space-y-4">
            <div className="space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-4">
              <label className="block text-xs font-bold text-foreground">
                Your Diagnosis First:{' '}
                {selectedGap
                  ? selectedGap.diagnosisPrompt
                  : activePreset.promptHint}
              </label>
              <SpeechTextarea
                rows={3}
                value={founderDiagnosis}
                onChange={(e) => setFounderDiagnosis(e.target.value)}
                placeholder="Write what you are seeing in real buyer conversations, delivery work, or numbers..."
                className="mt-1 bg-background text-sm leading-6"
              />
            </div>

            <Button
              type="submit"
              disabled={generatingPlan || !founderDiagnosis.trim()}
              className="h-11 rounded-full px-6 text-sm font-semibold"
            >
              {generatingPlan ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Building grounded plan…
                </>
              ) : (
                <>
                  Generate {DOMAIN_PRESETS[plannerDomain].label} Actions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Recent Plans & Action Router */}
          {recentPlans.length > 0 && (
            <div className="space-y-4 border-t border-border pt-6">
              <h3 className="text-sm font-bold text-foreground">
                Active Plans &amp; Action Router
              </h3>

              {recentPlans.map((planOp) => {
                const planData = planOp.content as Record<string, unknown>;
                return (
                  <div
                    key={planOp.id}
                    className="space-y-3 rounded-xl border border-border bg-background p-4 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                        {planOp.domain}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(planOp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-bold text-foreground">{planOp.title}</p>
                    {typeof planData.summary === 'string' && (
                      <p className="text-xs leading-5 text-muted-foreground">
                        {planData.summary}
                      </p>
                    )}
                    {typeof planData.suggestedCopyOrOffer === 'string' && (
                      <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 font-sans text-xs text-foreground">
                        {planData.suggestedCopyOrOffer}
                      </pre>
                    )}

                    {/* Routable Actions */}
                    <div className="space-y-2 pt-1">
                      {planOp.actions.map((act) => (
                        <div
                          key={act.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-card p-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-foreground">
                              {act.title}
                            </p>
                            {act.detail && (
                              <p className="text-muted-foreground">
                                {act.detail}
                              </p>
                            )}
                          </div>

                          {act.status === 'queued' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                              <Check className="h-3 w-3" />
                              {act.route_to === 'experiment'
                                ? 'Testing hypothesis'
                                : 'Added to tasks'}
                            </span>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                act.route_to === 'experiment'
                                  ? 'default'
                                  : 'outline'
                              }
                              disabled={routingActionId === act.id}
                              onClick={() =>
                                void handleRouteAction(planOp, act.id)
                              }
                            >
                              {act.route_to === 'experiment'
                                ? `Start ${act.timeframe_days ?? 14}d Hypothesis Test`
                                : 'Add to Tasks'}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Tasks & Reflection-Only Hypothesis Experiments */}
        <div className="space-y-6 lg:col-span-5">
          {/* Active Hypothesis Experiments (Zero-Data-Entry Reflection) */}
          <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">
                Hypothesis Experiments ({opsExperiments.length})
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Results come straight from your uploaded Sales &amp; Traffic data.
              Log your reflection once the test window ends.
            </p>

            {opsExperiments.length === 0 ? (
              <p className="rounded-xl bg-muted/30 p-4 text-xs text-muted-foreground">
                No operating hypothesis tests running yet. When a planner
                suggests testing an uncertain bet, launch it from there.
              </p>
            ) : (
              <div className="space-y-3">
                {opsExperiments.map((exp) => {
                  const isReflecting = reflectingExpId === exp.id;
                  return (
                    <div
                      key={exp.id}
                      className="space-y-3 rounded-xl border border-border bg-background p-4 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-foreground">
                          {exp.title}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            exp.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {exp.status}
                        </span>
                      </div>

                      {exp.setup?.pitch?.direction && (
                        <p className="text-muted-foreground">
                          <strong>Hypothesis:</strong>{' '}
                          {exp.setup.pitch.direction}
                        </p>
                      )}

                      {exp.status === 'completed' ? (
                        <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                          <p className="font-semibold text-foreground">
                            Worked?{' '}
                            <span className="uppercase text-primary">
                              {exp.reflection?.worked ?? 'logged'}
                            </span>
                          </p>
                          {exp.reflection?.how_it_worked && (
                            <p className="text-muted-foreground">
                              {exp.reflection.how_it_worked}
                            </p>
                          )}
                        </div>
                      ) : isReflecting ? (
                        <div className="space-y-2.5 border-t border-border pt-3">
                          <p className="font-semibold text-foreground">
                            Looking at your recent Sales &amp; Traffic, did it
                            work?
                          </p>
                          <div className="flex gap-2">
                            {(['yes', 'partially', 'no'] as const).map(
                              (opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setWorkedChoice(opt)}
                                  className={`rounded-full px-3 py-1 font-semibold capitalize ${
                                    workedChoice === opt
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ),
                            )}
                          </div>
                          <textarea
                            rows={2}
                            value={howItWorked}
                            onChange={(e) => setHowItWorked(e.target.value)}
                            placeholder="How did it work (or why didn't it)?"
                            className="w-full rounded-lg border border-border bg-card p-2 text-xs"
                          />
                          <input
                            type="text"
                            value={nextMove}
                            onChange={(e) => setNextMove(e.target.value)}
                            placeholder="What will you keep, tweak, or drop next?"
                            className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={
                                savingReflection || !howItWorked.trim()
                              }
                              onClick={() =>
                                void handleSaveExperimentReflection(exp)
                              }
                            >
                              Save Reflection
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setReflectingExpId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReflectingExpId(exp.id);
                            setWorkedChoice('yes');
                            setHowItWorked('');
                            setNextMove('');
                          }}
                        >
                          Log Reflection &amp; Close Test
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Active Tasks Queue */}
          <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">
                Execution Tasks ({tasks.filter((t) => t.status !== 'completed').length} open)
              </h2>
            </div>

            {loadingTasks ? (
              <p className="text-xs text-muted-foreground">Loading tasks…</p>
            ) : tasks.length === 0 ? (
              <p className="rounded-xl bg-muted/30 p-4 text-xs text-muted-foreground">
                No tasks yet. Route concrete fixes from any Market, Money, or
                Customer plan into your task list.
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 12).map((task) => {
                  const done = task.status === 'completed';
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => void handleToggleTask(task)}
                      className="flex w-full items-start gap-2.5 rounded-xl border border-border/70 bg-background p-3 text-left text-xs"
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          done
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border'
                        }`}
                      >
                        {done && <Check className="h-3 w-3" />}
                      </span>
                      <span
                        className={
                          done
                            ? 'text-muted-foreground line-through'
                            : 'font-medium text-foreground'
                        }
                      >
                        {task.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {project && (
        <OpsDataIngestModal
          open={ingestOpen}
          onClose={() => setIngestOpen(false)}
          projectId={project.id}
          currency={currency}
        />
      )}
    </div>
  );
}