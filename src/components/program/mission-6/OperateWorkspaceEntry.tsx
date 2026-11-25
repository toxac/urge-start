'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@nanostores/react';
import {
  ArrowRight,
  ExternalLink,
  LayoutDashboard,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $activeProject, $selectedOffer } from '@/lib/stores/projects';
import { $activeProjectOps, $opsMetricsSummary } from '@/lib/stores/ops';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function OperateWorkspaceEntry({
  node,
  onComplete,
}: NodeComponentProps) {
  const project = useStore($activeProject);
  const offer = useStore($selectedOffer);
  const opsBundle = useStore($activeProjectOps);
  const metrics = useStore($opsMetricsSummary);
  const autoCompletedRef = useRef(false);

  const [completing, setCompleting] = useState(false);

  // Auto-advance to Quest 3 when returning from /program/operate?operateComplete=1
  useEffect(() => {
    if (typeof window === 'undefined' || autoCompletedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('operateComplete') === '1') {
      autoCompletedRef.current = true;
      void onComplete({
        completed: true,
        netRevenue: metrics.netRevenue,
        totalOrders: metrics.totalOrders,
      });
    }
  }, [onComplete, metrics.netRevenue, metrics.totalOrders]);

  const currency =
    offer?.metadata?.currency ??
    project?.metadata?.economics?.currency ??
    '₹';
  const plansCount = opsBundle.ops.filter(
    (o) => o.record_type === 'plan',
  ).length;

  async function handleFinishOperatingWindow() {
    if (completing) return;
    setCompleting(true);
    try {
      await onComplete({
        completed: true,
        netRevenue: metrics.netRevenue,
        totalOrders: metrics.totalOrders,
      });
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Quest 2 ·{' '}
            {opsBundle.activeGoal?.horizon === '6_months'
              ? '6-Month Operating Copilot'
              : '3-Month Operating Copilot'}
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      <div className="max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-muted-foreground">Cumulative Net Revenue</p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {currency}
              {metrics.netRevenue.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-muted-foreground">Orders Delivered</p>
            <p className="mt-1 text-xl font-bold text-primary">
              {metrics.totalOrders}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-muted-foreground">Copilot Plans Created</p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {plansCount}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button className="h-12 rounded-full px-8 text-base">
            <Link href="/program/operate">
              Open Operate Copilot
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => void handleFinishOperatingWindow()}
            disabled={completing}
            className="h-12 rounded-full px-6 text-base"
          >
            {completing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Advancing…
              </>
            ) : (
              <>
                Complete operating window &amp; review crossroads
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}