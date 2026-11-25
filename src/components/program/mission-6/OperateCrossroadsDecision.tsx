'use client';

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Compass,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import {
  $activeProject,
  $selectedOffer,
  projectsActions,
} from '@/lib/stores/projects';
import { $activeProjectOps, $opsMetricsSummary } from '@/lib/stores/ops';
import { updateUserProjectMetadata } from '@/actions/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export type CrossroadsChoice =
  | 'keep_steady'
  | 'scale_up'
  | 'pivot'
  | 'close_cleanly';

const CROSSROADS_OPTIONS: Array<{
  key: CrossroadsChoice;
  title: string;
  subtitle: string;
}> = [
  {
    key: 'keep_steady',
    title: 'Keep Running Steady',
    subtitle:
      'Unit economics and hours are healthy. Keep serving customers sustainably, join Urge bi-monthly standups, and refine steadily.',
  },
  {
    key: 'scale_up',
    title: 'Scale Up What Works',
    subtitle:
      'Acquisition and delivery are repeatable. Invest in your #1 channel, tighten SOPs, or build v2.0 in the Build Workspace.',
  },
  {
    key: 'pivot',
    title: 'Pivot to a New Offer or Segment',
    subtitle:
      'The market signal pointed to a stronger customer group or adjacent pain. Carry what you learned into a new offer test.',
  },
  {
    key: 'close_cleanly',
    title: 'Close Cleanly & Share Lessons',
    subtitle:
      'Margins or demand did not justify continuing. Wrap up customer commitments cleanly and share your experience with the Urge community.',
  },
];

export function OperateCrossroadsDecision({
  node,
  onComplete,
}: NodeComponentProps) {
  const project = useStore($activeProject);
  const offer = useStore($selectedOffer);
  const opsBundle = useStore($activeProjectOps);
  const metrics = useStore($opsMetricsSummary);

  const existingDecision = project?.metadata?.crossroadsDecision as
    | { choice?: CrossroadsChoice; reason?: string }
    | undefined;

  const [choice, setChoice] = useState<CrossroadsChoice>(
    existingDecision?.choice ?? 'keep_steady',
  );
  const [reason, setReason] = useState<string>(existingDecision?.reason ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency =
    offer?.metadata?.currency ??
    project?.metadata?.economics?.currency ??
    '₹';

  const effectiveHourlyRate =
    metrics.totalHoursSpent > 0
      ? Math.round(metrics.netProfit / metrics.totalHoursSpent)
      : 0;

  async function handleSaveDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!project || saving) return;
    if (!reason.trim()) {
      setError(
        'Write a short note explaining why this path makes sense given your real numbers.',
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateUserProjectMetadata(project.id, {
        crossroadsDecision: {
          choice,
          reason: reason.trim(),
          decidedAt: new Date().toISOString(),
        },
      });
      projectsActions.upsertProject(updated);

      await onComplete({
        completed: true,
        crossroadsChoice: choice,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your decision.',
      );
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Compass className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Quest 3 · Strategic Crossroads
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Honest Operating Evidence Strip */}
      <div className="grid max-w-3xl gap-3 rounded-2xl border border-border bg-muted/30 p-5 sm:grid-cols-4 text-xs">
        <div>
          <p className="text-muted-foreground">Net Revenue</p>
          <p className="mt-1 text-base font-bold text-foreground">
            {currency}
            {metrics.netRevenue.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Net Profit</p>
          <p className="mt-1 text-base font-bold text-emerald-700">
            {currency}
            {metrics.netProfit.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Effective Hourly Pay</p>
          <p className="mt-1 text-base font-bold text-foreground">
            {currency}
            {effectiveHourlyRate.toLocaleString()}/hr
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Repeat Rate</p>
          <p className="mt-1 text-base font-bold text-primary">
            {metrics.repeatRatePercent}% (Goal:{' '}
            {opsBundle.goalContent?.repeatRateTargetPercent ?? 30}%)
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSaveDecision(e)}
        className="max-w-3xl space-y-6"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {CROSSROADS_OPTIONS.map((opt) => {
            const isSelected = choice === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setChoice(opt.key)}
                className={`rounded-2xl border p-5 text-left transition ${
                  isSelected
                    ? 'border-primary bg-primary/[0.05] ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-foreground">{opt.title}</p>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {opt.subtitle}
                </p>
              </button>
            );
          })}
        </div>

        <div className="space-y-2 rounded-2xl border border-border bg-card p-6">
          <label className="text-sm font-bold text-foreground">
            Why is this the right move based on what you observed?
          </label>
          <SpeechTextarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Summarize the real numbers, customer behavior, or time realities driving your decision..."
            className="text-sm leading-6"
          />
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
                Saving decision…
              </>
            ) : (
              <>
                Generate your Operating Scorecard
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}