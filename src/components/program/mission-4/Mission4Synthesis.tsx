'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Printer,
  ShieldAlert,
  Users,
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
import { TRACTION_CHANNEL_OPTIONS } from './OfferCommunication';
import type { ChannelBreakdownEntry } from '@/lib/types/experiments';
import type { Mission4ContextSummary } from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function Mission4Synthesis({ node, onComplete }: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [channelBreakdown, setChannelBreakdown] = useState<
    ChannelBreakdownEntry[]
  >([]);
  const [newPayingLeadsCount, setNewPayingLeadsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);

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

        if (proj) {
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

          if (mainRun?.results?.channel_breakdown) {
            setChannelBreakdown(
              Object.values(mainRun.results.channel_breakdown),
            );
          }
          setNewPayingLeadsCount(mainRun?.results?.warm_leads?.length ?? 0);
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
  const econ = project?.metadata?.economics;
  const personas = project?.metadata?.personas ?? [];
  const features = project?.metadata?.features ?? [];
  const mustHaves = features
    .filter((f) => f.bucket === 'must_have')
    .map((f) => f.label);
  const cutItems = features
    .filter((f) => f.bucket === 'cut_for_later')
    .map((f) => f.label);

  const currency = offer?.metadata?.currency ?? econ?.currency ?? '₹';
  const price = offer?.metadata?.price_point ?? econ?.pricePerUnit ?? 0;
  const paymentModel = (
    offer?.metadata?.payment_model ??
    econ?.paymentModel ??
    'upfront'
  ).replace(/_/g, ' ');

  const winningChannelLabels = useMemo(() => {
    const keys =
      project?.metadata?.winningChannels ??
      project?.metadata?.offerCommunication?.selectedChannels ??
      [];
    return keys.map(
      (k) => TRACTION_CHANNEL_OPTIONS.find((o) => o.key === k)?.label ?? k,
    );
  }, [project]);

  const totalLeadsPipeline =
    (context?.m3WarmLeads.length ?? 0) + newPayingLeadsCount;

  const bestDraft = useMemo(() => {
    const drafts = project?.metadata?.offerCommunication?.channelDrafts ?? [];
    const winKeys = project?.metadata?.winningChannels ?? [];
    return drafts.find((d) => winKeys.includes(d.channel)) ?? drafts[0] ?? null;
  }, [project]);

  function buildMarkdownPlan(): string {
    const lines: string[] = [
      `# Working Business Plan: ${project?.title ?? 'My Business'}`,
      ``,
      `## 1. The Problem & Target Customer`,
      `- **Confirmed Problem:** ${context?.m3ProblemStatement || project?.description || '—'}`,
      ...personas.map(
        (p) =>
          `- **Persona (${p.name}):** ${p.summary} | Core pain: ${p.corePain} | Desired gain: ${p.desiredGain}`,
      ),
      ``,
      `## 2. Marketing 4Ps Blueprint (Minimum Sellable Offer v1)`,
      `### Product (What You Are Selling)`,
      `- **Offer Name:** ${offer?.title ?? '—'}`,
      `- **Core Promise:** ${offer?.promise ?? '—'}`,
      `- **Included in v1:** ${offer?.metadata?.included_summary || mustHaves.join(', ') || '—'}`,
      `- **Explicitly Cut for Later:** ${offer?.metadata?.excluded_summary || cutItems.join(', ') || 'None'}`,
      `- **Why Choose Us:** ${offer?.hook ?? '—'}`,
      ``,
      `### Price & Unit Economics`,
      `- **Starting Price:** ${currency}${price.toLocaleString()} (${paymentModel})`,
      `- **Direct Cost per Sale:** ${currency}${(econ?.directCostPerUnit ?? 0).toLocaleString()} | **Est. Acquisition Cost:** ${currency}${(econ?.cacPerUnit ?? 0).toLocaleString()}`,
      `- **Profit Left per Sale:** ${currency}${(econ?.marginPerUnit ?? 0).toLocaleString()} (${econ?.marginPercent ?? 0}% margin)`,
      `- **Monthly Fixed Burn:** ${currency}${(econ?.monthlyFixedCosts ?? 0).toLocaleString()}/mo | **One-Time Setup:** ${currency}${(econ?.oneTimeSetupCosts ?? 0).toLocaleString()}`,
      `- **Break-Even Volume:** ${econ?.breakEvenUnitsPerMonth ?? 0} sales/month (+${econ?.setupPaybackUnits ?? 0} sales to recover setup)`,
      `- **Income Goal Volume:** ${econ?.unitsForIncomeGoal ?? 0} sales/month (${econ?.weeklyHoursAtIncomeGoal ?? 0} hrs/week required)`,
      ``,
      `### Place (Validated Channels & Pipeline)`,
      `- **Primary Acquisition Channel(s):** ${winningChannelLabels.join(', ') || 'Direct outreach'}`,
      `- **Warm & Committed Buyer Pipeline:** ${totalLeadsPipeline} leads ready for Mission 5`,
      ...channelBreakdown.map(
        (row) =>
          `  - ${row.channelLabel}: ${row.reached} reached → ${row.inquiries} inquiries → ${row.committed} ready to pay`,
      ),
      ``,
      `### Promotion (Message & Buying Action)`,
      `- **Core Angle:** ${project?.metadata?.offerCommunication?.coreAngle || offer?.promise || '—'}`,
      bestDraft
        ? `- **Sample Hook (${bestDraft.channelLabel}):** "${bestDraft.headlineOrHook}"`
        : '',
      `- **Buying / Booking Step:** ${offer?.ask ?? '—'}`,
      ``,
      `## 3. Guardrails & Open Risks`,
      `- **Key Delivery Constraint (M3):** ${context?.m3PlanAroundNote || 'Keep v1 lean and manual first.'}`,
      econ?.uncertainNotes
        ? `- **Cost Estimates to Watch:** ${econ.uncertainNotes}`
        : '',
      project?.metadata?.tractionAnalysis?.unclear
        ? `- **Still to Prove in Mission 5:** ${project.metadata.tractionAnalysis.unclear}`
        : '',
    ];

    return lines.filter(Boolean).join('\n');
  }

  function handleDownloadMarkdown() {
    const md = buildMarkdownPlan();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const slug = (project?.title ?? 'working-business-plan')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    link.download = `${slug}-working-plan.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handlePrintPdf() {
    window.print();
  }

  async function handleContinue() {
    if (continuing) return;
    setContinuing(true);
    try {
      if (project) {
        const updated = await updateUserProjectMetadata(project.id, {
          businessPlanGeneratedAt: new Date().toISOString(),
        });
        projectsActions.upsertProject(updated);
      }
      await onComplete({ completed: true });
    } finally {
      setContinuing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Assembling your One-Page Working Plan…
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header + Export Actions */}
      <div className="flex max-w-4xl flex-wrap items-start justify-between gap-4 print:hidden">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              One-Page Working Business Plan · Marketing 4Ps
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {node.title}
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Everything you proved across Missions 1–4 pulled onto one clean
            reference sheet. Save a copy before locking your Mission 5 build
            plan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadMarkdown}
            className="rounded-full"
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download .md
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintPdf}
            className="rounded-full"
          >
            <Printer className="mr-1.5 h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Printable One-Page Working Blueprint */}
      <div className="max-w-4xl space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8 print:border-0 print:p-0 print:shadow-none">
        {/* Title Banner */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Working Business Blueprint (v1)
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">
              {project?.title ?? 'My Business'}
            </h2>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>
              Model:{' '}
              <strong className="capitalize text-foreground">
                {(project?.metadata?.businessType ?? 'side_hustle').replace(
                  /_/g,
                  ' ',
                )}
              </strong>
            </p>
            <p>
              Warm + Committed Pipeline:{' '}
              <strong className="text-foreground">
                {totalLeadsPipeline} people
              </strong>
            </p>
          </div>
        </div>

        {/* Customer & Problem */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>Who It&apos;s For &amp; The Problem</span>
          </div>
          <p className="rounded-xl bg-muted/40 p-4 text-sm leading-6 text-foreground">
            {context?.m3ProblemStatement || project?.description}
          </p>
          {personas.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {personas.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-border p-3.5 text-xs"
                >
                  <p className="font-bold text-foreground">{p.name}</p>
                  <p className="mt-1 text-muted-foreground">{p.summary}</p>
                  <p className="mt-1.5 text-foreground">
                    <strong>Pain:</strong> {p.corePain}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Marketing 4Ps Grid */}
        <div className="grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
          {/* P1: Product */}
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              1. Product · Minimum Sellable Offer (v1)
            </p>
            <p className="font-bold text-foreground">{offer?.title}</p>
            <p className="text-xs leading-5 text-muted-foreground">
              {offer?.promise}
            </p>
            <div className="pt-1 text-xs">
              <p className="text-foreground">
                <strong>Included:</strong>{' '}
                {offer?.metadata?.included_summary || mustHaves.join(', ')}
              </p>
              <p className="mt-1 text-muted-foreground">
                <strong>Cut for later:</strong>{' '}
                {offer?.metadata?.excluded_summary ||
                  cutItems.join(', ') ||
                  'None'}
              </p>
            </div>
          </div>

          {/* P2: Price */}
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              2. Price &amp; Unit Economics
            </p>
            <p className="text-xl font-bold text-foreground">
              {currency}
              {price.toLocaleString()}{' '}
              <span className="text-xs font-normal capitalize text-muted-foreground">
                ({paymentModel})
              </span>
            </p>
            {econ && (
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>
                  • <strong className="text-foreground">Profit / sale:</strong>{' '}
                  {currency}
                  {econ.marginPerUnit.toLocaleString()} ({econ.marginPercent}%
                  margin)
                </li>
                <li>
                  • <strong className="text-foreground">Fixed bills:</strong>{' '}
                  {currency}
                  {econ.monthlyFixedCosts.toLocaleString()}/mo ·{' '}
                  <strong className="text-foreground">Setup:</strong> {currency}
                  {econ.oneTimeSetupCosts.toLocaleString()}
                </li>
                <li>
                  • <strong className="text-foreground">Break-even:</strong>{' '}
                  {econ.breakEvenUnitsPerMonth} sales/mo (+
                  {econ.setupPaybackUnits} to recover setup)
                </li>
                <li>
                  • <strong className="text-foreground">Income goal:</strong>{' '}
                  {econ.unitsForIncomeGoal} sales/mo (
                  {econ.weeklyHoursAtIncomeGoal} hrs/wk)
                </li>
              </ul>
            )}
          </div>

          {/* P3: Place */}
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              3. Place · Winning Channels &amp; Traction
            </p>
            <p className="font-semibold text-foreground">
              {winningChannelLabels.join(' + ') || 'Direct Outreach'}
            </p>
            {channelBreakdown.length > 0 ? (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {channelBreakdown.map((row) => (
                  <li key={row.channel}>
                    • <strong className="text-foreground">{row.channelLabel}:</strong>{' '}
                    {row.reached} reached → {row.inquiries} inquiries →{' '}
                    <span className="font-semibold text-primary">
                      {row.committed} ready to pay
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                Starting with your {totalLeadsPipeline} warm &amp; committed
                contacts.
              </p>
            )}
          </div>

          {/* P4: Promotion */}
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              4. Promotion · Proven Hook &amp; Call-to-Action
            </p>
            {bestDraft && (
              <p className="text-xs font-semibold text-foreground">
                &ldquo;{bestDraft.headlineOrHook}&rdquo;
              </p>
            )}
            <p className="text-xs leading-5 text-muted-foreground">
              {project?.metadata?.offerCommunication?.coreAngle || offer?.hook}
            </p>
            {offer?.ask && (
              <p className="pt-1 text-xs text-foreground">
                <strong>Next step for buyer:</strong> {offer.ask}
              </p>
            )}
          </div>
        </div>

        {/* Guardrails & Open Assumptions */}
        {(context?.m3PlanAroundNote ||
          econ?.uncertainNotes ||
          project?.metadata?.tractionAnalysis?.unclear) && (
          <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <ShieldAlert className="h-4 w-4" />
              <span>Guardrails &amp; Assumptions to Watch in Mission 5</span>
            </div>
            <ul className="space-y-1 text-muted-foreground">
              {context?.m3PlanAroundNote && (
                <li>
                  • <strong className="text-foreground">Delivery guardrail:</strong>{' '}
                  {context.m3PlanAroundNote}
                </li>
              )}
              {econ?.uncertainNotes && (
                <li>
                  • <strong className="text-foreground">Cost estimates:</strong>{' '}
                  {econ.uncertainNotes}
                </li>
              )}
              {project?.metadata?.tractionAnalysis?.unclear && (
                <li>
                  • <strong className="text-foreground">Still to prove:</strong>{' '}
                  {project.metadata.tractionAnalysis.unclear}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="flex max-w-4xl justify-end pt-2 print:hidden">
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
              Finalize your Mission 5 build checklist
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}