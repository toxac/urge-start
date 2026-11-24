'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
  Megaphone,
} from 'lucide-react';
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
} from '@/actions/projects';
import type {
  Mission4ContextSummary,
  TractionChannelKey,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export const TRACTION_CHANNEL_OPTIONS: Array<{
  key: TractionChannelKey;
  label: string;
  description: string;
}> = [
  {
    key: 'direct_outreach',
    label: '1-on-1 WhatsApp, Email, or DM',
    description:
      'Send your priced v1 offer directly to warm leads from Mission 3 and targeted prospects.',
  },
  {
    key: 'landing_page',
    label: 'Simple Web / Landing Page',
    description:
      'A focused one-page offer with your v1 scope, price, and a booking or pre-order button.',
  },
  {
    key: 'social_post',
    label: 'Social Media Post or Short Video',
    description:
      'Share the problem, your v1 solution, and starting price on LinkedIn, Instagram, X, or YouTube.',
  },
  {
    key: 'community_drop',
    label: 'Niche Group or Forum Drop',
    description:
      'Post an honest founding-member offer inside a relevant Reddit, Facebook, Slack, or WhatsApp group.',
  },
  {
    key: 'local_flyer',
    label: 'Local Flyer, Poster, or Walk-In',
    description:
      'Put a physical flyer with a QR/WhatsApp booking step where local buyers already visit.',
  },
];

export function OfferCommunication({ node, onComplete }: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [coreAngle, setCoreAngle] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<
    TractionChannelKey[]
  >(['direct_outreach', 'landing_page']);

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

        const savedComm = proj?.metadata?.offerCommunication;
        if (savedComm?.coreAngle) {
          setCoreAngle(savedComm.coreAngle);
        } else if (offer?.promise) {
          setCoreAngle(
            `${offer.promise}${offer.hook ? ` — ${offer.hook}` : ''}`,
          );
        }

        if (
          Array.isArray(savedComm?.selectedChannels) &&
          savedComm.selectedChannels.length > 0
        ) {
          setSelectedChannels(savedComm.selectedChannels);
        } else if (proj?.metadata?.businessType === 'local_service') {
          setSelectedChannels(['direct_outreach', 'local_flyer']);
        } else if (proj?.metadata?.businessType === 'online_shop') {
          setSelectedChannels(['landing_page', 'social_post']);
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
  const price = offer?.metadata?.price_point ?? econ?.pricePerUnit ?? 0;

  function toggleChannel(key: TractionChannelKey) {
    setSelectedChannels((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
    setError(null);
  }

  async function handleSaveAndContinue() {
    if (saving || !project) return;
    if (!coreAngle.trim()) {
      setError('Write the core message you want every channel to communicate.');
      return;
    }
    if (selectedChannels.length === 0) {
      setError('Pick at least one channel to test your offer on.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const existingComm = project.metadata?.offerCommunication;
      const updated = await updateUserProjectMetadata(project.id, {
        offerCommunication: {
          ...existingComm,
          coreAngle: coreAngle.trim(),
          selectedChannels,
        },
      });
      projectsActions.upsertProject(updated);

      await onComplete({
        completed: true,
        selectedChannels,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save your communication setup.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your locked offer and price…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Megaphone className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Quest 3 · Multi-Channel Offer Test
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Locked Offer & Price Snapshot */}
      {offer && (
        <div className="max-w-3xl space-y-2 rounded-2xl border border-border bg-muted/30 p-5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-foreground">{offer.title}</p>
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
              {currency}
              {price.toLocaleString()} ·{' '}
              {(offer.metadata?.payment_model ?? 'upfront').replace(/_/g, ' ')}
            </span>
          </div>
          {offer.promise && (
            <p className="text-muted-foreground">{offer.promise}</p>
          )}
        </div>
      )}

      {/* 1. Core Angle */}
      <div className="max-w-3xl space-y-2">
        <label className="text-base font-bold text-foreground">
          1. What is the single clearest takeaway every buyer should get?
        </label>
        <p className="text-sm text-muted-foreground">
          Combine the headache you remove, what they get in v1, and why the
          price is worth it.
        </p>
        <SpeechTextarea
          rows={3}
          value={coreAngle}
          onChange={(e) => {
            setCoreAngle(e.target.value);
            setError(null);
          }}
          disabled={saving}
          className="text-base leading-7"
        />
      </div>

      {/* 2. Multi-Channel Selection */}
      <div className="max-w-3xl space-y-3">
        <div>
          <h2 className="text-base font-bold text-foreground">
            2. Select all the channels where you will test this offer
          </h2>
          <p className="text-xs text-muted-foreground">
            Testing 2 or 3 channels side by side shows whether slow responses
            come from the offer itself or from a single channel.
          </p>
        </div>

        <div className="space-y-3">
          {TRACTION_CHANNEL_OPTIONS.map((opt) => {
            const isSelected = selectedChannels.includes(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleChannel(opt.key)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">{opt.label}</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                  <div
                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </button>
            );
          })}
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
          onClick={() => void handleSaveAndContinue()}
          disabled={saving || selectedChannels.length === 0}
          className="h-12 rounded-full px-8 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Draft copy &amp; test against personas
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}