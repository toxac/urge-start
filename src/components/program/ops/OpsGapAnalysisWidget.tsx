'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { AlertCircle, ArrowRight, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { createUserOpRecord } from '@/actions/ops';
import { analyzeOperatingGaps } from '@/actions/responses/mission6';
import type { OpsAnalysisContent, OpsAnalysisGap } from '@/lib/types/ops';

type OpsGapAnalysisWidgetProps = {
  selectedGapId: string | null;
  onSelectGap: (gap: OpsAnalysisGap) => void;
};

export function OpsGapAnalysisWidget({
  selectedGapId,
  onSelectGap,
}: OpsGapAnalysisWidgetProps) {
  const project = useStore($activeProject);
  const offer = useStore($selectedOffer);
  const activeBuild = useStore($activeBuild);
  const opsBundle = useStore($activeProjectOps);
  const metrics = useStore($opsMetricsSummary);

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const econ = project?.metadata?.economics;
  const currency = offer?.metadata?.currency ?? econ?.currency ?? '₹';

  const latestAnalysisOp = useMemo(
    () => opsBundle.ops.find((o) => o.record_type === 'analysis') ?? null,
    [opsBundle.ops],
  );
  const analysisContent = latestAnalysisOp
    ? (latestAnalysisOp.content as unknown as OpsAnalysisContent)
    : null;

  async function handleRunScan() {
    if (!project || analyzing) return;
    setAnalyzing(true);
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
        goals: opsBundle.goalContent,
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
        onSelectGap(result.gaps[0]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not run gap analysis.',
      );
    } finally {
      setAnalyzing(false);
    }
  }

  return (
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
          onClick={() => void handleRunScan()}
          disabled={analyzing}
          className="rounded-full"
        >
          {analyzing ? (
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

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

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
                  selectedGapId === gap.id
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
                  onClick={() => onSelectGap(gap)}
                  className="w-full justify-between"
                >
                  <span>Diagnose in {gap.domain}</span>
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
  );
}