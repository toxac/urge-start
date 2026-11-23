'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { AlertCircle, ArrowRight, Check, Loader2, Package } from 'lucide-react';
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
import type {
  BusinessType,
  Mission4ContextSummary,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

const BUSINESS_TYPE_OPTIONS: Array<{
  key: BusinessType;
  label: string;
  description: string;
}> = [
  {
    key: 'saas_digital',
    label: 'Software / Digital Product',
    description: 'App, SaaS, digital tool, or online platform.',
  },
  {
    key: 'local_service',
    label: 'Local Service / Brick-and-Mortar',
    description: 'Physical venue, local shop, clinic, or in-person business.',
  },
  {
    key: 'online_shop',
    label: 'Online Shop (Physical Goods)',
    description: 'Selling physical products shipped or delivered to buyers.',
  },
  {
    key: 'side_hustle',
    label: 'Service / Consulting / Coaching',
    description: 'Done-for-you service, freelance work, or paid teaching.',
  },
];

function inferBusinessTypeFromApproach(approachType: unknown): BusinessType {
  if (approachType === 'tool' || approachType === 'connect') {
    return 'saas_digital';
  }
  if (approachType === 'teach') {
    return 'side_hustle';
  }
  return 'side_hustle';
}

export function OfferLockAction({ node, onComplete }: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [businessType, setBusinessType] =
    useState<BusinessType>('side_hustle');
  const [title, setTitle] = useState('');
  const [promise, setPromise] = useState('');
  const [includedSummary, setIncludedSummary] = useState('');
  const [excludedSummary, setExcludedSummary] = useState('');
  const [hook, setHook] = useState('');
  const [ask, setAsk] = useState('');

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
        const draft = proj?.metadata?.offerAssessment?.suggestedOffer;

        if (proj) {
          projectsActions.upsertProject(proj);
          const approachType =
            proj.metadata?.opportunity_snapshot?.approach?.type;
          setBusinessType(
            proj.metadata?.businessType ??
              inferBusinessTypeFromApproach(approachType),
          );
        }

        if (offer) {
          projectsActions.upsertOffer(offer);
        }

        setTitle(offer?.title || draft?.title || '');
        setPromise(offer?.promise || draft?.promise || '');
        setIncludedSummary(
          offer?.metadata?.included_summary || draft?.includedSummary || '',
        );
        setExcludedSummary(
          offer?.metadata?.excluded_summary || draft?.excludedSummary || '',
        );
        setHook(offer?.hook || draft?.hook || '');
        setAsk(offer?.ask || draft?.ask || '');

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
  const existingOffer = context?.selectedOffer ?? selectedOffer;

  async function handleLockOffer() {
    if (saving || !project) return;
    if (!title.trim() || !promise.trim() || !includedSummary.trim()) {
      setError(
        'Please fill in the offer name, core promise, and what is included in v1.',
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const features = project.metadata?.features ?? [];
      const mustHaves = features
        .filter((f) => f.bucket === 'must_have')
        .map((f) => f.label);
      const cutList = features
        .filter((f) => f.bucket === 'cut_for_later')
        .map((f) => f.label);

      const { offer: savedOffer, project: updatedProj } =
        await upsertUserProjectOffer({
          offerId: existingOffer?.id ?? null,
          projectId: project.id,
          title: title.trim(),
          promise: promise.trim(),
          description: `Included in v1: ${includedSummary.trim()}\nExcluded from v1: ${excludedSummary.trim() || 'None listed'}`,
          hook: hook.trim() || null,
          ask: ask.trim() || null,
          metadata: {
            pains_removed: project.metadata?.painsRemoved ?? [],
            gains_created: project.metadata?.gainsCreated ?? [],
            must_have_features: mustHaves,
            cut_features: cutList,
            included_summary: includedSummary.trim(),
            excluded_summary: excludedSummary.trim(),
          },
          setAsSelected: true,
        });

      const finalProject = await updateUserProjectMetadata(
        (updatedProj ?? project).id,
        { businessType },
      );

      projectsActions.upsertOffer(savedOffer);
      projectsActions.upsertProject(finalProject);

      await onComplete({
        completed: true,
        offerId: savedOffer.id,
        businessType,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your v1 offer.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your v1 offer…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Package className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Lock v1 Offer
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Business Form Selector (tailors Quest 2 math sheet) */}
      <div className="max-w-3xl space-y-3">
        <h2 className="text-base font-bold text-foreground">
          1. Which form best fits how this business operates?
        </h2>
        <p className="text-xs text-muted-foreground">
          This determines which simple math template you&apos;ll get in the next
          step.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUSINESS_TYPE_OPTIONS.map((opt) => {
            const isSelected = businessType === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setBusinessType(opt.key)}
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {opt.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {opt.description}
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

      {/* Concrete v1 Offer Card */}
      <div className="max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-bold text-foreground">
          2. Your Minimum Sellable Offer (v1)
        </h2>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Offer name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
            placeholder="e.g. 2-Minute Daily Stock Check-In (Founding Cafe Pilot)"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Core promise (what result the customer gets &amp; how fast)
          </label>
          <SpeechTextarea
            rows={2}
            value={promise}
            onChange={(e) => setPromise(e.target.value)}
            disabled={saving}
            className="text-sm leading-6"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-700">
              What IS included in v1
            </label>
            <SpeechTextarea
              rows={3}
              value={includedSummary}
              onChange={(e) => setIncludedSummary(e.target.value)}
              disabled={saving}
              className="text-sm leading-6"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              What is NOT included in v1
            </label>
            <SpeechTextarea
              rows={3}
              value={excludedSummary}
              onChange={(e) => setExcludedSummary(e.target.value)}
              disabled={saving}
              className="text-sm leading-6"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Why choose this over what they do today?
          </label>
          <SpeechTextarea
            rows={2}
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            disabled={saving}
            className="text-sm leading-6"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Concrete buying or booking step
          </label>
          <input
            type="text"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            disabled={saving}
            placeholder="e.g. Reply 'YES' to reserve 1 of 5 founding spots for next week"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
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
          onClick={() => void handleLockOffer()}
          disabled={saving}
          className="h-12 rounded-full px-8 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Locking offer…
            </>
          ) : (
            <>
              Lock v1 offer &amp; check the math
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}