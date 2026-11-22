'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  $experimentBlueprints,
  $userExperiments,
  experimentBlueprintsActions,
  userExperimentsActions,
} from '@/lib/stores/experiments';
import {
  fetchExperimentBlueprints,
  fetchMission3ContextSummary,
  fetchUserExperiments,
  updateUserExperiment,
} from '@/actions/experiments';
import {
  renderExperimentPrompt,
  type Mission3ContextSummary,
} from '@/lib/types/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type PrepFormState = {
  where: string;
  checklist: Record<string, boolean>;
  generatedPrompt: string;
};

export function TestPreparation({ node, onComplete }: NodeComponentProps) {
  const userExpState = useStore($userExperiments);
  const blueprints = useStore($experimentBlueprints);

  const [context, setContext] = useState<Mission3ContextSummary | null>(null);
  const [prepForms, setPrepForms] = useState<Record<string, PrepFormState>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [ctx, loadedBps, loadedRuns] = await Promise.all([
          fetchMission3ContextSummary(),
          blueprints.length > 0
            ? Promise.resolve(blueprints)
            : fetchExperimentBlueprints({ category: 'demand' }),
          userExpState.hydrated
            ? Promise.resolve(
                userExpState.allIds.map((id) => userExpState.byId[id]),
              )
            : fetchUserExperiments({ missionKey: 'mission-3' }),
        ]);

        if (!alive) return;
        setContext(ctx);
        if (blueprints.length === 0 && loadedBps.length > 0) {
          experimentBlueprintsActions.hydrate(loadedBps);
        }
        if (!userExpState.hydrated && loadedRuns.length > 0) {
          userExperimentsActions.hydrate(loadedRuns);
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

  const activeTests = useMemo(() => {
    const bpMap = new Map(blueprints.map((b) => [b.key, b]));
    return userExpState.allIds
      .map((id) => userExpState.byId[id])
      .filter(
        (exp) =>
          exp &&
          exp.mission_key === 'mission-3' &&
          exp.status !== 'parked' &&
          exp.status !== 'iterated',
      )
      .map((exp) => ({
        exp,
        blueprint: bpMap.get(exp.experiment_key) ?? null,
      }));
  }, [userExpState, blueprints]);

  useEffect(() => {
    if (activeTests.length === 0) return;
    setPrepForms((prev) => {
      const next = { ...prev };
      for (const { exp, blueprint } of activeTests) {
        if (next[exp.id]) continue;
        const defaultPrompt = renderExperimentPrompt(
          blueprint?.prompt_template,
          {
            projectTitle: context?.project?.title ?? exp.title,
            pitch: exp.setup?.pitch,
            channels: exp.setup?.where,
          },
        );

        next[exp.id] = {
          where: exp.setup?.where ?? '',
          checklist: exp.setup?.checklist ?? {},
          generatedPrompt: exp.setup?.generated_prompt || defaultPrompt,
        };
      }
      return next;
    });
  }, [activeTests, context?.project?.title]);

  async function handleCopyPrompt(id: string, text: string) {
    if (!text.trim()) return;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000);
  }

  async function handleSaveAndContinue() {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      const updated = await Promise.all(
        activeTests.map(({ exp }) => {
          const form = prepForms[exp.id];
          return updateUserExperiment(exp.id, {
            setup: {
              ...exp.setup,
              where: form?.where?.trim() || undefined,
              checklist: form?.checklist ?? {},
              generated_prompt: form?.generatedPrompt?.trim() || undefined,
            },
          });
        }),
      );

      userExperimentsActions.upsertMany(updated);
      await onComplete({ completed: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save preparation notes.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Assembling your prep checklists…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      <div className="max-w-3xl space-y-8">
        {activeTests.map(({ exp, blueprint }) => {
          const form = prepForms[exp.id];
          if (!form) return null;
          const checklistItems = blueprint?.prep_checklist ?? [];

          return (
            <div
              key={exp.id}
              className="space-y-6 rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {exp.title}
                  </h2>
                  {blueprint?.one_line && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {blueprint.one_line}
                    </p>
                  )}
                </div>

                {blueprint?.resource_slug && (
                  <Link
                    href={`/resources/${blueprint.resource_slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Read step-by-step guide
                  </Link>
                )}
              </div>

              {/* Channel / Location */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Specific places, channels, or people for this test
                </label>
                <input
                  type="text"
                  value={form.where}
                  onChange={(e) =>
                    setPrepForms((prev) => ({
                      ...prev,
                      [exp.id]: { ...prev[exp.id], where: e.target.value },
                    }))
                  }
                  disabled={saving}
                  placeholder="e.g. 2 LinkedIn posts + 15 direct messages to local studio owners"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm"
                />
              </div>

              {/* Checklist */}
              {checklistItems.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Readiness checklist
                  </p>
                  <div className="space-y-2">
                    {checklistItems.map((item, idx) => {
                      const key = String(idx);
                      const checked = Boolean(form.checklist[key]);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setPrepForms((prev) => ({
                              ...prev,
                              [exp.id]: {
                                ...prev[exp.id],
                                checklist: {
                                  ...prev[exp.id].checklist,
                                  [key]: !checked,
                                },
                              },
                            }))
                          }
                          className="flex w-full items-start gap-3 rounded-xl bg-muted/30 p-3 text-left text-sm hover:bg-muted/50"
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                              checked
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background'
                            }`}
                          >
                            {checked && <Check className="h-3 w-3" />}
                          </span>
                          <span
                            className={
                              checked
                                ? 'text-muted-foreground line-through'
                                : 'text-foreground'
                            }
                          >
                            {item}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ready-to-Paste Prompt for External AI Tools */}
              {form.generatedPrompt && (
                <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>
                        Copy-paste prompt for ChatGPT, Claude, or a page builder
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void handleCopyPrompt(exp.id, form.generatedPrompt)
                      }
                    >
                      {copiedId === exp.id ? (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copy prompt
                        </>
                      )}
                    </Button>
                  </div>
                  <textarea
                    rows={5}
                    value={form.generatedPrompt}
                    onChange={(e) =>
                      setPrepForms((prev) => ({
                        ...prev,
                        [exp.id]: {
                          ...prev[exp.id],
                          generatedPrompt: e.target.value,
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs leading-5 text-muted-foreground"
                  />
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
              Review quick heads-ups
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}