'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { AlertCircle, ArrowRight, Check, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  $activeProject,
  $selectedOffer,
  projectsActions,
} from '@/lib/stores/projects';
import {
  fetchMission4ContextSummary,
  updateUserProjectMetadata,
  upsertUserProjectOffer,
} from '@/actions/projects';
import {
  createUserExperiments,
  fetchExperimentBlueprints,
  fetchUserExperiments,
} from '@/actions/experiments';
import { userExperimentsActions } from '@/lib/stores/experiments';
import type {
  Mission4ContextSummary,
  PaymentModel,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

const PAYMENT_MODELS: Array<{
  key: PaymentModel;
  label: string;
  desc: string;
}> = [
  {
    key: 'upfront',
    label: '100% Upfront',
    desc: 'Customer pays in full before you start or ship.',
  },
  {
    key: 'deposit_balance',
    label: 'Deposit + Balance',
    desc: '50% upfront to lock the spot, remainder on completion.',
  },
  {
    key: 'subscription',
    label: 'Recurring Subscription',
    desc: 'Billed monthly or per cycle automatically.',
  },
  {
    key: 'pay_on_delivery',
    label: 'Pay on Delivery / Completion',
    desc: 'Paid when the order arrives or session finishes.',
  },
];

export function PriceLockAction({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [paymentModel, setPaymentModel] = useState<PaymentModel>('upfront');
  const [queueDryRun, setQueueDryRun] = useState(false);

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
        const offer = data.selectedOffer ?? selectedOffer;

        if (proj) projectsActions.upsertProject(proj);
        if (offer) projectsActions.upsertOffer(offer);

        const econ = proj?.metadata?.economics;
        if (econ) {
          setFinalPrice(econ.pricePerUnit);
          if (econ.uncertainNotes) setQueueDryRun(true);
          if (econ.paymentModel) {
            setPaymentModel(econ.paymentModel);
          } else if (offer?.metadata?.payment_model) {
            setPaymentModel(offer.metadata.payment_model);
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
  const offer = context?.selectedOffer ?? selectedOffer;
  const econ = project?.metadata?.economics;
  const currency = econ?.currency ?? '₹';

  async function handleLock() {
    if (saving || !project || !offer) return;
    if (finalPrice <= 0) {
      setError('Enter a starting price greater than 0.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Save locked price & payment model to user_project_offers
      const { offer: savedOffer } = await upsertUserProjectOffer({
        offerId: offer.id,
        projectId: project.id,
        title: offer.title,
        metadata: {
          ...offer.metadata,
          price_point: finalPrice,
          currency,
          payment_model: paymentModel,
        },
      });
      projectsActions.upsertOffer(savedOffer);

      // 2. Sync locked price & payment model to user_projects.metadata.economics
      if (econ) {
        const margin = finalPrice - econ.directCostPerUnit - econ.cacPerUnit;
        const marginPct =
          finalPrice > 0 ? Math.round((margin / finalPrice) * 100) : 0;
        const breakEven =
          margin > 0 ? Math.ceil(econ.monthlyFixedCosts / margin) : 0;
        const setupPayback =
          margin > 0 ? Math.ceil(econ.oneTimeSetupCosts / margin) : 0;
        const unitsForIncome =
          margin > 0
            ? Math.ceil(
                (econ.monthlyFixedCosts + econ.targetMonthlyIncome) / margin,
              )
            : 0;
        const weeklyHours =
          unitsForIncome > 0 && econ.hoursPerUnit > 0
            ? Number(((unitsForIncome * econ.hoursPerUnit) / 4.33).toFixed(1))
            : 0;

        const updatedProj = await updateUserProjectMetadata(project.id, {
          economics: {
            ...econ,
            pricePerUnit: finalPrice,
            marginPerUnit: margin,
            marginPercent: marginPct,
            breakEvenUnitsPerMonth: breakEven,
            setupPaybackUnits: setupPayback,
            unitsForIncomeGoal: unitsForIncome,
            weeklyHoursAtIncomeGoal: weeklyHours,
            paymentModel,
          },
        });
        projectsActions.upsertProject(updatedProj);
      }

      // 3. Optionally queue delivery_cost_dry_run in user_experiments
      if (queueDryRun) {
        const [bps, existingRuns] = await Promise.all([
          fetchExperimentBlueprints({ category: 'build' }),
          fetchUserExperiments({
            missionKey: 'mission-4',
            projectId: project.id,
          }),
        ]);

        const alreadyQueued = existingRuns.some(
          (r) =>
            r.experiment_key === 'delivery_cost_dry_run' &&
            r.status !== 'parked',
        );

        const dryRunBp = bps.find((b) => b.key === 'delivery_cost_dry_run');
        if (dryRunBp && !alreadyQueued) {
          const created = await createUserExperiments([
            {
              experimentId: dryRunBp.id,
              experimentKey: dryRunBp.key,
              projectId: project.id,
              opportunityId: project.opportunity_id,
              missionKey: 'mission-4',
              sourceNodeKey: nodeKey,
              title: dryRunBp.name,
              setup: {
                pitch: {
                  direction: offer.promise ?? offer.title,
                },
                notes: econ?.uncertainNotes,
              },
              threshold: {
                targets: {
                  sample_orders_completed: { target: 1, direction: 'at_least' },
                  ...(econ?.hoursPerUnit
                    ? {
                        actual_hours_spent: {
                          target: econ.hoursPerUnit,
                          direction: 'at_most',
                        },
                      }
                    : {}),
                },
                timeframe_days: 3,
              },
              status: 'draft',
            },
          ]);
          userExperimentsActions.upsertMany(created);
        }
      }

      await onComplete({
        completed: true,
        priceLocked: finalPrice,
        paymentModel,
        dryRunQueued: queueDryRun,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not lock price & model.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your price settings…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Lock className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Lock Price &amp; Terms
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
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Locked v1 Starting Price ({currency})
          </label>
          <input
            type="number"
            min={1}
            value={finalPrice || ''}
            onChange={(e) => setFinalPrice(Number(e.target.value) || 0)}
            disabled={saving}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-lg font-bold sm:w-56"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-foreground">
            How will cash move?
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {PAYMENT_MODELS.map((opt) => {
              const isSelected = paymentModel === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setPaymentModel(opt.key)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                      : 'border-border bg-background hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {opt.label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {opt.desc}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={queueDryRun}
              onChange={(e) => setQueueDryRun(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary"
            />
            <div className="space-y-1 text-sm">
              <p className="font-bold text-foreground">
                Queue a 1-Order Delivery &amp; Cost Dry Run
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                {econ?.uncertainNotes
                  ? `${econ.uncertainNotes}. Keep this checked so you verify real supplier quotes or delivery hours alongside your traction test.`
                  : 'Optional: run 1 sample order or get real vendor quotes before taking paying customers.'}
              </p>
            </div>
          </label>
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
          onClick={() => void handleLock()}
          disabled={saving || finalPrice <= 0}
          className="h-12 rounded-full px-8 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Locking price…
            </>
          ) : (
            <>
              Lock price &amp; test reaching new buyers
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}