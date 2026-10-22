
'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Save, Sparkles, X } from 'lucide-react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { saveObservation } from '@/actions/observations';
import { extractProblemDetails } from '@/actions/responses/mission2';

import {
  validatedObservationSchema,
  type ObservationFormValues,
} from '@/lib/schemas/observation';

import type {
  ObservationType,
  ProblemDetails,
  ProblemObservationFocus,
  UserObservation,
} from '@/lib/types/observations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ProblemObservationFormProps = {
  focus: ProblemObservationFocus;
  observation?: UserObservation | null;
  sourceNodeKey?: string;
  onSaved?: (observation: UserObservation) => void;
  onCancel?: () => void;
};

function getProblemDetails(
  observation?: UserObservation | null,
): ProblemDetails {
  const details = observation?.problem_details;

  if (
    details &&
    typeof details === 'object' &&
    !Array.isArray(details)
  ) {
    return details as ProblemDetails;
  }

  return {};
}

function getDefaultValues(
  focus: ProblemObservationFocus,
  sourceNodeKey?: string,
  observation?: UserObservation | null,
): ObservationFormValues {
  const details = getProblemDetails(observation);

  return {
    ...(observation ? { observation_id: observation.id } : {}),
    title: observation?.title ?? '',
    content: observation?.content ?? '',
    context: observation?.context ?? '',
    observed_at: observation?.observed_at ?? new Date().toISOString(),
    type: (observation?.type ?? 'observation') as ObservationType,
    domain: 'problem',
    focus,
    source_node_key:
      observation?.source_node_key ?? sourceNodeKey ?? null,
    problem_details: {
      is_existing: details.is_existing ?? null,
      who: details.who ?? '',
      where: details.where ?? '',
      when: details.when ?? '',
      can_reach: details.can_reach ?? null,
      workaround: details.workaround ?? '',
      current_option: details.current_option ?? '',
      cost: details.cost ?? '',
      frequency: details.frequency ?? '',
      why_unsolved: details.why_unsolved ?? '',
      understands: details.understands ?? null,
      cares: details.cares ?? null,
      can_solve: details.can_solve ?? null,
    },
  };
}

export function ProblemObservationForm({
  focus,
  observation = null,
  sourceNodeKey,
  onSaved,
  onCancel,
}: ProblemObservationFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionNotice, setExtractionNotice] = useState<string | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const form = useForm<ObservationFormValues>({
    resolver: zodResolver(validatedObservationSchema) as Resolver<ObservationFormValues>,
    defaultValues: getDefaultValues(
      focus,
      sourceNodeKey,
      observation,
    ),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = form;


  // Reset the form when switching between observations or focus types.
  useEffect(() => {
    reset(getDefaultValues(focus, sourceNodeKey, observation));
    setSaveError(null);
    setExtractionNotice(null);
    setExtractionError(null);
    setShowMoreDetails(false);
  }, [focus, sourceNodeKey, observation, reset]);

  async function handleExtractDetails() {
    const description = watch('content').trim();

    if (!description) {
      setExtractionError('Add a description first, then we can help organise the details.');
      return;
    }

    if (isExtracting) return;

    setIsExtracting(true);
    setExtractionError(null);
    setExtractionNotice(null);

    try {
      const extracted = await extractProblemDetails(
        description,
        sourceNodeKey ?? observation?.source_node_key ?? '',
      );

      if (!extracted || typeof extracted !== 'object') {
        throw new Error('The details could not be organised this time.');
      }

      // Suggestions fill gaps only. Anything the user has already entered stays untouched.
      const fields: ('who' | 'where' | 'when' | 'workaround' | 'current_option' | 'why_unsolved')[] = [
        'who', 'where', 'when', 'workaround', 'current_option', 'why_unsolved',
      ];
      let added = 0;

      for (const field of fields) {
        const current = watch(`problem_details.${field}` as const);
        const suggestion = extracted[field];
        if ((current === '' || current == null) && typeof suggestion === 'string' && suggestion.trim()) {
          setValue(`problem_details.${field}` as const, suggestion, {
            shouldDirty: true,
            shouldValidate: true,
          });
          added += 1;
        }
      }

      setShowMoreDetails(true);
      setExtractionNotice(
        added > 0
          ? 'We added some suggestions below. Check them, change anything that feels wrong, then save when you’re ready.'
          : 'We couldn’t find any new details to add. You can fill in the fields yourself or try again with a little more description.',
      );
    } catch (error) {
      console.error('[PROBLEM OBSERVATION EXTRACTION]', error);
      setExtractionError('We couldn’t organise the details just now. You can fill them in yourself or try again.');
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleSave(values: ObservationFormValues) {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await saveObservation({
        ...values,
        domain: 'problem',
        focus,
        source_node_key: values.source_node_key ?? sourceNodeKey ?? null,
      });

      reset(getDefaultValues(focus, sourceNodeKey, result.observation));
      onSaved?.(result.observation);
    } catch (error) {
      console.error('[PROBLEM OBSERVATION FORM]', error);

      setSaveError(
        error instanceof Error
          ? error.message
          : 'Something went wrong saving your observation.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Something you noticed
        </p>

        <h2 className="text-xl font-semibold">
          {observation ? 'Add to what you noticed' : 'Record what you noticed'}
        </h2>

        <p className="text-sm text-muted-foreground">
          Describe it in your own words. You don’t need to answer every question now—you can add more whenever you like.
        </p>
      </div>

      {/* Basic observation: keep capture quick and approachable. */}
      <section className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="problem-observation-title">Give it a short title</Label>
          <Input
            id="problem-observation-title"
            placeholder="e.g. Restaurant menus are often out of date"
            maxLength={120}
            autoFocus
            {...register('title')}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-observation-content">What did you notice?</Label>
          <Textarea
            id="problem-observation-content"
            placeholder="Describe what you saw, heard, experienced, or someone told you."
            rows={4}
            {...register('content')}
          />
          {errors.content && (
            <p className="text-sm text-destructive">{errors.content.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-observation-context">
            Where did you notice this? <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="problem-observation-context"
            placeholder="A place, situation, conversation, or setting"
            {...register('context')}
          />
          {errors.context && (
            <p className="text-sm text-destructive">{errors.context.message}</p>
          )}
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div>
          <p className="font-medium">Want help filling in the details?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We can suggest a few details from your description. You can review and change every suggestion. Your original words will stay as they are.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleExtractDetails} disabled={isExtracting || isSaving || !watch('content').trim()} className="gap-2">
          {isExtracting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isExtracting ? 'Looking for details…' : 'Suggest details for me'}
        </Button>
        {extractionNotice && <p role="status" className="text-sm text-muted-foreground">{extractionNotice}</p>}
        {extractionError && <p role="alert" className="text-sm text-destructive">{extractionError}</p>}
      </section>

      {/* Optional detail fields stay hidden until the user asks for them. */}
      <section className="space-y-4 border-t pt-5">
        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between"
            aria-expanded={showMoreDetails}
            onClick={() => setShowMoreDetails((current) => !current)}
            disabled={isSaving}
          >
            <span>{showMoreDetails ? 'Hide extra details' : 'Add a few more details'}</span>
            {showMoreDetails ? (
              <ChevronUp className="ml-2 size-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="ml-2 size-4" aria-hidden="true" />
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            All optional. Add what you know now, or come back to it later.
          </p>
        </div>

        {showMoreDetails && (
          <div className="space-y-5 rounded-lg border bg-muted/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="problem-who">Who experiences this?</Label>
              <Textarea
                id="problem-who"
                placeholder="The people who run into this"
                rows={2}
                {...register('problem_details.who')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem-where">Where does this usually happen?</Label>
              <Input
                id="problem-where"
                placeholder="A place or situation"
                {...register('problem_details.where')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem-when">When does it happen?</Label>
              <Input
                id="problem-when"
                placeholder="When or under what circumstances?"
                {...register('problem_details.when')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem-workaround">How do people deal with it now?</Label>
              <Textarea
                id="problem-workaround"
                placeholder="Things people try, people they ask, or ways they work around it"
                rows={2}
                {...register('problem_details.workaround')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem-current-option">What do people try instead?</Label>
              <Textarea
                id="problem-current-option"
                placeholder="Anything people already use or do"
                rows={2}
                {...register('problem_details.current_option')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem-frequency">How often does this come up?</Label>
              <Input
                id="problem-frequency"
                placeholder="Daily, weekly, occasionally, every time..."
                {...register('problem_details.frequency')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem-cost">What does it take from people?</Label>
              <Textarea
                id="problem-cost"
                placeholder="Time, money, effort, missed chances, or frustration"
                rows={2}
                {...register('problem_details.cost')}
              />
            </div>
          </div>
        )}
      </section>

      {saveError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {saveError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <p className="text-xs text-muted-foreground">
          {observation
            ? isDirty
              ? 'You have unsaved changes.'
              : 'Your saved observation is up to date.'
            : 'A title and description are enough to get started.'}
        </p>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSaving}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}

          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving
              ? 'Saving…'
              : observation
                ? 'Save changes'
                : 'Save observation'}
          </Button>
        </div>
      </div>
    </form>
  );
}
