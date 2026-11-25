'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@nanostores/react';
import { ArrowRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $activeProject, $selectedOffer } from '@/lib/stores/projects';
import { $activeProjectOps, $opsMetricsSummary } from '@/lib/stores/ops';
import { OpsDataIngestModal } from './OpsDataIngestModal';

export function OpsBaselineDashboard() {
  const router = useRouter();
  const project = useStore($activeProject);
  const offer = useStore($selectedOffer);
  const opsBundle = useStore($activeProjectOps);
  const metrics = useStore($opsMetricsSummary);

  const [ingestOpen, setIngestOpen] = useState(false);

  const econ = project?.metadata?.economics;
  const currency = offer?.metadata?.currency ?? econ?.currency ?? '₹';
  const goals = opsBundle.goalContent;

  return (
    <>
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
                Current Focus:{' '}
                <strong className="text-foreground">{goals.q1Focus}</strong>
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

        {/* 4 Deterministic Fundamentals KPI Cards */}
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
              From {metrics.totalInquiries} inquiries (
              {metrics.inquiryToSalePercent}% close) · CAC: {currency}
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

      {project && (
        <OpsDataIngestModal
          open={ingestOpen}
          onClose={() => setIngestOpen(false)}
          projectId={project.id}
          currency={currency}
        />
      )}
    </>
  );
}