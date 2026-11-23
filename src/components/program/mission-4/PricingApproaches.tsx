'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { AlertCircle, ArrowRight, Check, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import { $activeProject, projectsActions } from '@/lib/stores/projects';
import {
  fetchMission4ContextSummary,
  updateUserProjectMetadata,
} from '@/actions/projects';
import type {
  Mission4ContextSummary,
  PricingApproachKey,
  ProjectEconomics,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function PricingApproaches({ node, onComplete }: NodeComponentProps) {
  const activeProject = useStore($activeProject);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [valueSavedMonthly, setValueSavedMonthly] = useState<number>(0);
  const [approach, setApproach] =
    useState<PricingApproachKey>('value_outcome');
  const [rationale, setRationale] = useState<string>('');

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
            setValueSavedMonthly(econ.customerValueSavedMonthly ?? 0);
            if (econ.pricingApproach) setApproach(econ.pricingApproach);
            if (econ.pricingRationale) setRationale(econ.pricingRationale);
            if (econ.pricePerUnit > 0) {
              setPrice(econ.pricePerUnit);
            } else {
              const unitCost =
                (econ.directCostPerUnit ?? 0) + (econ.cacPerUnit ?? 0);
              setPrice(Math.max(Math.round(unitCost * 2.5), 10));
            }
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
  const totalUnitCost =
    (econ?.directCostPerUnit ?? 0) + (econ?.cacPerUnit ?? 0);
  const fixedCost = econ?.monthlyFixedCosts ?? 0;
  const hoursPerUnit = econ?.hoursPerUnit ?? 0;
  const targetIncome = econ?.targetMonthlyIncome ?? 50000;
  const availableWeeklyHours = econ?.availableWeeklyHours ?? 10;

  const anchors = useMemo(() => {
    const costPlusFloor = Math.max(
      Math.ceil(totalUnitCost * 1.55),
      totalUnitCost + 1,
    );
    const valueAnchorPrice =
      valueSavedMonthly > 0 ? Math.round(valueSavedMonthly * 0.15) : 0;

    const maxMonthlyHours = Math.max(availableWeeklyHours * 4.33, 4);
    const maxUnitsByTime =
      hoursPerUnit > 0
        ? Math.max(Math.floor(maxMonthlyHours / hoursPerUnit), 1)
        : 25;
    const capacityTargetPrice = Math.ceil(
      (fixedCost + targetIncome) / maxUnitsByTime + totalUnitCost,
    );

    return {
      costPlusFloor,
      valueAnchorPrice,
      capacityTargetPrice,
      maxUnitsByTime,
    };
  }, [
    totalUnitCost,
    valueSavedMonthly,
    availableWeeklyHours,
    hoursPerUnit,
    fixedCost,
    targetIncome,
  ]);

  const workaroundSnippet = useMemo(() => {
    if (context?.m2WorkaroundSummary) return context.m2WorkaroundSummary;
    const personaAlt = project?.metadata?.personas?.[0]?.currentAlternative;
    return personaAlt
      ? `Current alternative: ${personaAlt}`
      : 'Think about what buyers spend today on clunky tools, extra staff time, or wasted stock.';
  }, [context?.m2WorkaroundSummary, project?.metadata?.personas]);

  async function handleSaveAndContinue() {
    if (saving || !project || !econ) return;
    if (price <= 0) {
      setError('Pick or enter a starting price greater than 0.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const margin = price - totalUnitCost;
      const marginPercent =
        price > 0 ? Math.round((margin / price) * 100) : 0;
      const breakEven = margin > 0 ? Math.ceil(fixedCost / margin) : 0;
      const setupPayback =
        margin > 0 ? Math.ceil((econ.oneTimeSetupCosts ?? 0) / margin) : 0;
      const unitsForIncome =
        margin > 0 ? Math.ceil((fixedCost + targetIncome) / margin) : 0;
      const weeklyHoursAtGoal =
        unitsForIncome > 0 && hoursPerUnit > 0
          ? Number(((unitsForIncome * hoursPerUnit) / 4.33).toFixed(1))
          : 0;

      const updatedEconomics: ProjectEconomics = {
        ...econ,
        pricePerUnit: price,
        pricingApproach: approach,
        pricingRationale: rationale.trim() || undefined,
        customerValueSavedMonthly:
          valueSavedMonthly > 0 ? valueSavedMonthly : undefined,
        marginPerUnit: margin,
        marginPercent,
        breakEvenUnitsPerMonth: breakEven,
        setupPaybackUnits: setupPayback,
        unitsForIncomeGoal: unitsForIncome,
        weeklyHoursAtIncomeGoal: weeklyHoursAtGoal,
      };

      const updatedProject = await updateUserProjectMetadata(project.id, {
        economics: updatedEconomics,
      });
      projectsActions.upsertProject(updatedProject);

      await onComplete({
        completed: true,
        pricePerUnit: price,
        pricingApproach: approach,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your pricing.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Preparing pricing approaches…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Tag className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Pricing Lenses
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Four Practical Pricing Approaches */}
      <div className="max-w-3xl space-y-4">
        <h2 className="text-lg font-bold">
          1. Compare four pricing lenses (click any lens to test its price)
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Lens 1 */}
          <button
            type="button"
            onClick={() => {
              setPrice(anchors.costPlusFloor);
              setApproach('cost_plus');
            }}
            className={`rounded-2xl border p-5 text-left transition ${
              approach === 'cost_plus'
                ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Cost-Plus Floor
              </span>
              {approach === 'cost_plus' && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {currency}
              {anchors.costPlusFloor.toLocaleString()}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Covers your {currency}
              {totalUnitCost.toLocaleString()} per-sale cost plus a ~35%
              buffer. Good as a safety floor—dangerous if used alone.
            </p>
          </button>

          {/* Lens 2 */}
          <div
            onClick={() => setApproach('workaround_anchor')}
            className={`cursor-pointer rounded-2xl border p-5 text-left transition ${
              approach === 'workaround_anchor'
                ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. Workaround Anchor
              </span>
              {approach === 'workaround_anchor' && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
            <p className="mt-2 text-sm font-bold text-foreground">
              Anchor against what they already spend
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {workaroundSnippet}
            </p>
          </div>

          {/* Lens 3 */}
          <div
            onClick={() => setApproach('value_outcome')}
            className={`cursor-pointer rounded-2xl border p-5 text-left transition ${
              approach === 'value_outcome'
                ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                3. Outcome / Pain Saved
              </span>
              {approach === 'value_outcome' && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>

            <div className="mt-2 space-y-2">
              <label className="block text-xs text-muted-foreground">
                Est. monthly value or waste saved for buyer ({currency}):
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={valueSavedMonthly || ''}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    setValueSavedMonthly(Number(e.target.value) || 0)
                  }
                  placeholder="e.g. 15000"
                  className="w-28 rounded-lg border border-border bg-background px-2.5 py-1 text-sm font-semibold"
                />
                {anchors.valueAnchorPrice > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrice(anchors.valueAnchorPrice);
                      setApproach('value_outcome');
                    }}
                  >
                    Use {currency}
                    {anchors.valueAnchorPrice.toLocaleString()} (15%)
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Lens 4 */}
          <button
            type="button"
            onClick={() => {
              setPrice(anchors.capacityTargetPrice);
              setApproach('capacity_target');
            }}
            className={`rounded-2xl border p-5 text-left transition ${
              approach === 'capacity_target'
                ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                4. Time &amp; Income Reality
              </span>
              {approach === 'capacity_target' && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {currency}
              {anchors.capacityTargetPrice.toLocaleString()}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Needed to earn {currency}
              {targetIncome.toLocaleString()}/mo within your{' '}
              {availableWeeklyHours} hrs/wk cap (~{anchors.maxUnitsByTime}{' '}
              sales/mo max).
            </p>
          </button>
        </div>
      </div>

      {/* Candidate Price & Buyer Rationale */}
      <div className="max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-bold text-foreground">
          2. Set your candidate starting price
        </h2>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Starting Price ({currency})
          </label>
          <input
            type="number"
            min={1}
            value={price || ''}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
            disabled={saving}
            className="w-full rounded-xl border border-primary/50 bg-background px-3.5 py-2.5 text-lg font-bold sm:w-56"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Why will this feel fair—or like a bargain—to your customer?
          </label>
          <SpeechTextarea
            rows={2}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            disabled={saving}
            placeholder="e.g. Saves a cafe ~₹12,000/month in wasted stock, so ₹1,500/month pays for itself in 4 days..."
            className="text-sm leading-6"
          />
        </div>
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
          disabled={saving || price <= 0}
          className="h-12 rounded-full px-8 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              See your pricing in action
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}