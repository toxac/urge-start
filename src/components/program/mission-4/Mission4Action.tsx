'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Plus,
  Trash2,
  Wrench,
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
import { saveUserTasks } from '@/actions/tasks';
import { TRACTION_CHANNEL_OPTIONS } from './OfferCommunication';
import type {
  Mission4ContextSummary,
  MspBuildRequirement,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

const TRACK_LABELS: Array<{
  key: MspBuildRequirement['category'];
  title: string;
  helper: string;
}> = [
  {
    key: 'product_req',
    title: '1. Product & Delivery Requirements',
    helper: 'Only what is strictly needed to deliver your v1 promise.',
  },
  {
    key: 'marketing_pipeline',
    title: '2. Marketing Pipeline',
    helper: 'Your winning channel setup and warm-lead follow-up steps.',
  },
  {
    key: 'branding_trust',
    title: '3. Branding & Trust Assets',
    helper: 'Offer page, flyer, or profile copy with clear proof.',
  },
  {
    key: 'payment_ops',
    title: '4. Payment & Onboarding Operations',
    helper: 'How buyers pay you and how you kick off fulfillment.',
  },
];

export function Mission4Action({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const selectedOffer = useStore($selectedOffer);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [items, setItems] = useState<MspBuildRequirement[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] =
    useState<MspBuildRequirement['category']>('product_req');

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

        if (
          Array.isArray(proj?.metadata?.mspRequirements) &&
          proj.metadata.mspRequirements.length > 0
        ) {
          setItems(proj.metadata.mspRequirements);
          setLoading(false);
          return;
        }

        // Seed practical v1 build requirements from M4 decisions
        const seeded: MspBuildRequirement[] = [];

        const mustHaves = (proj?.metadata?.features ?? [])
          .filter((f) => f.bucket === 'must_have')
          .map((f) => f.label);

        if (mustHaves.length > 0) {
          mustHaves.forEach((feat, i) => {
            seeded.push({
              id: `req_prod_${i + 1}`,
              title: `Build / set up v1 deliverable: ${feat}`,
              category: 'product_req',
              done: false,
            });
          });
        } else if (offer?.metadata?.included_summary) {
          seeded.push({
            id: 'req_prod_1',
            title: `Set up v1 core deliverable: ${offer.metadata.included_summary}`,
            category: 'product_req',
            done: false,
          });
        }

        const winChannels =
          proj?.metadata?.winningChannels ??
          proj?.metadata?.offerCommunication?.selectedChannels ??
          [];
        winChannels.forEach((chKey, idx) => {
          const label =
            TRACTION_CHANNEL_OPTIONS.find((o) => o.key === chKey)?.label ??
            chKey;
          seeded.push({
            id: `req_mkt_${idx + 1}`,
            title: `Set up repeatable lead flow on ${label}`,
            category: 'marketing_pipeline',
            done: false,
          });
        });

        if (data.m3WarmLeads.length > 0) {
          seeded.push({
            id: 'req_mkt_warm',
            title: `Follow up with your ${data.m3WarmLeads.length} warm leads from Mission 3 with the finalized v1 offer`,
            category: 'marketing_pipeline',
            done: false,
          });
        }

        seeded.push({
          id: 'req_brand_1',
          title: `Publish clean offer sheet / page for "${offer?.title ?? proj?.title ?? 'v1 Offer'}" with buyer quotes`,
          category: 'branding_trust',
          done: false,
        });

        const payModel = (
          offer?.metadata?.payment_model ??
          proj?.metadata?.economics?.paymentModel ??
          'upfront'
        ).replace(/_/g, ' ');
        const currency =
          offer?.metadata?.currency ??
          proj?.metadata?.economics?.currency ??
          '₹';
        const price =
          offer?.metadata?.price_point ??
          proj?.metadata?.economics?.pricePerUnit ??
          0;

        seeded.push({
          id: 'req_pay_1',
          title: `Set up ${payModel} payment link or invoice for ${currency}${price.toLocaleString()}`,
          category: 'payment_ops',
          done: false,
        });

        setItems(seeded);
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

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: `req_${Date.now()}`,
        title: newTitle.trim(),
        category: newCategory,
        done: false,
      },
    ]);
    setNewTitle('');
    setError(null);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleFinishMission4() {
    if (saving || !project) return;
    if (items.length === 0) {
      setError('Keep at least one concrete requirement to carry into Mission 5.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatedProj = await updateUserProjectMetadata(project.id, {
        mspRequirements: items,
      });
      projectsActions.upsertProject(updatedProj);

      // Sync actionable build items to user_tasks for Mission 5 execution
      await saveUserTasks(
        items.slice(0, 8).map((item) => ({
          title: item.title,
          task_type: 'practice',
          source_node_key: nodeKey,
          description: `Mission 5 v1 Build Requirement (${item.category.replace(/_/g, ' ')})`,
        })),
      );

      await onComplete({
        completed: true,
        projectId: project.id,
        mspRequirementsCount: items.length,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not lock your Mission 5 build requirements.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Preparing your Mission 5 build checklist…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Wrench className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Finalized Build Plan · Handoff to Mission 5
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Add Custom Requirement */}
      <form
        onSubmit={handleAddItem}
        className="max-w-3xl space-y-3 rounded-2xl border border-border bg-card p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Add a specific build or setup requirement
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Set up Razorpay payment link + automated WhatsApp receipt"
            className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-sm"
          />
          <select
            value={newCategory}
            onChange={(e) =>
              setNewCategory(e.target.value as MspBuildRequirement['category'])
            }
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="product_req">Product Requirement</option>
            <option value="marketing_pipeline">Marketing Pipeline</option>
            <option value="branding_trust">Branding &amp; Trust</option>
            <option value="payment_ops">Payment &amp; Ops</option>
          </select>
          <Button type="submit" disabled={!newTitle.trim()}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </form>

      {/* Four Grouped Tracks */}
      <div className="max-w-3xl space-y-6">
        {TRACK_LABELS.map((track) => {
          const trackItems = items.filter((i) => i.category === track.key);
          return (
            <div
              key={track.key}
              className="space-y-3 rounded-2xl border border-border bg-card p-6"
            >
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {track.title} ({trackItems.length})
                </h2>
                <p className="text-xs text-muted-foreground">{track.helper}</p>
              </div>

              {trackItems.length === 0 ? (
                <p className="rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">
                  No items in this track yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {trackItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-2.5 text-sm"
                    >
                      <span className="text-foreground">{item.title}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove requirement"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
          onClick={() => void handleFinishMission4()}
          disabled={saving}
          className="h-12 rounded-full px-8 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Locking build plan…
            </>
          ) : (
            <>
              Finish Mission 4 &amp; Enter Mission 5
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}