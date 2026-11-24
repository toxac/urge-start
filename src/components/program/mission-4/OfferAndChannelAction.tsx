'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { AlertCircle, ArrowRight, Check, Loader2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
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
  fetchUserExperiments,
  saveUserExperimentReflection,
} from '@/actions/experiments';
import { TRACTION_CHANNEL_OPTIONS } from './OfferCommunication';
import type {
  Mission4ContextSummary,
  TractionChannelKey,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function OfferAndChannelAction({
  node,
  onComplete,
}: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [finalTitle, setFinalTitle] = useState('');
  const [finalPromise, setFinalPromise] = useState('');
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [winningChannels, setWinningChannels] = useState<TractionChannelKey[]>(
    [],
  );
  const [decisionNote, setDecisionNote] = useState('');

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

        setFinalTitle(offer?.title ?? proj?.title ?? '');
        setFinalPromise(offer?.promise ?? '');
        setFinalPrice(
          offer?.metadata?.price_point ??
            proj?.metadata?.economics?.pricePerUnit ??
            0,
        );

        const tested =
          proj?.metadata?.winningChannels ??
          proj?.metadata?.offerCommunication?.selectedChannels ??
          ['direct_outreach'];
        setWinningChannels(tested);

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
  const currency = offer?.metadata?.currency ?? econ?.currency ?? '₹';

  function toggleWinningChannel(key: TractionChannelKey) {
    setWinningChannels((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
    setError(null);
  }

  async function handleFinalize() {
    if (saving || !project || !offer) return;
    if (!finalTitle.trim() || !finalPromise.trim()) {
      setError('Confirm your final offer title and promise.');
      return;
    }
    if (winningChannels.length === 0) {
      setError('Select at least one winning channel to build around.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Update offer with finalized wording and price
      const { offer: savedOffer } = await upsertUserProjectOffer({
        offerId: offer.id,
        projectId: project.id,
        title: finalTitle.trim(),
        promise: finalPromise.trim(),
        metadata: {
          ...offer.metadata,
          price_point: finalPrice,
        },
      });
      projectsActions.upsertOffer(savedOffer);

      // 2. Save winning channels & sync price to project metadata
      const updatedProj = await updateUserProjectMetadata(project.id, {
        winningChannels,
        ...(econ
          ? {
              economics: {
                ...econ,
                pricePerUnit: finalPrice,
                marginPerUnit:
                  finalPrice - econ.directCostPerUnit - econ.cacPerUnit,
              },
            }
          : {}),
      });
      projectsActions.upsertProject(updatedProj);

      // 3. Mark Mission 4 experiments completed
      const m4Runs = await fetchUserExperiments({
        missionKey: 'mission-4',
        projectId: project.id,
      });
      await Promise.all(
        m4Runs
          .filter((r) => r.status !== 'parked' && r.status !== 'iterated')
          .map((r) =>
            saveUserExperimentReflection(
              r.id,
              {
                ...r.reflection,
                next_step: 'proceed',
                decision_reason: decisionNote.trim() || undefined,
              },
              { markCompleted: true },
            ),
          ),
      );

      await onComplete({
        completed: true,
        winningChannels,
        finalPrice,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not finalize offer and channel.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your final offer and channel options…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Trophy className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Final Offer &amp; Winning Channel
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* 1. Pick Winning Channel(s) */}
      <div className="max-w-3xl space-y-3">
        <h2 className="text-base font-bold text-foreground">
          1. Which channel(s) worked best or deserve focus in Mission 5?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {TRACTION_CHANNEL_OPTIONS.map((opt) => {
            const isSelected = winningChannels.includes(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleWinningChannel(opt.key)}
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">
                    {opt.label}
                  </p>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Final Offer Adjustments */}
      <div className="max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-bold text-foreground">
          2. Finalize your v1 offer &amp; starting price after market feedback
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground">
              Final v1 Offer Name
            </label>
            <input
              type="text"
              value={finalTitle}
              onChange={(e) => setFinalTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Final Starting Price ({currency})
            </label>
            <input
              type="number"
              min={1}
              value={finalPrice || ''}
              onChange={(e) => setFinalPrice(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Final v1 Promise
          </label>
          <SpeechTextarea
            rows={2}
            value={finalPromise}
            onChange={(e) => setFinalPromise(e.target.value)}
            className="text-sm leading-6"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Key takeaway from your offer test (optional)
          </label>
          <SpeechTextarea
            rows={2}
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            placeholder="e.g. Direct WhatsApp outreach converted 3x better than cold social posts..."
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
          onClick={() => void handleFinalize()}
          disabled={saving}
          className="h-12 rounded-full px-8 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finalizing…
            </>
          ) : (
            <>
              Generate your One-Page Working Plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}