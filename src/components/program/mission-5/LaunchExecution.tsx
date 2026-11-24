'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  DollarSign,
  Loader2,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import {
  $activeBuild,
  $activeProject,
  $selectedOffer,
  projectsActions,
} from '@/lib/stores/projects';
import {
  fetchMission4ContextSummary,
  updateProjectBuild,
} from '@/actions/projects';
import { TRACTION_CHANNEL_OPTIONS } from '@/components/program/mission-4/OfferCommunication';
import type { Mission4ContextSummary } from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function LaunchExecution({ node, onComplete }: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);
  const activeBuild = useStore($activeBuild);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [checkedFixes, setCheckedFixes] = useState<Record<string, boolean>>({});
  const [launchInquiries, setLaunchInquiries] = useState<string>('0');
  const [launchCustomers, setLaunchCustomers] = useState<string>('0');
  const [launchRevenue, setLaunchRevenue] = useState<string>('0');
  const [launchNotes, setLaunchNotes] = useState<string>('');

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
        const build = data.activeBuild ?? activeBuild;
        if (proj) projectsActions.upsertProject(proj);
        if (build) projectsActions.upsertBuild(build);

        const existingLaunch = build?.launch_summary;
        if (existingLaunch && existingLaunch.launchedAt) {
          setLaunchInquiries(String(existingLaunch.launchInquiries ?? 0));
          setLaunchCustomers(String(existingLaunch.launchCustomers ?? 0));
          setLaunchRevenue(String(existingLaunch.launchRevenue ?? 0));
          setLaunchNotes(existingLaunch.launchNotes ?? '');
          const map: Record<string, boolean> = {};
          for (const f of existingLaunch.fixesCompleted ?? []) {
            map[f] = true;
          }
          setCheckedFixes(map);
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
  const build = context?.activeBuild ?? activeBuild;
  const econ = project?.metadata?.economics;
  const currency = offer?.metadata?.currency ?? econ?.currency ?? '₹';

  const mustFixList = build?.alpha_summary?.mustFixBeforeLaunch ?? [];
  const winChannels = (
    project?.metadata?.winningChannels ??
    project?.metadata?.offerCommunication?.selectedChannels ??
    []
  ).map(
    (k) => TRACTION_CHANNEL_OPTIONS.find((o) => o.key === k)?.label ?? k,
  );

  function toggleFix(item: string) {
    setCheckedFixes((prev) => ({ ...prev, [item]: !prev[item] }));
  }

  async function handleCompleteLaunch() {
    if (saving || !project) return;
    setSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const completedFixes = mustFixList.filter((item) => checkedFixes[item]);

      if (build) {
        const updatedBuild = await updateProjectBuild(build.id, {
          status: 'launched',
          launchedAt: now,
          launchSummary: {
            launchedAt: now,
            fixesCompleted: completedFixes,
            launchInquiries: Math.max(0, Number(launchInquiries) || 0),
            launchCustomers: Math.max(0, Number(launchCustomers) || 0),
            launchRevenue: Math.max(0, Number(launchRevenue) || 0),
            launchNotes: launchNotes.trim() || undefined,
          },
        });
        projectsActions.upsertBuild(updatedBuild);
      }

      await onComplete({
        completed: true,
        buildId: build?.id ?? null,
        launchCustomers: Number(launchCustomers) || 0,
        launchRevenue: Number(launchRevenue) || 0,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save launch results.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Preparing your launch checklist…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Rocket className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Quest 3 · Public Launch ({build?.version_label ?? 'v1.0'})
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* 1. Alpha Fixes & Go-Live Channels */}
      <div className="max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-foreground">
            1. Pre-launch readiness
          </h2>
          <p className="text-xs text-muted-foreground">
            Winning launch channel(s):{' '}
            <strong className="text-foreground">
              {winChannels.join(' + ') || 'Direct outreach'}
            </strong>
          </p>
        </div>

        {mustFixList.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Alpha fixes to check off before going live
            </p>
            {mustFixList.map((fix) => {
              const checked = Boolean(checkedFixes[fix]);
              return (
                <button
                  key={fix}
                  type="button"
                  onClick={() => toggleFix(fix)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3.5 text-left text-sm"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      checked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border'
                    }`}
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span
                    className={
                      checked
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    }
                  >
                    {fix}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Initial Public Launch Log */}
      <div className="max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-bold text-foreground">
          2. Log your first public launch numbers
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-foreground">
              Launch inquiries / signups
            </label>
            <input
              type="number"
              min={0}
              value={launchInquiries}
              onChange={(e) => setLaunchInquiries(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-base font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary">
              Paying customers
            </label>
            <input
              type="number"
              min={0}
              value={launchCustomers}
              onChange={(e) => setLaunchCustomers(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-primary/50 bg-background px-3.5 py-2 text-base font-bold"
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-foreground">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              <span>Revenue collected ({currency})</span>
            </label>
            <input
              type="number"
              min={0}
              value={launchRevenue}
              onChange={(e) => setLaunchRevenue(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-base font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            What happened when you launched?
          </label>
          <SpeechTextarea
            rows={3}
            value={launchNotes}
            onChange={(e) => setLaunchNotes(e.target.value)}
            placeholder="Record where your first paying orders came from and what needs attention next..."
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
          onClick={() => void handleCompleteLaunch()}
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
              Review your launch milestone
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}