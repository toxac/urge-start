
'use client';

import { useState } from 'react';

import { extractProblemDetails } from '@/actions/responses/mission2';
import { saveObservation } from '@/actions/observations';

import { Button } from '@/components/ui/button';
import type {
  ProblemObservationFocus,
  UserObservation,
} from '@/lib/types/observations';
import { observationsActions } from '@/lib/stores/observations';

type ObservedProblemExtractionFormProps = {
  sourceNodeKey: string;
  focus: ProblemObservationFocus;
  isExistingIdea?: boolean;
  onSaved: (
    observation: UserObservation,
    extractionFailed?: boolean,
  ) => void;
  onCancel?: () => void;
};


export function ObservedProblemExtractionForm({
  sourceNodeKey,
  focus,
  isExistingIdea = false,
  onSaved,
  onCancel,
}: ObservedProblemExtractionFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSave() {
    if (isSaving) return;

    if (!title.trim()) {
      setError('Give your observation a short title.');
      return;
    }

    if (!content.trim()) {
      setError('Describe what you noticed.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    let savedObservation: UserObservation | null = null;
    let extractionFailed = false;

    try {
      // Save the user's original title and description first.
      const result = await saveObservation({
        title: title.trim(),
        content: content.trim(),
        type: 'observation',
        domain: 'problem',
        focus,
        source_node_key: sourceNodeKey,
        observed_at: new Date().toISOString(),
        ...(isExistingIdea
          ? { problem_details: { is_existing: true } }
          : {}),
      });

      savedObservation = result.observation as UserObservation;
      observationsActions.upsert(savedObservation);

      // Attempt initial extraction after the original observation is saved.
      try {
        const extracted = await extractProblemDetails(
          savedObservation.content,
          sourceNodeKey,
        );

        const existingDetails =
          savedObservation.problem_details &&
          typeof savedObservation.problem_details === 'object' &&
          !Array.isArray(savedObservation.problem_details)
            ? savedObservation.problem_details
            : {};

        const existingMetadata =
          savedObservation.metadata &&
          typeof savedObservation.metadata === 'object' &&
          !Array.isArray(savedObservation.metadata)
            ? savedObservation.metadata
            : {};

        const enriched = await saveObservation({
          observation_id: savedObservation.id,
          title: savedObservation.title,
          content: savedObservation.content,
          problem_details: {
            ...existingDetails,
            ...extracted,
            ...(isExistingIdea ? { is_existing: true } : {}),
          },
          metadata: {
            ...existingMetadata,
            problem_detail_extraction: {
              status: 'succeeded',
              attempted_at: new Date().toISOString(),
            },
          },
        });

        savedObservation = enriched.observation as UserObservation;
        observationsActions.upsert(savedObservation);
      } catch (extractionError) {
        extractionFailed = true;

        console.error(
          '[OBSERVATION DETAIL EXTRACTION]',
          extractionError,
        );

        // Persist the failed attempt without replacing other metadata.
        try {
          const existingMetadata =
            savedObservation.metadata &&
            typeof savedObservation.metadata === 'object' &&
            !Array.isArray(savedObservation.metadata)
              ? savedObservation.metadata
              : {};

          const failedResult = await saveObservation({
            observation_id: savedObservation.id,
            title: savedObservation.title,
            content: savedObservation.content,
            metadata: {
              ...existingMetadata,
              problem_detail_extraction: {
                status: 'failed',
                attempted_at: new Date().toISOString(),
              },
            },
          });

          savedObservation = failedResult.observation as UserObservation;
          observationsActions.upsert(savedObservation);
        } catch (metadataError) {
          // Keep the original observation even if status persistence fails.
          console.error(
            '[OBSERVATION EXTRACTION STATUS SAVE]',
            metadataError,
          );
        }

        setNotice(
          'Your observation is saved, but we couldn’t organise its details. You can edit it later and try again.',
        );
      }

      onSaved(savedObservation, extractionFailed);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save your observation.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="observed-problem-title"
          className="block text-sm font-medium"
        >
          Give it a short title
        </label>

        <input
          id="observed-problem-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          placeholder="e.g. Getting a repair done takes weeks"
          className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none focus:border-[#FF502F] focus:ring-2 focus:ring-[#FF502F]/15"
          disabled={isSaving}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="observed-problem-content"
          className="block text-sm font-medium"
        >
          What did you notice?
        </label>

        <textarea
          id="observed-problem-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={5}
          maxLength={8000}
          placeholder="Describe what happened in your own words. A sentence is enough."
          className="w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-6 outline-none focus:border-[#FF502F] focus:ring-2 focus:ring-[#FF502F]/15"
          disabled={isSaving}
        />

        <p className="text-xs text-muted-foreground">
          Keep your own words. You can add structured details later.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
        )}

        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#FF502F] text-white hover:bg-[#E94729]"
        >
          {isSaving ? 'Saving observation…' : 'Save observation'}
        </Button>
      </div>
    </div>
  );
}

