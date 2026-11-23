'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Layers,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $activeProject, projectsActions } from '@/lib/stores/projects';
import {
  fetchMission4ContextSummary,
  updateUserProjectMetadata,
} from '@/actions/projects';
import type {
  Mission4ContextSummary,
  ProjectEconomics,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function UnitEconomicsBreakdown({
  node,
  onComplete,
}: NodeComponentProps) {
  const activeProject = useStore($activeProject);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [cacPerUnit, setCacPerUnit] = useState<number>(0);
  const [hoursPerUnit, setHoursPerUnit] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMission4ContextSummary()
      .then((data) => {
        if (!alive) return;
        setContext(data);
        const proj = data.project ?? activeProject;
        if (proj) {
          projectsActions.upsertProject(proj);
          const econ = proj.metadata?.economics;
          if (econ) {
            setCacPerUnit(econ.cacPerUnit ?? 0);
            setHoursPerUnit(econ.hoursPerUnit ?? 0);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const project = context?.project ?? activeProject;
  const econ = project?.metadata?.economics;

  const currency = econ?.currency ?? '₹';
  const variableCost = econ?.directCostPerUnit ?? 0;
  const fixedCost = econ?.monthlyFixedCosts ?? 0;
  const setupCost = econ?.oneTimeSetupCosts ?? 0;
  const totalUnitCashCost = variableCost + cacPerUnit;

  const variableItems = (econ?.lineItems ?? []).filter(
    (i) => i.bucket === 'variable',
  );
  const fixedItems = (econ?.lineItems ?? []).filter((i) => i.bucket === 'fixed');
  const setupItems = (econ?.lineItems ?? []).filter((i) => i.bucket === 'setup');

  async function handleSaveAndContinue() {
    if (saving || !project || !econ) return;
    setSaving(true);
    setError(null);

    try {
      const updatedEconomics: ProjectEconomics = {
        ...econ,
        cacPerUnit,
        hoursPerUnit,
      };

      const updatedProject = await updateUserProjectMetadata(project.id, {
        economics: updatedEconomics,
      });
      projectsActions.upsertProject(updatedProject);

      await onComplete({
        completed: true,
        totalUnitCashCost,
        hoursPerUnit,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save unit economics details.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Breaking down the cost of one sale…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Layers className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Anatomy of One Sale
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* 1. Direct Cost & Time Per Sale */}
      <div className="max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">
            1. What each single sale costs you
          </h2>
          <p className="text-sm text-muted-foreground">
            Every price you consider has to clear these direct per-order costs
            first before contributing a single rupee toward bills or profit.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">
              Direct Fulfillment Cost
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {currency}
              {variableCost.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              From {variableItems.length} variable item
              {variableItems.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <label className="block text-xs font-semibold text-foreground">
              Cost to Win 1 Buyer ({currency})
            </label>
            <input
              type="number"
              min={0}
              value={cacPerUnit || ''}
              onChange={(e) => setCacPerUnit(Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="mt-1.5 w-full rounded-lg border border-border bg-muted/20 px-2.5 py-1 text-lg font-bold"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Ad spend or referral fee per sale (0 if direct/organic)
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <label className="flex items-center gap-1 text-xs font-semibold text-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Your Hours / Sale</span>
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={hoursPerUnit || ''}
              onChange={(e) =>
                setHoursPerUnit(Math.max(0, Number(e.target.value) || 0))
              }
              placeholder="0"
              className="mt-1.5 w-full rounded-lg border border-border bg-muted/20 px-2.5 py-1 text-lg font-bold"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Delivery + prep/admin hours per order
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/[0.04] px-4 py-3 text-sm">
          <span className="font-semibold text-foreground">
            Total direct cash cost per sale:
          </span>
          <span className="text-lg font-bold text-primary">
            {currency}
            {totalUnitCashCost.toLocaleString()}
            {hoursPerUnit > 0 ? ` + ${hoursPerUnit} hrs of your time` : ''}
          </span>
        </div>
      </div>

      {/* 2. Overhead & Setup Weight */}
      <div className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">
          2. The overhead your sales have to cover
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 rounded-xl bg-muted/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Monthly Fixed Bills
            </p>
            <p className="text-2xl font-bold text-foreground">
              {currency}
              {fixedCost.toLocaleString()}/mo
            </p>
            <p className="text-xs text-muted-foreground">
              {fixedItems.length > 0
                ? fixedItems.map((i) => i.item).join(', ')
                : 'No recurring monthly fixed costs listed.'}
            </p>
          </div>

          <div className="space-y-1.5 rounded-xl bg-muted/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              One-Time Setup Outlay
            </p>
            <p className="text-2xl font-bold text-foreground">
              {currency}
              {setupCost.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {setupItems.length > 0
                ? setupItems.map((i) => i.item).join(', ')
                : 'No one-time setup expenses listed.'}
            </p>
          </div>
        </div>

        {econ?.uncertainNotes && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3.5 text-xs leading-5 text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>{econ.uncertainNotes}</p>
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleSaveAndContinue()}
          disabled={saving}
          className="h-12 rounded-full px-8 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Explore ways to price this
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}