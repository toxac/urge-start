'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchUserOpportunities } from '@/actions/opportunities';
import { saveOpportunityReflection } from '@/actions/customer-interactions';
import type { UserOpportunity } from '@/lib/types/opportunities';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type OpportunityReflection = UserOpportunity & {
  customer_interaction_reflection?: string | null;
};

export function ConversationReflection({ node, onComplete }: NodeComponentProps) {
  const [opps, setOpps] = useState<OpportunityReflection[]>([]);
  const [selected, setSelected] = useState('');
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  function choose(id: string) {
    setSelected(id);
    setReflection(opps.find((o) => o.id === id)?.customer_interaction_reflection ?? '');
    setSaved(false);
  }

  async function save() {
    if (!selected) return;
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save reflection.');
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading reflections…
      </div>
    );

  const current = opps.find((o) => o.id === selected);

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
          <div className="max-w-3xl space-y-2">
            <label className="text-sm font-medium">Opportunity</label>
            <select
              value={selected}
              onChange={(e) => choose(e.target.value)}
              className="w-full rounded-lg border bg-background p-3"
            >
              {opps.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>

          {current && (
            <section className="max-w-3xl space-y-4 rounded-2xl border p-5">
              <h2 className="text-xl font-semibold">{current.title}</h2>
              <p className="text-muted-foreground">{current.problem || current.description}</p>
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
              <textarea
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
                <Button onClick={save} disabled={saving}>
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
        <Button onClick={() => onComplete({ completed: true })} className="rounded-full px-6">
          Continue
        </Button>
      </div>
    </div>
  );
}