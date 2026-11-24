'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  $activeProject,
  $selectedOffer,
  projectsActions,
} from '@/lib/stores/projects';
import {
  fetchMission4ContextSummary,
  updateUserProjectMetadata,
} from '@/actions/projects';
import { fetchUserExperiments } from '@/actions/experiments';
import { analyzeMultiChannelTraction } from '@/actions/responses/mission4';
import type { ChannelBreakdownEntry } from '@/lib/types/experiments';
import type {
  Mission4ContextSummary,
  TractionAnalysisResult,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function TractionAnalysisReveal({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [breakdown, setBreakdown] = useState<ChannelBreakdownEntry[]>([]);
  const [analysis, setAnalysis] = useState<TractionAnalysisResult | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const data = await fetchMission4ContextSummary();
        if (!alive) return;
        setContext(data);

        const proj = data.project ?? activeProject;
        const offer = data.selectedOffer ?? selectedOffer;
        if (proj) projectsActions.upsertProject(proj);
        if (offer) projectsActions.upsertOffer(offer);

        if (!proj) {
          setLoading(false);
          return;
        }

        const m4Runs = await fetchUserExperiments({
          missionKey: 'mission-4',
          projectId: proj.id,
        });
        if (!alive) return;

        const mainRun = m4Runs.find(
          (r) =>
            (r.experiment_key === 'new_channel_offer_drop' ||
              r.experiment_key === 'priced_offer_outreach') &&
            r.status !== 'parked' &&
            r.status !== 'iterated',
        );

        const rows = Object.values(mainRun?.results?.channel_breakdown ?? {});
        setBreakdown(rows);

        if (proj.metadata?.tractionAnalysis) {
          setAnalysis(proj.metadata.tractionAnalysis);
          setLoading(false);
          return;
        }

        const econ = proj.metadata?.economics;
        const currency = offer?.metadata?.currency ?? econ?.currency ?? '₹';
        const price = offer?.metadata?.price_point ?? econ?.pricePerUnit ?? 0;

        const dryRun = m4Runs.find(
          (r) => r.experiment_key === 'delivery_cost_dry_run',
        );

        const aiRead = await analyzeMultiChannelTraction({
          projectTitle: proj.title,
          offerTitle: offer?.title ?? proj.title,
          priceLabel: `${currency}${price.toLocaleString()}`,
          channelBreakdown: rows,
          objectionsAndQuotes: (mainRun?.results?.quotes ?? []).map(
            (q) => q.quote,
          ),
          notes: mainRun?.results?.notes ?? '',
          dryRunSummary: dryRun?.results?.notes,
          nodeKey,
          regenerate: false,
        });

        if (!alive) return;
        setAnalysis(aiRead);
        const updatedProj = await updateUserProjectMetadata(proj.id, {
          tractionAnalysis: aiRead,
        });
        projectsActions.upsertProject(updatedProj);
      } catch (err) {
        if (alive) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load traction analysis.',
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
  const offer = context?.selectedOffer ?? selectedOffer;

  async function handleRegenerate() {
    if (regenerating || !project) return;
    setRegenerating(true);
    setError(null);
    try {
      const m4Runs = await fetchUserExperiments({
        missionKey: 'mission-4',
        projectId: project.id,
      });
      const mainRun = m4Runs.find(
        (r) =>
          (r.experiment_key === 'new_channel_offer_drop' ||
            r.experiment_key === 'priced_offer_outreach') &&
          r.status !== 'parked' &&
          r.status !== 'iterated',
      );
      const econ = project.metadata?.economics;
      const currency = offer?.metadata?.currency ?? econ?.currency ?? '₹';
      const price = offer?.metadata?.price_point ?? econ?.pricePerUnit ?? 0;

      const aiRead = await analyzeMultiChannelTraction({
        projectTitle: project.title,
        offerTitle: offer?.title ?? project.title,
        priceLabel: `${currency}${price.toLocaleString()}`,
        channelBreakdown: breakdown,
        objectionsAndQuotes: (mainRun?.results?.quotes ?? []).map(
          (q) => q.quote,
        ),
        notes: mainRun?.results?.notes ?? '',
        nodeKey,
        regenerate: true,
      });
      setAnalysis(aiRead);
      const updatedProj = await updateUserProjectMetadata(project.id, {
        tractionAnalysis: aiRead,
      });
      projectsActions.upsertProject(updatedProj);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not refresh analysis.',
      );
    } finally {
      setRegenerating(false);
    }
  }

  async function handleContinue() {
    if (continuing) return;
    setContinuing(true);
    try {
      await onComplete({ completed: true });
    } finally {
      setContinuing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Comparing channel conversion and offer reactions…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Traction Analysis
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleRegenerate()}
            disabled={regenerating}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`}
            />
            Refresh analysis
          </Button>
        </div>

        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Side-by-Side Channel Scoreboard */}
      {breakdown.length > 0 && (
        <div className="max-w-3xl overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Channel</th>
                <th className="px-4 py-3 font-semibold">Reached</th>
                <th className="px-4 py-3 font-semibold">Engaged</th>
                <th className="px-4 py-3 font-semibold">Inquiries</th>
                <th className="px-4 py-3 font-semibold text-primary">
                  Ready to Pay
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {breakdown.map((row) => (
                <tr key={row.channel}>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {row.channelLabel}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.reached}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.engaged}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.inquiries}
                  </td>
                  <td className="px-4 py-3 font-bold text-primary">
                    {row.committed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Signal Breakdown */}
      {analysis && (
        <div className="max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6 text-sm">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <h2 className="text-base font-bold text-foreground">
              What the numbers &amp; replies tell you
            </h2>
          </div>

          <div>
            <p className="font-semibold text-foreground">1. What it shows</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              {analysis.shows}
            </p>
          </div>

          <div className="border-t border-border/60 pt-4">
            <p className="font-semibold text-foreground">
              2. Winning channel signal
            </p>
            <p className="mt-1 leading-6 text-muted-foreground">
              {analysis.channelWinner}
            </p>
          </div>

          <div className="border-t border-border/60 pt-4">
            <p className="font-semibold text-foreground">
              3. Price &amp; scope friction
            </p>
            <p className="mt-1 leading-6 text-muted-foreground">
              {analysis.priceAndScopeFriction}
            </p>
          </div>

          <div className="border-t border-border/60 pt-4">
            <p className="font-semibold text-foreground">
              4. What is still unclear
            </p>
            <p className="mt-1 leading-6 text-muted-foreground">
              {analysis.unclear}
            </p>
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
          disabled={continuing}
          className="h-12 rounded-full px-8 text-base"
        >
          {continuing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Continuing…
            </>
          ) : (
            <>
              Finalize offer &amp; winning channel
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}