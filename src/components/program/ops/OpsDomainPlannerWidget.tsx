'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  DollarSign,
  HeartHandshake,
  Loader2,
  Megaphone,
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
import { userExperimentsActions } from '@/lib/stores/experiments';
import { createUserOpRecord, routeOpsPlanAction } from '@/actions/ops';
import { generateDomainOpsPlan } from '@/actions/responses/mission6';
import type { OpsAnalysisGap, OpsDomain, UserOp } from '@/lib/types/ops';

export type PlannerDomain = Exclude<OpsDomain, 'general'>;

const DOMAIN_CONFIG: Record<
  PlannerDomain,
  {
    label: string;
    subtitle: string;
    Icon: typeof Megaphone;
    presets: Array<{ key: string; label: string; promptHint: string }>;
  }
> = {
  market: {
    label: 'Market Planner',
    subtitle: 'Acquisition, campaigns, segments & offer positioning',
    Icon: Megaphone,
    presets: [
      {
        key: 'convert_open_leads',
        label: 'Convert stalled inquiries',
        promptHint: 'Why are warm leads hesitating before paying?',
      },
      {
        key: 'weekly_campaign_sprint',
        label: 'Run a low-cost weekly campaign',
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
    Icon: DollarSign,
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
    Icon: HeartHandshake,
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

type OpsDomainPlannerWidgetProps = {
  domain: PlannerDomain;
  activeGap: OpsAnalysisGap | null;
  onClearGap: () => void;
  onTaskQueued: () => void;
};

export function OpsDomainPlannerWidget({
  domain,
  activeGap,
  onClearGap,
  onTaskQueued,
}: OpsDomainPlannerWidgetProps) {
  const project = useStore($activeProject);
  const offer = useStore($selectedOffer);
  const activeBuild = useStore($activeBuild);
  const opsBundle = useStore($activeProjectOps);
  const metrics = useStore($opsMetricsSummary);

  const config = DOMAIN_CONFIG[domain];
  const Icon = config.Icon;

  const [presetKey, setPresetKey] = useState<string>(config.presets[0].key);
  const [founderDiagnosis, setFounderDiagnosis] = useState('');
  const [generating, setGenerating] = useState(false);
  const [routingActionId, setRoutingActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const econ = project?.metadata?.economics;
  const currency = offer?.metadata?.currency ?? econ?.currency ?? '₹';

  const domainPlans = useMemo(
    () =>
      opsBundle.ops
        .filter((o) => o.record_type === 'plan' && o.domain === domain)
        .slice(0, 3),
    [opsBundle.ops, domain],
  );

  const activePreset =
    config.presets.find((p) => p.key === presetKey) ?? config.presets[0];

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!project || generating) return;
    if (!founderDiagnosis.trim()) {
      setError('Write your own diagnosis first before generating a plan.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const generated = await generateDomainOpsPlan({
        projectTitle: project.title,
        businessType: project.metadata?.businessType ?? 'side_hustle',
        currency,
        domain,
        presetKey: activePreset.key,
        presetLabel: activePreset.label,
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
        domain,
        recordType: 'plan',
        title: generated.planTitle,
        founderDiagnosis: founderDiagnosis.trim(),
        content: generated.plan as unknown as Record<string, unknown>,
        actions: generated.actions,
      });

      opsActions.upsertOp(savedPlan);
      setFounderDiagnosis('');
      if (activeGap) onClearGap();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not generate plan.',
      );
    } finally {
      setGenerating(false);
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
        onTaskQueued();
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

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <Icon className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            {config.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{config.subtitle}</p>
      </div>

      {/* Preset Scenario Pills */}
      <div className="flex flex-wrap gap-1.5">
        {config.presets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => setPresetKey(preset.key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              presetKey === preset.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Step 1: Founder Diagnosis */}
      <form onSubmit={(e) => void handleGenerate(e)} className="space-y-3">
        <div className="space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-3.5">
          <label className="block text-xs font-bold text-foreground">
            Your Diagnosis:{' '}
            {activeGap ? activeGap.diagnosisPrompt : activePreset.promptHint}
          </label>
          <SpeechTextarea
            rows={2}
            value={founderDiagnosis}
            onChange={(e) => setFounderDiagnosis(e.target.value)}
            placeholder="Write what you observe from front-line customer conversations or numbers..."
            className="mt-1 bg-background text-xs leading-5"
          />
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="sm"
          disabled={generating || !founderDiagnosis.trim()}
          className="rounded-full px-5"
        >
          {generating ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Planning…
            </>
          ) : (
            <>
              Generate {config.label} Actions
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </form>

      {/* Saved Domain Plans & Action Router */}
      {domainPlans.length > 0 && (
        <div className="space-y-3 border-t border-border pt-4">
          {domainPlans.map((planOp) => {
            const planData = planOp.content as Record<string, unknown>;
            return (
              <div
                key={planOp.id}
                className="space-y-2.5 rounded-xl border border-border bg-background p-4 text-xs"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-foreground">{planOp.title}</p>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(planOp.created_at).toLocaleDateString()}
                  </span>
                </div>
                {typeof planData.summary === 'string' && (
                  <p className="leading-5 text-muted-foreground">
                    {planData.summary}
                  </p>
                )}
                {typeof planData.suggestedCopyOrOffer === 'string' && (
                  <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-2.5 font-sans text-xs text-foreground">
                    {planData.suggestedCopyOrOffer}
                  </pre>
                )}

                <div className="space-y-1.5 pt-1">
                  {planOp.actions.map((act) => (
                    <div
                      key={act.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-card p-2.5"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">
                          {act.title}
                        </p>
                        {act.detail && (
                          <p className="text-[11px] text-muted-foreground">
                            {act.detail}
                          </p>
                        )}
                      </div>

                      {act.status === 'queued' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <Check className="h-3 w-3" />
                          {act.route_to === 'experiment'
                            ? 'Testing hypothesis'
                            : 'In tasks'}
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
                          onClick={() => void handleRouteAction(planOp, act.id)}
                        >
                          {act.route_to === 'experiment'
                            ? `Start ${act.timeframe_days ?? 14}d Test`
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
  );
}