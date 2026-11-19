'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import {
  fetchUserOpportunities,
  updateOpportunityFeasibility,
} from '@/actions/opportunities';
import { checkRegulatoryFactors } from '@/actions/responses/mission2';
import { opportunitiesActions } from '@/lib/stores/opportunities';
import type { UserOpportunity } from '@/lib/types/opportunities';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type FeasibilityDraft = {
  hasSkills: 'yes' | 'partial' | 'no';
  skillsNotes: string;
  hasCollaborators: boolean;
  collaboratorNotes: string;
  timeCommitment: string;
  hasTime: boolean;
  capitalRequirement: 'minimal' | 'moderate' | 'significant';
  capitalNotes: string;
  regulatoryNotes: string;
};

export function PathAssessment({ node, nodeKey, onComplete }: NodeComponentProps) {
  const [opportunities, setOpportunities] = useState<UserOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<Record<string, FeasibilityDraft>>({});

  const [regulatoryTips, setRegulatoryTips] = useState<Record<string, string[]>>({});
  const [isCheckingRegs, setIsCheckingRegs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchUserOpportunities()
      .then((opps) => {
        if (!alive) return;
        setOpportunities(opps);
        opportunitiesActions.hydrate(opps);

        const initial: Record<string, FeasibilityDraft> = {};
        const alreadySaved: Record<string, boolean> = {};
        for (const opp of opps) {
          const feas = (opp.metadata as Record<string, any>)?.feasibility;
          if (feas) {
            alreadySaved[opp.id] = true;
          }
          initial[opp.id] = {
            hasSkills: feas?.hasSkills || 'partial',
            skillsNotes: feas?.skillsNotes || '',
            hasCollaborators: feas?.hasCollaborators ?? false,
            collaboratorNotes: feas?.collaboratorNotes || '',
            timeCommitment: feas?.timeCommitment || '5-10 hours/week',
            hasTime: feas?.hasTime ?? true,
            capitalRequirement: feas?.capitalRequirement || 'minimal',
            capitalNotes: feas?.capitalNotes || '',
            regulatoryNotes: feas?.regulatoryNotes || '',
          };
        }
        setDrafts(initial);
        setSavedIds(alreadySaved);
        setLoading(false);
      })
      .catch((err) => {
        if (alive) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const currentOpp = opportunities[activeIdx];
  const currentDraft = currentOpp ? drafts[currentOpp.id] : null;
  const currentApproach = currentOpp
    ? (currentOpp.metadata as Record<string, any>)?.approach
    : null;

  const updateField = <K extends keyof FeasibilityDraft>(
    field: K,
    val: FeasibilityDraft[K],
  ) => {
    if (!currentOpp) return;
    setSavedNotice(null);
    setDrafts((prev) => ({
      ...prev,
      [currentOpp.id]: { ...prev[currentOpp.id], [field]: val },
    }));
  };

  const handleCheckRegulatory = async () => {
    if (!currentOpp || isCheckingRegs) return;
    setIsCheckingRegs(true);
    try {
      const tips = await checkRegulatoryFactors({
        opportunityTitle: currentOpp.title,
        problemDescription: currentOpp.problem || currentOpp.description || '',
        approachType: currentApproach?.type || 'do_for_them',
        approachDescription: currentApproach?.description || '',
        nodeKey,
      });
      setRegulatoryTips((prev) => ({ ...prev, [currentOpp.id]: tips }));
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsCheckingRegs(false);
    }
  };

  async function persistOpportunityFeasibility(opp: UserOpportunity) {
    const draft = drafts[opp.id];
    if (!draft) return;

    const updated = await updateOpportunityFeasibility(opp.id, draft);
    opportunitiesActions.upsert(updated);
    setOpportunities((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
    setSavedIds((prev) => ({ ...prev, [opp.id]: true }));
  }

  const saveCurrent = async () => {
    if (!currentOpp || !currentDraft || saving) return;
    setSaving(true);
    setError(null);
    setSavedNotice(null);
    try {
      await persistOpportunityFeasibility(currentOpp);

      if (activeIdx < opportunities.length - 1) {
        setActiveIdx((prev) => prev + 1);
      } else {
        setSavedNotice('Saved.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save feasibility');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTab = async (nextIdx: number) => {
    if (nextIdx === activeIdx || saving) return;
    if (currentOpp) {
      setSaving(true);
      setError(null);
      try {
        await persistOpportunityFeasibility(currentOpp);
      } catch (err: any) {
        setError(err.message || 'Failed to save feasibility');
        setSaving(false);
        return;
      } finally {
        setSaving(false);
      }
    }
    setSavedNotice(null);
    setActiveIdx(nextIdx);
  };

  const handleFinish = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      // Ensure every opportunity's feasibility draft is persisted before PathReveal loads
      for (const opp of opportunities) {
        await persistOpportunityFeasibility(opp);
      }
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
        Loading feasibility criteria…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{node.title}</h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">{node.description}</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {opportunities.map((opp, idx) => (
          <button
            key={opp.id}
            type="button"
            disabled={saving}
            onClick={() => void handleSelectTab(idx)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeIdx === idx
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {savedIds[opp.id] && <Check className="h-3.5 w-3.5" />}
            {opp.title}
          </button>
        ))}
      </div>

      {currentOpp && currentDraft && (
        <div className="max-w-3xl space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chosen Approach</span>
            <h2 className="mt-1 text-xl font-bold">{currentOpp.title}</h2>
            <p className="mt-2 text-base text-muted-foreground">{currentApproach?.description || 'No approach described yet.'}</p>
          </div>

          {/* 1. Skills */}
          <div className="space-y-4 rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold">1. Skills &amp; Capabilities</h3>
            <p className="text-sm text-muted-foreground">Do you have the skills required to deliver this first version?</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: 'yes' as const, label: 'Yes, fully' },
                { val: 'partial' as const, label: 'Partially / Need to learn' },
                { val: 'no' as const, label: 'No, completely new' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateField('hasSkills', val)}
                  className={`rounded-xl border p-3 text-sm font-medium transition ${
                    currentDraft.hasSkills === val
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <SpeechTextarea
              rows={2}
              value={currentDraft.skillsNotes}
              onChange={(e) => updateField('skillsNotes', e.target.value)}
              placeholder="What specific skills do you need to learn or borrow?"
              className="resize-y text-base"
            />
          </div>

          {/* 2. Collaborators */}
          <div className="space-y-4 rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold">2. Collaborators &amp; Network</h3>
            <p className="text-sm text-muted-foreground">If you lack any required skills, do you know someone in your network who could help?</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="radio"
                  checked={currentDraft.hasCollaborators}
                  onChange={() => updateField('hasCollaborators', true)}
                />
                Yes, I have people I could approach
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="radio"
                  checked={!currentDraft.hasCollaborators}
                  onChange={() => updateField('hasCollaborators', false)}
                />
                No, I would need to find someone new
              </label>
            </div>
          </div>

          {/* 3. Time */}
          <div className="space-y-4 rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold">3. Time &amp; Bandwidth</h3>
            <p className="text-sm text-muted-foreground">How much time does this need weekly, and do you realistically have it?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={currentDraft.timeCommitment}
                onChange={(e) => updateField('timeCommitment', e.target.value)}
                placeholder="e.g. 5 hours a week"
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={currentDraft.hasTime}
                  onChange={(e) => updateField('hasTime', e.target.checked)}
                />
                I can commit this time right now
              </label>
            </div>
          </div>

          {/* 4. Money */}
          <div className="space-y-4 rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold">4. Capital Required</h3>
            <p className="text-sm text-muted-foreground">Does this require upfront cash before serving one customer?</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: 'minimal' as const, label: 'Near £0 / sweat equity' },
                { val: 'moderate' as const, label: 'Small (£100–£500)' },
                { val: 'significant' as const, label: 'Large (£1,000+)' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateField('capitalRequirement', val)}
                  className={`rounded-xl border p-3 text-sm font-medium transition ${
                    currentDraft.capitalRequirement === val
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Regulatory & Legal Assistant */}
          <div className="space-y-4 rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">5. Regulations &amp; Legal Considerations</h3>
                <p className="text-sm text-muted-foreground">Any specific licenses, data rules, or liability considerations?</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleCheckRegulatory()}
                disabled={isCheckingRegs}
                className="shrink-0 gap-2"
              >
                {isCheckingRegs ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
                Check considerations
              </Button>
            </div>

            {regulatoryTips[currentOpp.id] && (
              <div className="space-y-2 rounded-xl bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested boundaries</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                  {regulatoryTips[currentOpp.id].map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <SpeechTextarea
              rows={2}
              value={currentDraft.regulatoryNotes}
              onChange={(e) => updateField('regulatoryNotes', e.target.value)}
              placeholder="Notes on insurance, permits, GDPR, or compliance requirements..."
              className="resize-y text-base"
            />
          </div>

          {savedNotice && (
            <p role="status" className="flex items-center gap-2 text-sm text-emerald-600">
              <Check className="h-4 w-4" />
              {savedNotice}
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-between border-t border-border pt-6">
            <span className="text-xs text-muted-foreground">
              Opportunity {activeIdx + 1} of {opportunities.length}
            </span>
            <Button
              type="button"
              onClick={() => void saveCurrent()}
              disabled={saving}
              className="rounded-full px-6"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {activeIdx < opportunities.length - 1
                ? 'Save & Next Opportunity'
                : 'Save Assessment'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end border-t border-border pt-6">
        <Button
          type="button"
          onClick={() => void handleFinish()}
          disabled={saving}
          className="h-12 rounded-full px-8 text-base"
        >
          Continue to Side-by-Side Reveal
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}