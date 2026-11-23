'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $activeProject, projectsActions } from '@/lib/stores/projects';
import {
  fetchMission4ContextSummary,
  updateUserProjectMetadata,
} from '@/actions/projects';
import { assessUnitEconomics } from '@/actions/responses/mission4';
import type {
  EconomicsAssessmentResult,
  Mission4ContextSummary,
  ProjectEconomics,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function PricingInActionReveal({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const activeProject = useStore($activeProject);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [monthlyUnits, setMonthlyUnits] = useState<number>(10);
  const [cacPerUnit, setCacPerUnit] = useState<number>(0);
  const [assessment, setAssessment] =
    useState<EconomicsAssessmentResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const data = await fetchMission4ContextSummary();
        if (!alive) return;
        setContext(data);

        const proj = data.project ?? activeProject;
        if (proj) {
          projectsActions.upsertProject(proj);
          const econ = proj.metadata?.economics;
          if (econ) {
            setPrice(econ.pricePerUnit);
            setCacPerUnit(econ.cacPerUnit ?? 0);
            setMonthlyUnits(
              econ.projectedMonthlyUnits ??
                Math.max(econ.breakEvenUnitsPerMonth || 10, 5),
            );

            if (econ.realityCheck && econ.realityCheck.marginHealth) {
              setAssessment(econ.realityCheck);
            } else {
              const check = await assessUnitEconomics({
                projectTitle: proj.title,
                businessType: proj.metadata?.businessType ?? 'side_hustle',
                economics: econ,
                m1Constraints: data.m1Constraints,
                nodeKey,
                regenerate: false,
              });
              if (!alive) return;
              setAssessment(check);
            }
          }
        }
      } catch (err) {
        if (alive) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load pricing simulation.',
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
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
  const hoursPerUnit = econ?.hoursPerUnit ?? 0;
  const targetIncome = econ?.targetMonthlyIncome ?? 50000;
  const availableWeeklyHours = econ?.availableWeeklyHours ?? 10;

  const minPriceSlider = Math.max(1, Math.floor(variableCost * 0.5));
  const maxPriceSlider = Math.max(
    Math.ceil((econ?.pricePerUnit || 100) * 3),
    variableCost + 500,
  );

  // Live Interactive Simulation
  const sim = useMemo(() => {
    const marginPerUnit = price - variableCost - cacPerUnit;
    const marginPercent =
      price > 0 ? Math.round((marginPerUnit / price) * 100) : 0;

    const monthlyRevenue = price * monthlyUnits;
    const monthlyProfit = marginPerUnit * monthlyUnits - fixedCost;
    const weeklyHoursAtSim =
      hoursPerUnit > 0
        ? Number(((monthlyUnits * hoursPerUnit) / 4.33).toFixed(1))
        : 0;

    const breakEvenUnits =
      marginPerUnit > 0 ? Math.ceil(fixedCost / marginPerUnit) : 0;
    const setupPaybackUnits =
      marginPerUnit > 0 ? Math.ceil(setupCost / marginPerUnit) : 0;
    const unitsForIncome =
      marginPerUnit > 0
        ? Math.ceil((fixedCost + targetIncome) / marginPerUnit)
        : 0;
    const weeklyHoursAtGoal =
      unitsForIncome > 0 && hoursPerUnit > 0
        ? Number(((unitsForIncome * hoursPerUnit) / 4.33).toFixed(1))
        : 0;

    return {
      marginPerUnit,
      marginPercent,
      monthlyRevenue,
      monthlyProfit,
      weeklyHoursAtSim,
      breakEvenUnits,
      setupPaybackUnits,
      unitsForIncome,
      weeklyHoursAtGoal,
      exceedsWeeklyHours:
        hoursPerUnit > 0 && weeklyHoursAtSim > availableWeeklyHours,
    };
  }, [
    price,
    variableCost,
    cacPerUnit,
    monthlyUnits,
    fixedCost,
    setupCost,
    hoursPerUnit,
    targetIncome,
    availableWeeklyHours,
  ]);

  function buildUpdatedEconomics(): ProjectEconomics | null {
    if (!econ) return null;
    return {
      ...econ,
      pricePerUnit: price,
      cacPerUnit,
      projectedMonthlyUnits: monthlyUnits,
      marginPerUnit: sim.marginPerUnit,
      marginPercent: sim.marginPercent,
      breakEvenUnitsPerMonth: sim.breakEvenUnits,
      setupPaybackUnits: sim.setupPaybackUnits,
      unitsForIncomeGoal: sim.unitsForIncome,
      weeklyHoursAtIncomeGoal: sim.weeklyHoursAtGoal,
      ...(assessment ? { realityCheck: assessment } : {}),
    };
  }

  async function handleReassessWithSliders() {
    if (regenerating || !project) return;
    const nextEcon = buildUpdatedEconomics();
    if (!nextEcon) return;

    setRegenerating(true);
    setError(null);
    try {
      const check = await assessUnitEconomics({
        projectTitle: project.title,
        businessType: project.metadata?.businessType ?? 'side_hustle',
        economics: nextEcon,
        m1Constraints: context?.m1Constraints ?? {},
        nodeKey,
        regenerate: true,
      });
      setAssessment(check);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not refresh reality check.',
      );
    } finally {
      setRegenerating(false);
    }
  }

  async function handleContinue() {
    if (saving || !project) return;
    const nextEcon = buildUpdatedEconomics();
    if (!nextEcon) return;

    setSaving(true);
    setError(null);
    try {
      const updatedProject = await updateUserProjectMetadata(project.id, {
        economics: nextEcon,
      });
      projectsActions.upsertProject(updatedProject);

      await onComplete({
        completed: true,
        pricePerUnit: price,
        projectedMonthlyUnits: monthlyUnits,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save simulation.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Putting your pricing into action…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <SlidersHorizontal className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Pricing in Action
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Interactive Sliders Box */}
      <div className="max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Price Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Selling Price</span>
              <span className="text-sm font-bold text-primary">
                {currency}
                {price.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={minPriceSlider}
              max={maxPriceSlider}
              step={Math.max(1, Math.round((maxPriceSlider - minPriceSlider) / 100))}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
          </div>

          {/* Monthly Volume Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Sales / Month</span>
              <span className="text-sm font-bold text-foreground">
                {monthlyUnits} sales
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={150}
              step={1}
              value={monthlyUnits}
              onChange={(e) => setMonthlyUnits(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
          </div>

          {/* CAC Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Ad / Buyer Cost</span>
              <span className="text-sm font-bold text-foreground">
                {currency}
                {cacPerUnit.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(500, Math.round(price * 0.8))}
              step={Math.max(1, Math.round(price / 50))}
              value={cacPerUnit}
              onChange={(e) => setCacPerUnit(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Live Output Metrics */}
        <div className="grid gap-3 border-t border-border/60 pt-5 sm:grid-cols-4">
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Profit / Sale</p>
            <p
              className={`mt-1 text-xl font-bold ${
                sim.marginPerUnit > 0 ? 'text-emerald-700' : 'text-destructive'
              }`}
            >
              {currency}
              {sim.marginPerUnit.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {sim.marginPercent}% margin
            </p>
          </div>

          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Monthly Take-Home</p>
            <p
              className={`mt-1 text-xl font-bold ${
                sim.monthlyProfit >= 0 ? 'text-foreground' : 'text-destructive'
              }`}
            >
              {currency}
              {sim.monthlyProfit.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Goal: {currency}
              {targetIncome.toLocaleString()}/mo
            </p>
          </div>

          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Break-Even Point</p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {sim.marginPerUnit > 0 ? `${sim.breakEvenUnits} sales/mo` : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              +{sim.setupPaybackUnits} to recover setup
            </p>
          </div>

          <div
            className={`rounded-xl p-4 ${
              sim.exceedsWeeklyHours
                ? 'border border-amber-500/40 bg-amber-500/10'
                : 'bg-muted/40'
            }`}
          >
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Your Time / Week
            </p>
            <p
              className={`mt-1 text-xl font-bold ${
                sim.exceedsWeeklyHours ? 'text-amber-700' : 'text-foreground'
              }`}
            >
              {hoursPerUnit > 0 ? `${sim.weeklyHoursAtSim}h/wk` : 'N/A'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Limit: {availableWeeklyHours}h/wk
            </p>
          </div>
        </div>

        {sim.exceedsWeeklyHours && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3.5 text-xs leading-5 text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              At {monthlyUnits} sales/month, this takes{' '}
              <strong className="text-foreground">
                {sim.weeklyHoursAtSim} hrs/week
              </strong>{' '}
              (above your {availableWeeklyHours}h/wk limit). Slide the price up
              so you can earn the same amount with fewer customers.
            </p>
          </div>
        )}
      </div>

      {/* AI Reality Check */}
      {assessment && (
        <div className="max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold">Reality Check</h2>
              <span
                className={`ml-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  assessment.verdict === 'solid'
                    ? 'bg-emerald-500/10 text-emerald-700'
                    : assessment.verdict === 'tight'
                      ? 'bg-amber-500/10 text-amber-700'
                      : 'bg-destructive/10 text-destructive'
                }`}
              >
                {assessment.verdict}
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleReassessWithSliders()}
              disabled={regenerating}
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`}
              />
              Re-check with current sliders
            </Button>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-foreground">Margin health</p>
              <p className="mt-0.5 leading-6 text-muted-foreground">
                {assessment.marginHealth}
              </p>
            </div>
            <div className="border-t border-border/60 pt-3">
              <p className="font-semibold text-foreground">
                Volume &amp; break-even reality
              </p>
              <p className="mt-0.5 leading-6 text-muted-foreground">
                {assessment.volumeReality}
              </p>
            </div>
            <div className="border-t border-border/60 pt-3">
              <p className="font-semibold text-foreground">Time ceiling</p>
              <p className="mt-0.5 leading-6 text-muted-foreground">
                {assessment.timeCeiling}
              </p>
            </div>
          </div>
        </div>
      )}

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
          onClick={() => void handleContinue()}
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
              Lock in this price
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}