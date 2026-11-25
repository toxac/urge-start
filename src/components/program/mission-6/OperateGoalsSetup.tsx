'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { AlertCircle, ArrowRight, Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import {
  $activeBuild,
  $activeProject,
  $selectedOffer,
} from '@/lib/stores/projects';
import { $activeProjectOps, opsActions } from '@/lib/stores/ops';
import { saveOpsGoals } from '@/actions/ops';
import type { OpsGoalContent, OpsHorizon } from '@/lib/types/ops';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function OperateGoalsSetup({ node, onComplete }: NodeComponentProps) {
  const project = useStore($activeProject);
  const offer = useStore($selectedOffer);
  const activeBuild = useStore($activeBuild);
  const opsBundle = useStore($activeProjectOps);

  const econ = project?.metadata?.economics;
  const currency = offer?.metadata?.currency ?? econ?.currency ?? '₹';

  const [horizon, setHorizon] = useState<OpsHorizon>('3_months');
  const [monthlyRevenueTarget, setMonthlyRevenueTarget] = useState<string>('');
  const [activeCustomersTarget, setActiveCustomersTarget] =
    useState<string>('');
  const [repeatRateTargetPercent, setRepeatRateTargetPercent] =
    useState<string>('30');
  const [maxWeeklyHours, setMaxWeeklyHours] = useState<string>('');
  const [q1Focus, setQ1Focus] = useState<string>('');
  const [q2Focus, setQ2Focus] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existingGoal = opsBundle.activeGoal;
    const content = opsBundle.goalContent;

    if (existingGoal?.horizon) {
      setHorizon(existingGoal.horizon);
    }

    if (content) {
      setMonthlyRevenueTarget(String(content.monthlyRevenueTarget || ''));
      setActiveCustomersTarget(String(content.activeCustomersTarget || ''));
      setRepeatRateTargetPercent(
        String(content.repeatRateTargetPercent ?? 30),
      );
      setMaxWeeklyHours(String(content.maxWeeklyHours || ''));
      setQ1Focus(content.q1Focus || '');
      setQ2Focus(content.q2Focus || '');
    } else if (econ) {
      setMonthlyRevenueTarget(String(econ.targetMonthlyIncome || ''));
      setActiveCustomersTarget(String(econ.unitsForIncomeGoal || ''));
      setMaxWeeklyHours(String(econ.availableWeeklyHours || 15));
    }
  }, [opsBundle.activeGoal, opsBundle.goalContent, econ]);

  async function handleSaveGoals(e: React.FormEvent) {
    e.preventDefault();
    if (!project || saving) return;

    const rev = Number(monthlyRevenueTarget) || 0;
    const cust = Number(activeCustomersTarget) || 0;
    if (rev <= 0 || cust <= 0) {
      setError('Set a realistic monthly revenue and active customer target.');
      return;
    }
    if (!q1Focus.trim()) {
      setError('Write your #1 focus for Quarter 1.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const goalsPayload: OpsGoalContent = {
        monthlyRevenueTarget: rev,
        activeCustomersTarget: cust,
        repeatRateTargetPercent: Math.min(
          100,
          Math.max(0, Number(repeatRateTargetPercent) || 0),
        ),
        maxWeeklyHours: Math.max(1, Number(maxWeeklyHours) || 15),
        q1Focus: q1Focus.trim(),
        ...(horizon === '6_months' && q2Focus.trim()
          ? { q2Focus: q2Focus.trim() }
          : {}),
      };

      const saved = await saveOpsGoals({
        projectId: project.id,
        buildId: activeBuild?.id ?? null,
        horizon,
        goals: goalsPayload,
      });

      opsActions.upsertOp(saved);

      await onComplete({
        completed: true,
        horizon,
        monthlyRevenueTarget: rev,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save operating goals.',
      );
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Target className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Quest 1 · Operating Targets
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSaveGoals(e)}
        className="max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6"
      >
        {/* Horizon Selector */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">
            1. Operating Window
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [
                  '3_months',
                  '3 Months (1 Quarter)',
                  'Best for validating repeatability and hitting steady monthly cash flow.',
                ],
                [
                  '6_months',
                  '6 Months (2 Quarters)',
                  'Best for building retention loops and scaling a proven channel.',
                ],
              ] as const
            ).map(([key, label, desc]) => (
              <button
                key={key}
                type="button"
                onClick={() => setHorizon(key)}
                className={`rounded-xl border p-4 text-left transition ${
                  horizon === key
                    ? 'border-primary bg-primary/[0.05] ring-2 ring-primary/20'
                    : 'border-border bg-background hover:border-primary/40'
                }`}
              >
                <p className="font-bold text-foreground">{label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Numeric Targets */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-foreground">
              Monthly Net Revenue Target ({currency})
            </label>
            <input
              type="number"
              min={1}
              value={monthlyRevenueTarget}
              onChange={(e) => setMonthlyRevenueTarget(e.target.value)}
              placeholder="e.g. 50000"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-base font-bold"
            />
            {econ?.targetMonthlyIncome ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                M4 income goal: {currency}
                {econ.targetMonthlyIncome.toLocaleString()}/mo
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
              Active Paying Customers / Month
            </label>
            <input
              type="number"
              min={1}
              value={activeCustomersTarget}
              onChange={(e) => setActiveCustomersTarget(e.target.value)}
              placeholder="e.g. 15"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-base font-bold"
            />
            {econ?.unitsForIncomeGoal ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                M4 volume target: {econ.unitsForIncomeGoal} sales/mo
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
              Repeat / Renewal Rate Target (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={repeatRateTargetPercent}
              onChange={(e) => setRepeatRateTargetPercent(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-base font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
              Max Weekly Founder Hours
            </label>
            <input
              type="number"
              min={1}
              value={maxWeeklyHours}
              onChange={(e) => setMaxWeeklyHours(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-base font-bold"
            />
          </div>
        </div>

        {/* Quarterly Focus */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Quarter 1 Primary Focus (Months 1–3)
            </label>
            <SpeechTextarea
              rows={2}
              value={q1Focus}
              onChange={(e) => setQ1Focus(e.target.value)}
              placeholder="e.g. Convert warm leads into 15 recurring clients while keeping delivery under 3 hrs/client."
              className="text-sm leading-6"
            />
          </div>

          {horizon === '6_months' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Quarter 2 Primary Focus (Months 4–6)
              </label>
              <SpeechTextarea
                rows={2}
                value={q2Focus}
                onChange={(e) => setQ2Focus(e.target.value)}
                placeholder="e.g. Launch referral loop and expand into adjacent cloud kitchen segment."
                className="text-sm leading-6"
              />
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

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="h-12 rounded-full px-8 text-base"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving targets…
              </>
            ) : (
              <>
                Lock targets &amp; set up data feeds
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}