
'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Save } from 'lucide-react';

import { saveObservation } from '@/actions/observations';
import type { ObservationFormValues } from '@/lib/schemas/observation';
import type { UserObservation } from '@/lib/types/observations';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function OpportunitySetup({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [isExisting, setIsExisting] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedObservation, setSavedObservation] =
    useState<UserObservation | null>(null);

  async function handleSave() {
    if (isSaving || !title.trim() || !content.trim()) return;

    setIsSaving(true);
    setError(null);
    setSavedObservation(null);

    const data: ObservationFormValues = {
      title: title.trim(),
      content: content.trim(),
      context: context.trim() || null,
      type: 'observation',
      domain: 'problem',
      focus: 'personal',
      source_node_key: nodeKey,
      problem_details: {
        is_existing: isExisting,
      },
    };

    try {
      const result = await saveObservation(data);

      setSavedObservation(result.observation);
    } catch (err) {
      console.error('[OPPORTUNITY SETUP]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save the observation. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="w-full max-w-3xl space-y-8">
      <header className="space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'Your starting point'}
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          A simple test of the observation-saving flow. Capture an idea or
          something you have noticed, and verify that it is saved.
        </p>
      </header>

      <div className="space-y-6 rounded-xl border p-6">
        <div className="space-y-2">
          <label htmlFor="opportunity-title" className="text-sm font-medium">
            Give it a short title
          </label>
          <Input
            id="opportunity-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Local businesses struggle to keep information updated"
            maxLength={120}
            disabled={isSaving || !!savedObservation}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="opportunity-content" className="text-sm font-medium">
            What have you noticed or experienced?
          </label>
          <Textarea
            id="opportunity-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Describe it in your own words..."
            rows={5}
            disabled={isSaving || !!savedObservation}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="opportunity-context" className="text-sm font-medium">
            Additional context (optional)
          </label>
          <Textarea
            id="opportunity-context"
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder="Where did you notice this? Who was involved?"
            rows={3}
            disabled={isSaving || !!savedObservation}
          />
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={isExisting}
            onChange={(event) => setIsExisting(event.target.checked)}
            disabled={isSaving || !!savedObservation}
            className="mt-1"
          />
          <span>
            This is an idea I was already thinking about before starting
            Mission 2.
          </span>
        </label>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {savedObservation && (
          <div className="space-y-3 rounded-lg border border-green-600/30 p-4">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Observation saved successfully
            </p>
            <p className="break-all text-xs text-muted-foreground">
              Observation ID: {savedObservation.id}
            </p>
            <p className="text-sm text-muted-foreground">
              Verify this record in Supabase before continuing.
            </p>
            <Button
              onClick={() =>
                onComplete({
                  completed: true,
                  observationId: savedObservation.id,
                })
              }
            >
              Continue
            </Button>
          </div>
        )}

        {!savedObservation && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !content.trim()}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : 'Save observation'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
