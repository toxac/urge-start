'use client';

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Plug,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $activeProject, $selectedOffer } from '@/lib/stores/projects';
import { $activeProjectOps } from '@/lib/stores/ops';
import { OpsDataIngestModal } from '@/components/program/ops/OpsDataIngestModal';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function OperateDataIngest({ node, onComplete }: NodeComponentProps) {
  const project = useStore($activeProject);
  const offer = useStore($selectedOffer);
  const opsBundle = useStore($activeProjectOps);

  const [modalOpen, setModalOpen] = useState(false);
  const [continuing, setContinuing] = useState(false);

  const currency =
    offer?.metadata?.currency ??
    project?.metadata?.economics?.currency ??
    '₹';

  async function handleContinue() {
    if (continuing) return;
    setContinuing(true);
    try {
      await onComplete({
        completed: true,
        salesRows: opsBundle.sales.length,
        trafficRows: opsBundle.traffic.length,
      });
    } finally {
      setContinuing(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <FileSpreadsheet className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Quest 1 · Weekly Data Feeds &amp; CSV Templates
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Data Feeds Card */}
      <div className="max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Plug className="h-3.5 w-3.5 text-primary" />
              <span>Connected Tables</span>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Sales, Traffic &amp; Campaigns, and Expenses
            </h2>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="rounded-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Download CSV Templates / Upload Data
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="font-bold text-foreground">Sales &amp; Customers</p>
            <p className="mt-1 text-lg font-bold text-primary">
              {opsBundle.sales.length} rows
            </p>
            <p className="mt-1 text-muted-foreground">
              Orders, repeat status, outcome delivered &amp; hours spent.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="font-bold text-foreground">
              Traffic &amp; Campaigns
            </p>
            <p className="mt-1 text-lg font-bold text-primary">
              {opsBundle.traffic.length} rows
            </p>
            <p className="mt-1 text-muted-foreground">
              Website visits, store footfall, social reach, inquiries &amp;
              spend.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="font-bold text-foreground">Operating Expenses</p>
            <p className="mt-1 text-lg font-bold text-primary">
              {opsBundle.expenses.length} rows
            </p>
            <p className="mt-1 text-muted-foreground">
              Fixed bills, tools, and variable overhead.
            </p>
          </div>
        </div>

        {opsBundle.sales.length + opsBundle.traffic.length > 0 && (
          <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Baseline operating records loaded and ready for the Operate
            Copilot.
          </p>
        )}
      </div>

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={continuing}
          className="h-12 rounded-full px-8 text-base"
        >
          {continuing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening Copilot…
            </>
          ) : (
            <>
              Enter Operate Copilot
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {project && (
        <OpsDataIngestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          projectId={project.id}
          currency={currency}
        />
      )}
    </div>
  );
}