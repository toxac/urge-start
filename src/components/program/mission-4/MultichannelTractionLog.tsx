'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Quote,
  Rocket,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import {
  $activeProject,
  $selectedOffer,
  projectsActions,
} from '@/lib/stores/projects';
import { userExperimentsActions } from '@/lib/stores/experiments';
import { fetchMission4ContextSummary } from '@/actions/projects';
import {
  createUserExperiments,
  fetchExperimentBlueprints,
  fetchUserExperiments,
  launchUserExperiment,
  logUserExperimentResults,
} from '@/actions/experiments';
import type {
  ChannelBreakdownEntry,
  ExperimentQuoteEntry,
  ExperimentWarmLead,
  UserExperiment,
} from '@/lib/types/experiments';
import type { Mission4ContextSummary } from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function MultichannelTractionLog({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [offerExp, setOfferExp] = useState<UserExperiment | null>(null);
  const [dryRunExp, setDryRunExp] = useState<UserExperiment | null>(null);

  const [targetCommitted, setTargetCommitted] = useState<string>('3');
  const [channelRows, setChannelRows] = useState<
    Record<string, ChannelBreakdownEntry>
  >({});
  const [payingLeads, setPayingLeads] = useState<ExperimentWarmLead[]>([]);
  const [quotes, setQuotes] = useState<ExperimentQuoteEntry[]>([]);
  const [notes, setNotes] = useState('');

  // Dry-run fields (if queued in Quest 2)
  const [dryRunOrders, setDryRunOrders] = useState<string>('0');
  const [dryRunHours, setDryRunHours] = useState<string>('0');
  const [dryRunNotes, setDryRunNotes] = useState<string>('');

  // Draft inputs for adding a buyer or objection quote
  const [leadName, setLeadName] = useState('');
  const [leadContact, setLeadContact] = useState('');
  const [leadChannel, setLeadChannel] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [quoteSource, setQuoteSource] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

        const [bps, m4Runs] = await Promise.all([
          fetchExperimentBlueprints({ missionKey: 'mission-4' }),
          fetchUserExperiments({ missionKey: 'mission-4', projectId: proj.id }),
        ]);

        if (!alive) return;
        userExperimentsActions.hydrate(m4Runs);

        // Find or auto-create the multi-channel offer experiment
        let mainRun =
          m4Runs.find(
            (r) =>
              (r.experiment_key === 'new_channel_offer_drop' ||
                r.experiment_key === 'priced_offer_outreach') &&
              r.status !== 'parked' &&
              r.status !== 'iterated',
          ) ?? null;

        const drafts = proj.metadata?.offerCommunication?.channelDrafts ?? [];
        const selectedKeys =
          proj.metadata?.offerCommunication?.selectedChannels ?? [
            'direct_outreach',
          ];

        if (!mainRun) {
          const bpKey =
            selectedKeys.length === 1 && selectedKeys[0] === 'direct_outreach'
              ? 'priced_offer_outreach'
              : 'new_channel_offer_drop';
          const bp = bps.find((b) => b.key === bpKey) ?? bps[0];

          const [created] = await createUserExperiments([
            {
              experimentId: bp?.id ?? null,
              experimentKey: bp?.key ?? bpKey,
              projectId: proj.id,
              opportunityId: proj.opportunity_id,
              missionKey: 'mission-4',
              sourceNodeKey: nodeKey,
              title: `Multi-Channel Offer Test: ${offer?.title ?? proj.title}`,
              setup: {
                channels: selectedKeys,
                pitch: {
                  direction: offer?.promise ?? proj.title,
                  ask: offer?.ask ?? '',
                },
              },
              threshold: {
                targets: {
                  qualified_inquiries: { target: 3, direction: 'at_least' },
                },
                timeframe_days: 5,
              },
              status: 'live',
            },
          ]);
          mainRun = created;
          userExperimentsActions.upsert(created);
        } else if (mainRun.status === 'draft' || mainRun.status === 'ready') {
          mainRun = await launchUserExperiment(mainRun.id);
          userExperimentsActions.upsert(mainRun);
        }

        setOfferExp(mainRun);

        const savedTarget =
          mainRun.threshold?.targets?.qualified_inquiries?.target ??
          mainRun.threshold?.targets?.offers_accepted?.target ??
          3;
        setTargetCommitted(String(savedTarget));

        // Build per-channel rows
        const existingBreakdown = mainRun.results?.channel_breakdown ?? {};
        const initialRows: Record<string, ChannelBreakdownEntry> = {};

        for (const key of selectedKeys) {
          const draftLabel =
            drafts.find((d) => d.channel === key)?.channelLabel ??
            key.replace(/_/g, ' ');
          initialRows[key] = existingBreakdown[key] ?? {
            channel: key,
            channelLabel: draftLabel,
            reached: 0,
            engaged: 0,
            inquiries: 0,
            committed: 0,
          };
        }
        setChannelRows(initialRows);

        setPayingLeads(mainRun.results?.warm_leads ?? []);
        setQuotes(mainRun.results?.quotes ?? []);
        setNotes(mainRun.results?.notes ?? '');

        // Check if a delivery_cost_dry_run was queued in Quest 2
        const dryRun =
          m4Runs.find(
            (r) =>
              r.experiment_key === 'delivery_cost_dry_run' &&
              r.status !== 'parked',
          ) ?? null;
        if (dryRun) {
          setDryRunExp(dryRun);
          setDryRunOrders(
            String(dryRun.results?.values?.sample_orders_completed ?? 0),
          );
          setDryRunHours(
            String(dryRun.results?.values?.actual_hours_spent ?? 0),
          );
          setDryRunNotes(dryRun.results?.notes ?? '');
        }
      } catch (err) {
        if (alive) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load traction experiment.',
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

  function updateChannelMetric(
    channelKey: string,
    field: 'reached' | 'engaged' | 'inquiries' | 'committed',
    raw: string,
  ) {
    const val = Math.max(0, Number(raw) || 0);
    setChannelRows((prev) => ({
      ...prev,
      [channelKey]: {
        ...prev[channelKey],
        [field]: val,
      },
    }));
  }

  function handleAddLead() {
    if (!leadName.trim()) return;
    const entry: ExperimentWarmLead = {
      id: `buyer_${Date.now()}`,
      name: leadName.trim(),
      contact: leadContact.trim(),
      action_taken: leadChannel.trim()
        ? `Accepted priced offer (${leadChannel.trim()})`
        : 'Accepted priced v1 offer',
      logged_at: new Date().toISOString(),
    };
    setPayingLeads((prev) => [...prev, entry]);
    setLeadName('');
    setLeadContact('');
    setLeadChannel('');
  }

  function handleAddQuote() {
    if (!quoteText.trim()) return;
    const entry: ExperimentQuoteEntry = {
      id: `obj_${Date.now()}`,
      quote: quoteText.trim(),
      ...(quoteSource.trim() ? { person_name: quoteSource.trim() } : {}),
      logged_at: new Date().toISOString(),
    };
    setQuotes((prev) => [...prev, entry]);
    setQuoteText('');
    setQuoteSource('');
  }

  async function persistResults() {
    if (!offerExp) return;

    const allRows = Object.values(channelRows);
    const totalReached = allRows.reduce((s, r) => s + r.reached, 0);
    const totalEngaged = allRows.reduce((s, r) => s + r.engaged, 0);
    const totalInquiries = allRows.reduce((s, r) => s + r.inquiries, 0);
    const totalCommitted = allRows.reduce((s, r) => s + r.committed, 0);

    const updatedMain = await logUserExperimentResults(offerExp.id, {
      values: {
        prospects_reached: totalReached,
        engaged_count: totalEngaged,
        qualified_inquiries: totalInquiries,
        offers_accepted: totalCommitted,
      },
      channel_breakdown: channelRows,
      warm_leads: payingLeads,
      quotes,
      notes: notes.trim() || undefined,
    });
    userExperimentsActions.upsert(updatedMain);
    setOfferExp(updatedMain);

    if (dryRunExp) {
      const updatedDry = await logUserExperimentResults(dryRunExp.id, {
        values: {
          sample_orders_completed: Math.max(0, Number(dryRunOrders) || 0),
          actual_hours_spent: Math.max(0, Number(dryRunHours) || 0),
        },
        notes: dryRunNotes.trim() || undefined,
      });
      userExperimentsActions.upsert(updatedDry);
      setDryRunExp(updatedDry);
    }
  }

  async function handleSaveForNow() {
    if (savingDraft || submitting) return;
    setSavingDraft(true);
    setSavedBanner(false);
    setError(null);
    try {
      await persistResults();
      setSavedBanner(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save progress.',
      );
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleAnalyzeResults() {
    if (submitting || savingDraft) return;
    setSubmitting(true);
    setError(null);
    try {
      await persistResults();
      await onComplete({
        completed: true,
        targetCommitted: Number(targetCommitted) || 3,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save traction results.',
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your multi-channel traction tracker…
      </div>
    );
  }

  const rowsList = Object.values(channelRows);

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Rocket className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Live Offer Test · Multi-Channel Log
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Target Bar */}
      <div className="flex max-w-3xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-sm font-bold text-foreground">
            Your success bar across all channels
          </p>
          <p className="text-xs text-muted-foreground">
            How many serious buyer commitments or deposits tell you this offer
            and price work?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">At least</span>
          <input
            type="number"
            min={1}
            value={targetCommitted}
            onChange={(e) => setTargetCommitted(e.target.value)}
            className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-bold"
          />
          <span className="text-xs font-semibold text-foreground">buyers</span>
        </div>
      </div>

      {/* 1. Channel-by-Channel Traction Table */}
      <div className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-bold text-foreground">
          1. Log traction &amp; conversion per channel
        </h2>

        <div className="space-y-4">
          {rowsList.map((row) => (
            <div
              key={row.channel}
              className="space-y-3 rounded-xl border border-border bg-muted/20 p-4"
            >
              <p className="font-bold text-foreground">{row.channelLabel}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground">
                    Reached / Views
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={row.reached || ''}
                    onChange={(e) =>
                      updateChannelMetric(row.channel, 'reached', e.target.value)
                    }
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground">
                    Clicks / Replies
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={row.engaged || ''}
                    onChange={(e) =>
                      updateChannelMetric(row.channel, 'engaged', e.target.value)
                    }
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground">
                    Signups / Inquiries
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={row.inquiries || ''}
                    onChange={(e) =>
                      updateChannelMetric(
                        row.channel,
                        'inquiries',
                        e.target.value,
                      )
                    }
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-primary">
                    Ready to Pay / Booked
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={row.committed || ''}
                    onChange={(e) =>
                      updateChannelMetric(
                        row.channel,
                        'committed',
                        e.target.value,
                      )
                    }
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-primary/50 bg-background px-3 py-1.5 text-sm font-bold"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Committed Buyers / Leads */}
      <div className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">
            2. People who said yes to your priced offer ({payingLeads.length})
          </h2>
        </div>

        {payingLeads.length > 0 && (
          <div className="space-y-2">
            {payingLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-2.5 text-sm"
              >
                <div>
                  <span className="font-semibold text-foreground">
                    {lead.name}
                  </span>
                  {lead.contact && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({lead.contact})
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {lead.action_taken}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPayingLeads((prev) =>
                      prev.filter((l) => l.id !== lead.id),
                    )
                  }
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-3">
          <input
            type="text"
            value={leadName}
            onChange={(e) => setLeadName(e.target.value)}
            placeholder="Buyer name"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={leadContact}
            onChange={(e) => setLeadContact(e.target.value)}
            placeholder="Phone, email, or handle"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={leadChannel}
              onChange={(e) => setLeadChannel(e.target.value)}
              placeholder="Which channel? (e.g. WhatsApp)"
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddLead}
              disabled={!leadName.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Objections & Real Feedback */}
      <div className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Quote className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">
            3. Objections, price reactions, or questions people raised
          </h2>
        </div>

        {quotes.length > 0 && (
          <div className="space-y-2">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 px-4 py-2.5 text-sm"
              >
                <div>
                  <p className="text-foreground">&ldquo;{q.quote}&rdquo;</p>
                  {q.person_name && (
                    <p className="text-xs text-muted-foreground">
                      — {q.person_name}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQuotes((prev) => prev.filter((x) => x.id !== q.id))
                  }
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            placeholder="e.g. 'Price is fine, can we start next Monday?'"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={quoteSource}
            onChange={(e) => setQuoteSource(e.target.value)}
            placeholder="Channel or name"
            className="sm:w-40 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddQuote}
            disabled={!quoteText.trim()}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>

        <SpeechTextarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any other observations across channels..."
          className="text-sm leading-6"
        />
      </div>

      {/* Optional Dry Run Card (if queued in Quest 2) */}
      {dryRunExp && (
        <div className="max-w-3xl space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.03] p-6">
          <h2 className="text-base font-bold text-foreground">
            4. Delivery &amp; Cost Dry Run (queued in Quest 2)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold">
                Sample deliveries or real quotes verified
              </label>
              <input
                type="number"
                min={0}
                value={dryRunOrders}
                onChange={(e) => setDryRunOrders(e.target.value)}
                className="mt-1 w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold">
                Actual hours spent per order
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={dryRunHours}
                onChange={(e) => setDryRunHours(e.target.value)}
                className="mt-1 w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-bold"
              />
            </div>
          </div>
          <input
            type="text"
            value={dryRunNotes}
            onChange={(e) => setDryRunNotes(e.target.value)}
            placeholder="What did you learn about actual delivery cost or time?"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm"
          />
        </div>
      )}

      {savedBanner && (
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
          <Check className="h-4 w-4" />
          Progress saved. Add more responses anytime over the next few days.
        </p>
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

      <div className="flex max-w-3xl flex-wrap items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleSaveForNow()}
          disabled={savingDraft || submitting}
          className="h-12 rounded-full px-6 text-base"
        >
          {savingDraft ? 'Saving…' : 'Save progress for now'}
        </Button>

        <Button
          type="button"
          onClick={() => void handleAnalyzeResults()}
          disabled={submitting || savingDraft}
          className="h-12 rounded-full px-8 text-base"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              Analyze cross-channel results
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}