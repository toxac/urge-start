'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Loader2,
  MessageSquareText,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import { fetchUserOpportunities } from '@/actions/opportunities';
import {
  getOpportunityInteractions,
  saveOpportunityReflection,
} from '@/actions/customer-interactions';
import type { CustomerInteraction } from '@/lib/types/interactions';
import type { UserOpportunity } from '@/lib/types/opportunities';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type OpportunityReflection = UserOpportunity & {
  customer_interaction_reflection?: string | null;
};

export function ConversationReflection({ node, onComplete }: NodeComponentProps) {
  const [opps, setOpps] = useState<OpportunityReflection[]>([]);
  const [selected, setSelected] = useState('');
  const [reflection, setReflection] = useState('');
  const [notesForSelected, setNotesForSelected] = useState<CustomerInteraction[]>([]);
  const [showNotes, setShowNotes] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetchUserOpportunities()
      .then((rows) => {
        if (!alive) return;
        const data = rows as OpportunityReflection[];
        setOpps(data);
        setSelected(data[0]?.id ?? '');
        setReflection(data[0]?.customer_interaction_reflection ?? '');
        setLoading(false);
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e.message : 'Could not load reflection.');
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  // Load notes captured in the previous step so the founder can reference them
  useEffect(() => {
    if (!selected) {
      setNotesForSelected([]);
      return;
    }

    let cancelled = false;
    getOpportunityInteractions(selected)
      .then((items) => {
        if (!cancelled) setNotesForSelected(items);
      })
      .catch(() => {
        if (!cancelled) setNotesForSelected([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  const current = opps.find((o) => o.id === selected);
  const savedTextForCurrent = current?.customer_interaction_reflection ?? '';
  const hasUnsavedChanges =
    Boolean(selected) && reflection.trim() !== savedTextForCurrent.trim();

  async function persistCurrentReflection(): Promise<boolean> {
    if (!selected) return true;
    setSaving(true);
    setError('');
    try {
      await saveOpportunityReflection(selected, reflection);
      setOpps((old) =>
        old.map((o) =>
          o.id === selected ? { ...o, customer_interaction_reflection: reflection } : o,
        ),
      );
      setSaved(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save reflection.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function choose(id: string) {
    if (id === selected) return;
    if (hasUnsavedChanges) {
      const ok = await persistCurrentReflection();
      if (!ok) return;
    }
    setSelected(id);
    setReflection(opps.find((o) => o.id === id)?.customer_interaction_reflection ?? '');
    setSaved(false);
  }

  async function handleContinue() {
    if (isContinuing || saving) return;

    if (hasUnsavedChanges) {
      const ok = await persistCurrentReflection();
      if (!ok) return;
    }

    setIsContinuing(true);
    try {
      await onComplete({ completed: true });
    } finally {
      setIsContinuing(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading reflections…
      </div>
    );

  return (
    <div className="w-full space-y-8 pb-12">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{node.title}</h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {!opps.length ? (
        <p className="rounded-xl border p-5 text-muted-foreground">
          No saved opportunities yet. You can return to Quest 1 and choose one.
        </p>
      ) : (
        <>
          <div className="max-w-3xl space-y-2.5">
            <label className="text-sm font-medium">
              Your opportunities ({opps.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {opps.map((o) => {
                const isSelected = o.id === selected;
                const hasReflection = Boolean(
                  o.customer_interaction_reflection?.trim(),
                );
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={saving}
                    onClick={() => void choose(o.id)}
                    aria-pressed={isSelected}
                    className={[
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-left text-sm font-medium transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
                    ].join(' ')}
                  >
                    {hasReflection && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                    <span>{o.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {current && (
            <section className="max-w-3xl space-y-5 rounded-2xl border p-5">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{current.title}</h2>
                <p className="text-muted-foreground">
                  {current.problem || current.description}
                </p>
              </div>

              {notesForSelected.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
                  <button
                    type="button"
                    onClick={() => setShowNotes((v) => !v)}
                    aria-expanded={showNotes}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-muted/40"
                  >
                    <span className="inline-flex items-center gap-2">
                      <MessageSquareText className="h-4 w-4 text-primary" />
                      Your notes from conversations ({notesForSelected.length})
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        showNotes ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showNotes && (
                    <div className="space-y-2.5 border-t border-border p-4">
                      {notesForSelected.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-lg bg-background p-3 text-sm leading-6"
                        >
                          <p className="whitespace-pre-wrap">{note.notes}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(note.interaction_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm leading-6 text-muted-foreground">
                Use any prompts that help; you do not need to answer all of them.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                <li>What did you learn about the problem?</li>
                <li>What did people say or do that stood out?</li>
                <li>What surprised you or challenged your assumptions?</li>
                <li>What do you understand differently now?</li>
                <li>What remains uncertain?</li>
              </ul>

              <SpeechTextarea
                rows={8}
                value={reflection}
                onChange={(e) => {
                  setReflection(e.target.value);
                  setSaved(false);
                }}
                placeholder="Write in your own words. You can reflect on conversations held offline."
                className="w-full rounded-lg border bg-background p-3 leading-7"
              />

              <div className="flex items-center justify-between gap-3">
                {saved ? (
                  <span className="flex items-center gap-2 text-sm text-emerald-600">
                    <Check className="h-4 w-4" />
                    Reflection saved
                  </span>
                ) : (
                  <span />
                )}
                <Button
                  type="button"
                  onClick={() => void persistCurrentReflection()}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save reflection
                </Button>
              </div>
            </section>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={isContinuing || saving}
          className="rounded-full px-6"
        >
          {isContinuing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Continuing…
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  );
}