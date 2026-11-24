'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  Sparkles,
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
import { generateAndStressTestChannelCopy } from '@/actions/responses/mission4';
import { TRACTION_CHANNEL_OPTIONS } from './OfferCommunication';
import type {
  ChannelCopyDraft,
  Mission4ContextSummary,
  PersonaCopyFeedback,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function PersonaCopyTest({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [drafts, setDrafts] = useState<ChannelCopyDraft[]>([]);
  const [feedback, setFeedback] = useState<PersonaCopyFeedback[]>([]);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

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
        const offer = data.selectedOffer ?? selectedOffer;

        if (proj) projectsActions.upsertProject(proj);
        if (offer) projectsActions.upsertOffer(offer);

        const comm = proj?.metadata?.offerCommunication;
        const selectedKeys = comm?.selectedChannels ?? ['direct_outreach'];

        if (
          Array.isArray(comm?.channelDrafts) &&
          comm.channelDrafts.length > 0 &&
          Array.isArray(comm?.personaFeedback) &&
          comm.personaFeedback.length > 0
        ) {
          setDrafts(comm.channelDrafts);
          setFeedback(comm.personaFeedback);
          setLoading(false);
          return;
        }

        if (proj && offer) {
          const econ = proj.metadata?.economics;
          const currency =
            offer.metadata?.currency ?? econ?.currency ?? '₹';
          const price =
            offer.metadata?.price_point ?? econ?.pricePerUnit ?? 0;

          const channels = selectedKeys.map((key) => {
            const found = TRACTION_CHANNEL_OPTIONS.find((o) => o.key === key);
            return { key, label: found?.label ?? key };
          });

          const generated = await generateAndStressTestChannelCopy({
            projectTitle: proj.title,
            offerTitle: offer.title,
            offerPromise: offer.promise ?? '',
            includedSummary: offer.metadata?.included_summary ?? '',
            excludedSummary: offer.metadata?.excluded_summary ?? '',
            priceLabel: `${currency}${price.toLocaleString()}`,
            paymentModel: offer.metadata?.payment_model ?? 'upfront',
            buyingStep: offer.ask ?? 'Reply to claim an early spot',
            coreAngle: comm?.coreAngle ?? offer.promise ?? '',
            channels,
            personas: proj.metadata?.personas ?? [],
            nodeKey,
            regenerate: false,
          });

          if (!alive) return;
          setDrafts(generated.channelDrafts);
          setFeedback(generated.personaFeedback);
        }
      } catch (err) {
        if (alive) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not generate channel copy.',
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
    if (regenerating || !project || !offer) return;
    setRegenerating(true);
    setError(null);

    try {
      const comm = project.metadata?.offerCommunication;
      const selectedKeys = comm?.selectedChannels ?? ['direct_outreach'];
      const econ = project.metadata?.economics;
      const currency = offer.metadata?.currency ?? econ?.currency ?? '₹';
      const price = offer.metadata?.price_point ?? econ?.pricePerUnit ?? 0;

      const channels = selectedKeys.map((key) => {
        const found = TRACTION_CHANNEL_OPTIONS.find((o) => o.key === key);
        return { key, label: found?.label ?? key };
      });

      const generated = await generateAndStressTestChannelCopy({
        projectTitle: project.title,
        offerTitle: offer.title,
        offerPromise: offer.promise ?? '',
        includedSummary: offer.metadata?.included_summary ?? '',
        excludedSummary: offer.metadata?.excluded_summary ?? '',
        priceLabel: `${currency}${price.toLocaleString()}`,
        paymentModel: offer.metadata?.payment_model ?? 'upfront',
        buyingStep: offer.ask ?? 'Reply to claim an early spot',
        coreAngle: comm?.coreAngle ?? offer.promise ?? '',
        channels,
        personas: project.metadata?.personas ?? [],
        nodeKey,
        regenerate: true,
      });

      setDrafts(generated.channelDrafts);
      setFeedback(generated.personaFeedback);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not regenerate copy.',
      );
    } finally {
      setRegenerating(false);
    }
  }

  async function handleCopyDraft(draft: ChannelCopyDraft) {
    const fullText = [draft.headlineOrHook, draft.messageBody, draft.ctaStep]
      .filter(Boolean)
      .join('\n\n');
    await navigator.clipboard.writeText(fullText);
    setCopiedChannel(draft.channel);
    setTimeout(
      () =>
        setCopiedChannel((curr) => (curr === draft.channel ? null : curr)),
      2000,
    );
  }

  async function handleSaveAndContinue() {
    if (saving || !project) return;
    setSaving(true);
    setError(null);

    try {
      const existingComm = project.metadata?.offerCommunication;
      const updated = await updateUserProjectMetadata(project.id, {
        offerCommunication: {
          coreAngle: existingComm?.coreAngle ?? '',
          selectedChannels:
            existingComm?.selectedChannels ??
            drafts.map((d) => d.channel),
          channelDrafts: drafts,
          personaFeedback: feedback,
        },
      });
      projectsActions.upsertProject(updated);

      await onComplete({
        completed: true,
        channelsPrepared: drafts.length,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save channel copy.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Drafting channel copy and testing against your personas…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Persona Copy Stress-Test
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleRegenerate()}
            disabled={regenerating || saving}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`}
            />
            Regenerate drafts
          </Button>
        </div>

        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* 1. Persona Stress-Test Feedback */}
      {feedback.length > 0 && (
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-bold">
              How your customer personas react to this offer &amp; price
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {feedback.map((item, idx) => (
              <div
                key={idx}
                className="space-y-3 rounded-2xl border border-border bg-card p-5 text-sm"
              >
                <p className="font-bold text-foreground">{item.personaName}</p>
                <p className="leading-6 text-muted-foreground">
                  &ldquo;{item.reaction}&rdquo;
                </p>
                <div className="rounded-xl bg-amber-500/[0.06] p-3 text-xs">
                  <p className="flex items-center gap-1 font-semibold text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Likely hesitation
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {item.frictionPoint}
                  </p>
                </div>
                <p className="text-xs text-emerald-700">
                  <strong>Quick fix:</strong> {item.suggestedFix}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Editable Per-Channel Copy Drafts */}
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-bold">
            Edit your copy for each channel before launching
          </h2>
        </div>

        {drafts.map((draft, idx) => (
          <div
            key={draft.channel}
            className="space-y-4 rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-foreground">
                {draft.channelLabel}
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleCopyDraft(draft)}
              >
                {copiedChannel === draft.channel ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy message
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Headline / Opening Hook
              </label>
              <input
                type="text"
                value={draft.headlineOrHook}
                onChange={(e) =>
                  setDrafts((prev) =>
                    prev.map((d, i) =>
                      i === idx ? { ...d, headlineOrHook: e.target.value } : d,
                    ),
                  )
                }
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Offer &amp; Price Body
              </label>
              <textarea
                rows={4}
                value={draft.messageBody}
                onChange={(e) =>
                  setDrafts((prev) =>
                    prev.map((d, i) =>
                      i === idx ? { ...d, messageBody: e.target.value } : d,
                    ),
                  )
                }
                className="w-full rounded-xl border border-border bg-background p-3.5 text-sm leading-6"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Buying / Booking Call-to-Action
              </label>
              <input
                type="text"
                value={draft.ctaStep}
                onChange={(e) =>
                  setDrafts((prev) =>
                    prev.map((d, i) =>
                      i === idx ? { ...d, ctaStep: e.target.value } : d,
                    ),
                  )
                }
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm"
              />
            </div>
          </div>
        ))}
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
              Launch &amp; log your offer test
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}