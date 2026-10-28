'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2, Sparkles, UserCheck, Wrench, Share2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { fetchUserOpportunities, updateOpportunityApproach } from '@/actions/opportunities';
import { $opportunities, opportunitiesActions } from '@/lib/stores/opportunities';
import type { UserOpportunity } from '@/lib/types/opportunities';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type ApproachType = 'do_for_them' | 'tool' | 'connect' | 'teach';

const ARCHETYPES: {
  key: ApproachType;
  title: string;
  kind: string;
  icon: typeof UserCheck;
  description: string;
  example: string;
}[] = [
  {
    key: 'do_for_them',
    title: 'Do it for them',
    kind: 'Bespoke service / agency',
    icon: UserCheck,
    description: 'You take on the pain directly and do the work on their behalf.',
    example: 'Instead of making software, you do the audit, cleaning, or management manually.',
  },
  {
    key: 'tool',
    title: 'Give them a tool',
    kind: 'Software, template, or kit',
    icon: Wrench,
    description: 'You create an artifact that enables them to solve it themselves faster or cheaper.',
    example: 'A spreadsheet model, automated script, notion template, or app.',
  },
  {
    key: 'connect',
    title: 'Connect them',
    kind: 'Marketplace or community',
    icon: Share2,
    description: 'You connect the person with the problem to someone who has the solution.',
    example: 'A curated directory, matching platform, or closed peer group.',
  },
  {
    key: 'teach',
    title: 'Teach them',
    kind: 'Guide, course, or coaching',
    icon: GraduationCap,
    description: 'You give them the knowledge and confidence to handle the problem.',
    example: 'A workshop, intensive checklist, documentation, or 1-on-1 coaching.',
  },
];

export function HelpApproach({ node, onComplete }: NodeComponentProps) {
  const [opportunities, setOpportunities] = useState<UserOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, { type: ApproachType; description: string; rationale: string }>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserOpportunities()
      .then((opps) => {
        setOpportunities(opps);
        opportunitiesActions.hydrate(opps);

        const initialDrafts: Record<string, any> = {};
        for (const opp of opps) {
          const savedApproach = (opp.metadata as Record<string, any>)?.approach;
          initialDrafts[opp.id] = {
            type: savedApproach?.type || 'do_for_them',
            description: savedApproach?.description || '',
            rationale: savedApproach?.rationale || '',
          };
        }
        setDrafts(initialDrafts);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load opportunities');
        setLoading(false);
      });
  }, []);

  const currentOpp = opportunities[activeIdx];
  const currentDraft = currentOpp ? drafts[currentOpp.id] : null;

  const updateCurrentDraft = (field: string, value: any) => {
    if (!currentOpp) return;
    setDrafts((prev) => ({
      ...prev,
      [currentOpp.id]: {
        ...prev[currentOpp.id],
        [field]: value,
      },
    }));
  };

  const saveCurrentOpportunity = async () => {
    if (!currentOpp || !currentDraft) return;
    if (!currentDraft.description.trim()) {
      setError('Please describe what this solution looks like.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateOpportunityApproach(currentOpp.id, {
        type: currentDraft.type,
        description: currentDraft.description.trim(),
        rationale: currentDraft.rationale.trim(),
      });
      opportunitiesActions.upsert(updated);

      if (activeIdx < opportunities.length - 1) {
        setActiveIdx((prev) => prev + 1);
      }
    } catch (err: any) {
      setError(err.message || 'Could not save approach.');
    } finally {
      setSaving(false);
    }
  };

  const allFilled = opportunities.every((opp) => drafts[opp.id]?.description?.trim().length > 0);

  const handleFinish = async () => {
    if (!allFilled) {
      setError('Please define your approach for all opportunities before moving forward.');
      return;
    }
    setSaving(true);
    try {
      await onComplete({ completed: true });
    } catch (err: any) {
      setError(err.message || 'Failed to complete node');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading opportunities…
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="p-6 text-muted-foreground">
        No active opportunities found. Return to Quest 1 to select candidates.
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {opportunities.map((opp, idx) => {
          const isDone = Boolean(drafts[opp.id]?.description?.trim());
          return (
            <button
              key={opp.id}
              onClick={() => setActiveIdx(idx)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeIdx === idx
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {isDone && <Check className="h-3.5 w-3.5" />}
              {opp.title}
            </button>
          );
        })}
      </div>

      {currentOpp && currentDraft && (
        <div className="max-w-3xl space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Investigating Problem
            </span>
            <h2 className="mt-1 text-2xl font-bold">{currentOpp.title}</h2>
            <p className="mt-2 text-base leading-7 text-muted-foreground">
              {currentOpp.problem || currentOpp.description}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Choose a primary approach archetype</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {ARCHETYPES.map((arch) => {
                const isSelected = currentDraft.type === arch.key;
                const Icon = arch.icon;
                return (
                  <div
                    key={arch.key}
                    onClick={() => updateCurrentDraft('type', arch.key)}
                    className={`cursor-pointer rounded-2xl border p-5 transition ${
                      isSelected
                        ? 'border-primary bg-primary/[0.05] ring-2 ring-primary/20'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2.5 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{arch.title}</h4>
                        <p className="text-xs text-muted-foreground">{arch.kind}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{arch.description}</p>
                    <p className="mt-2 text-xs italic text-muted-foreground">{arch.example}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. What would this look like for the customer?</h3>
            <p className="text-sm text-muted-foreground">
              Describe the simplest version you can imagine delivering to one person in two weeks.
            </p>
            <Textarea
              rows={4}
              value={currentDraft.description}
              onChange={(e) => updateCurrentDraft('description', e.target.value)}
              placeholder="e.g. I will personally review their menu, rewrite dish descriptions, take 10 photos, and print laminated cards..."
              className="resize-none text-base leading-7"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">3. Why does this approach make sense for you? (Optional)</h3>
            <Textarea
              rows={2}
              value={currentDraft.rationale}
              onChange={(e) => updateCurrentDraft('rationale', e.target.value)}
              placeholder="e.g. I already have design skills and can do this without writing any code..."
              className="resize-none text-base leading-7"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-between border-t border-border pt-6">
            <span className="text-xs text-muted-foreground">
              Opportunity {activeIdx + 1} of {opportunities.length}
            </span>
            <Button onClick={saveCurrentOpportunity} disabled={saving} className="rounded-full px-6">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Save & Next Opportunity
            </Button>
          </div>
        </div>
      )}

      {allFilled && (
        <div className="flex justify-end border-t border-border pt-6">
          <Button onClick={handleFinish} disabled={saving} className="h-12 rounded-full px-8 text-base">
            Continue to Feasibility Assessment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}