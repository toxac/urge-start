'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
  Scissors,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $activeProject, projectsActions } from '@/lib/stores/projects';
import {
  fetchMission4ContextSummary,
  updateUserProjectMetadata,
} from '@/actions/projects';
import type {
  Mission4ContextSummary,
  MspFeatureItem,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function RuthlessCut({ node, onComplete }: NodeComponentProps) {
  const activeProject = useStore($activeProject);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [features, setFeatures] = useState<MspFeatureItem[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newServes, setNewServes] = useState('');
  const [newBucket, setNewBucket] =
    useState<MspFeatureItem['bucket']>('must_have');

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
        if (proj) {
          projectsActions.upsertProject(proj);
          if (Array.isArray(proj.metadata?.features)) {
            setFeatures(proj.metadata.features);
          }
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
  const painsRemoved = project?.metadata?.painsRemoved ?? [];
  const gainsCreated = project?.metadata?.gainsCreated ?? [];
  const painGainOptions = useMemo(
    () => [
      ...painsRemoved.map((p) => `Pain: ${p}`),
      ...gainsCreated.map((g) => `Gain: ${g}`),
    ],
    [painsRemoved, gainsCreated],
  );

  const mustHaves = features.filter((f) => f.bucket === 'must_have');
  const cutItems = features.filter((f) => f.bucket === 'cut_for_later');

  function handleAddFeature(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const item: MspFeatureItem = {
      id: `feat_${Date.now()}`,
      label: newLabel.trim(),
      bucket: newBucket,
      ...(newServes ? { servesPainOrGain: newServes } : {}),
    };

    setFeatures((prev) => [...prev, item]);
    setNewLabel('');
    setError(null);
  }

  function toggleBucket(id: string) {
    setFeatures((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              bucket:
                item.bucket === 'must_have' ? 'cut_for_later' : 'must_have',
            }
          : item,
      ),
    );
  }

  function removeFeature(id: string) {
    setFeatures((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSaveAndContinue() {
    if (saving || !project) return;
    if (mustHaves.length === 0) {
      setError(
        'Keep at least 1 core deliverable in "Must have to sell (v1)" so you have a concrete offer to test.',
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateUserProjectMetadata(project.id, {
        features,
      });
      projectsActions.upsertProject(updated);

      await onComplete({
        completed: true,
        mustHaveCount: mustHaves.length,
        cutCount: cutItems.length,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your feature cut.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your customer pains and gains…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Scissors className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Minimum Sellable Product
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Anchor Strip: Pains, Gains & M3 Constraint */}
      {(painGainOptions.length > 0 || context?.m3PlanAroundNote) && (
        <div className="max-w-3xl space-y-3 rounded-2xl border border-border bg-muted/30 p-5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Keep every v1 item tied to one of these:
          </p>
          <div className="flex flex-wrap gap-2">
            {painGainOptions.map((pg, idx) => (
              <span
                key={idx}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
              >
                {pg}
              </span>
            ))}
          </div>
          {context?.m3PlanAroundNote && (
            <p className="pt-1 text-xs text-amber-700">
              <strong>Constraint from M3:</strong> {context.m3PlanAroundNote}
            </p>
          )}
        </div>
      )}

      {/* Add Feature / Deliverable Form */}
      <form
        onSubmit={handleAddFeature}
        className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6"
      >
        <h2 className="text-base font-bold text-foreground">
          Add a feature, service step, or deliverable you&apos;re considering
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Daily WhatsApp reorder summary sent at 10 PM"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <select
              value={newServes}
              onChange={(e) => setNewServes(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              <option value="">Which pain or gain does this serve?</option>
              {painGainOptions.map((pg, idx) => (
                <option key={idx} value={pg}>
                  {pg}
                </option>
              ))}
              <option value="Nice-to-have (no direct pain)">
                Nice-to-have (no direct pain)
              </option>
            </select>
          </div>

          <div className="flex gap-2">
            <select
              value={newBucket}
              onChange={(e) =>
                setNewBucket(e.target.value as MspFeatureItem['bucket'])
              }
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              <option value="must_have">Must have to sell (v1)</option>
              <option value="cut_for_later">Cut for later</option>
            </select>

            <Button type="submit" disabled={!newLabel.trim()}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </form>

      {/* Scope Bloat Guardrail */}
      {mustHaves.length > 4 && (
        <div className="flex max-w-3xl items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/[0.06] p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-muted-foreground">
            <strong className="text-foreground">
              You have {mustHaves.length} items in v1.
            </strong>{' '}
            The best first offers usually have 2 to 4 core things. Click
            &ldquo;Cut for later&rdquo; on anything that isn&apos;t strictly
            required to take your first paid order.
          </p>
        </div>
      )}

      {/* Two-Column Triage Buckets */}
      <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
        {/* Must Have Bucket */}
        <div className="space-y-3 rounded-2xl border border-primary/40 bg-primary/[0.02] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <h3 className="font-bold">
                Must have to sell (v1) ({mustHaves.length})
              </h3>
            </div>
          </div>

          {mustHaves.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Nothing in v1 yet. Add the bare minimum needed for a customer to
              pay.
            </p>
          ) : (
            <div className="space-y-2.5">
              {mustHaves.map((item) => (
                <div
                  key={item.id}
                  className="space-y-2 rounded-xl border border-border bg-card p-3.5 text-sm"
                >
                  <p className="font-semibold text-foreground">{item.label}</p>
                  {item.servesPainOrGain && (
                    <p className="text-xs text-muted-foreground">
                      {item.servesPainOrGain}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => toggleBucket(item.id)}
                      className="text-xs font-semibold text-amber-700 hover:underline"
                    >
                      Cut for later →
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFeature(item.id)}
                      aria-label="Delete item"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cut For Later Bucket */}
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Scissors className="h-4 w-4" />
            <h3 className="font-bold text-foreground">
              Cut for later ({cutItems.length})
            </h3>
          </div>

          {cutItems.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Items you decide not to build in v1 will sit safely here.
            </p>
          ) : (
            <div className="space-y-2.5">
              {cutItems.map((item) => (
                <div
                  key={item.id}
                  className="space-y-2 rounded-xl bg-muted/40 p-3.5 text-sm"
                >
                  <p className="font-medium text-muted-foreground line-through">
                    {item.label}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => toggleBucket(item.id)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      ← Move back to v1
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFeature(item.id)}
                      aria-label="Delete item"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          disabled={saving || mustHaves.length === 0}
          className="h-12 rounded-full px-8 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              See how your v1 offer shapes up
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}