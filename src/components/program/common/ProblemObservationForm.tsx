
'use client';

import { useEffect, useState } from 'react';
import { Edit3, Loader2, Save, Sparkles, X } from 'lucide-react';
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

type ExtractionMetadata = {
  status: 'failed' | 'succeeded';
  attempted_at: string;
};

type ProblemObservationFormProps = {
  focus: ProblemObservationFocus;
  observation?: UserObservation | null;
  sourceNodeKey?: string;
  onSaved?: (observation: UserObservation) => void;
  onCancel?: () => void;
};

const qualificationOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'not_sure', label: 'Not sure yet' },
  { value: 'no', label: 'No' },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getProblemDetails(
  observation?: UserObservation | null,
): ProblemDetails {
  const details = observation?.problem_details;
  return isRecord(details) ? (details as ProblemDetails) : {};
}

function getMetadata(
  observation?: UserObservation | null,
): Record<string, unknown> {
  return isRecord(observation?.metadata) ? observation.metadata : {};
}

function getExtractionMetadata(
  observation?: UserObservation | null,
): ExtractionMetadata | null {
  const extraction = getMetadata(observation).problem_detail_extraction;

  if (
    isRecord(extraction) &&
    (extraction.status === 'failed' ||
      extraction.status === 'succeeded') &&
    typeof extraction.attempted_at === 'string'
  ) {
    return extraction as ExtractionMetadata;
  }

  return null;
}

function withExtractionStatus(
  observation: UserObservation | null | undefined,
  status: ExtractionMetadata['status'],
): Record<string, unknown> {
  return {
    ...getMetadata(observation),
    problem_detail_extraction: {
      status,
      attempted_at: new Date().toISOString(),
    },
  };
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

function toBooleanSelectValue(
  value: boolean | null | undefined,
): string {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return '';
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
  const [isEditing, setIsEditing] = useState(!observation);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionNotice, setExtractionNotice] = useState<string | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] =
    useState<ExtractionMetadata | null>(() => getExtractionMetadata(observation));

  const form = useForm<ObservationFormValues>({
    resolver: zodResolver(
      validatedObservationSchema,
    ) as Resolver<ObservationFormValues>,
    defaultValues: getDefaultValues(focus, sourceNodeKey, observation),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = form;

  const details = watch('problem_details');
  const content = watch('content');
  const isExistingValue = toBooleanSelectValue(details?.is_existing);
  const canReachValue = toBooleanSelectValue(details?.can_reach);

  useEffect(() => {
    reset(getDefaultValues(focus, sourceNodeKey, observation));
    setSaveError(null);
    setExtractionNotice(null);
    setExtractionError(null);
    setExtractionStatus(getExtractionMetadata(observation));
    setIsEditing(!observation);
  }, [focus, sourceNodeKey, observation, reset]);

  function updateBoolean(
    field: 'is_existing' | 'can_reach',
    value: string,
  ) {
    setValue(
      `problem_details.${field}`,
      value === '' ? null : value === 'true',
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function updateQualification(
    field: 'understands' | 'cares' | 'can_solve',
    value: string,
  ) {
    setValue(
      `problem_details.${field}`,
      value === ''
        ? null
        : (value as 'yes' | 'not_sure' | 'no'),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  async function handleExtractDetails() {
    const narrative = content?.trim();

    if (!narrative) {
      setExtractionError(
        'Add a description first, then we can help organise the details.',
      );
      return;
    }

    if (isExtracting || isSaving) return;

    setIsExtracting(true);
    setExtractionError(null);
    setExtractionNotice(null);

    try {
      const extracted = await extractProblemDetails(
        narrative,
        sourceNodeKey ?? observation?.source_node_key ?? '',
      );

      const fields = [
        'who',
        'where',
        'when',
        'workaround',
        'current_option',
        'why_unsolved',
      ] as const;

      let added = 0;

      for (const field of fields) {
        const current = watch(`problem_details.${field}`);
        const suggestion = extracted[field];

        if (
          (current === '' || current == null) &&
          typeof suggestion === 'string' &&
          suggestion.trim()
        ) {
          setValue(`problem_details.${field}`, suggestion, {
            shouldDirty: true,
            shouldValidate: true,
          });
          added += 1;
        }
      }

      // Record the successful attempt immediately. The form save below
      // will also save the updated problem details and metadata together.
      setExtractionStatus({
        status: 'succeeded',
        attempted_at: new Date().toISOString(),
      });

      setValue(
        'metadata',
        withExtractionStatus(observation, 'succeeded'),
        { shouldDirty: true },
      );

      setExtractionNotice(
        added > 0
          ? 'Suggestions added. Review them, change anything that feels wrong, then save.'
          : 'No new details were found. You can fill in the fields yourself.',
      );
    } catch (error) {
      console.error('[PROBLEM OBSERVATION EXTRACTION]', error);

      const failedAt = new Date().toISOString();
      setExtractionStatus({ status: 'failed', attempted_at: failedAt });
      setExtractionError(
        'We couldn’t organise the details just now. Your description is safe; you can try again or fill in the fields yourself.',
      );

      // Persist the failure so it remains available after a refresh.
      if (observation) {
        try {
          const result = await saveObservation({
            observation_id: observation.id,
            title: observation.title,
            content: observation.content,
            metadata: {
              ...getMetadata(observation),
              problem_detail_extraction: {
                status: 'failed',
                attempted_at: new Date().toISOString(),
              },
            },
          });

          onSaved?.(result.observation as UserObservation);
        } catch (metadataError) {
          console.error(
            '[PROBLEM OBSERVATION EXTRACTION STATUS]',
            metadataError,
          );
          setExtractionError(
            'Extraction failed, but we couldn’t save its status. Your observation remains available; try saving your changes.',
          );
        }
      }
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
        source_node_key:
          values.source_node_key ?? sourceNodeKey ?? null,
      });

      const saved = result.observation as UserObservation;
      reset(getDefaultValues(focus, sourceNodeKey, saved));
      setExtractionStatus(getExtractionMetadata(saved));
      onSaved?.(saved);

      if (observation) setIsEditing(false);
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

  if (observation && !isEditing) {
    const savedDetails = getProblemDetails(observation);

    const detailRows: [string, string | boolean | null | undefined][] = [
      ['Who experiences this?', savedDetails.who],
      ['Where does it happen?', savedDetails.where],
      ['When does it happen?', savedDetails.when],
      [
        'Can you reach them?',
        savedDetails.can_reach == null
          ? ''
          : savedDetails.can_reach
            ? 'Yes'
            : 'No / not yet',
      ],
      ['How do they deal with it now?', savedDetails.workaround],
      ['What do they try instead?', savedDetails.current_option],
      ['How often does it happen?', savedDetails.frequency],
      ['What does it cost them?', savedDetails.cost],
      ['Why hasn’t it been solved?', savedDetails.why_unsolved],
    ];

    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Something you noticed
          </p>
          <h2 className="text-xl font-semibold">Your observation</h2>
          <h3 className="text-2xl font-semibold tracking-tight">
            {observation.title}
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {observation.content}
          </p>
          {observation.context && (
            <p className="text-sm text-muted-foreground">
              Context: {observation.context}
            </p>
          )}
        </header>

        <section className="space-y-3 border-t pt-5">
          <h3 className="font-semibold">Details about the problem</h3>
          {detailRows.some(([, value]) => value !== '' && value != null) ? (
            detailRows
              .filter(([, value]) => value !== '' && value != null)
              .map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {label}
                  </p>
                  <p className="whitespace-pre-wrap text-sm">
                    {String(value)}
                  </p>
                </div>
              ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No problem details added yet.
            </p>
          )}
        </section>

        {extractionStatus?.status === 'failed' && (
          <p className="text-sm text-muted-foreground">
            Automatic detail extraction previously failed. Choose Edit
            to retry or add the details yourself.
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              <X className="mr-2 size-4" />
              Close
            </Button>
          )}
          <Button
            type="button"
            onClick={() => setIsEditing(true)}
            className="gap-2 bg-[#FF502F] text-white hover:bg-[#E94729]"
          >
            <Edit3 className="size-4" />
            Edit observation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Something you noticed
        </p>
        <h2 className="text-xl font-semibold">
          {observation ? 'Edit Observation' : 'Record what you noticed'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Keep your original observation in your own words. Add details
          when you know them; it’s fine to leave uncertain answers blank.
        </p>
      </header>

      <section className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="problem-observation-title">Short title</Label>
          <Input
            id="problem-observation-title"
            placeholder="e.g. Restaurant menus are often out of date"
            maxLength={120}
            {...register('title')}
          />
          {errors.title && (
            <p className="text-sm text-destructive">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-observation-content">
            What did you notice?
          </Label>
          <Textarea
            id="problem-observation-content"
            rows={4}
            placeholder="Describe what you saw, heard, experienced, or someone told you."
            {...register('content')}
          />
          {errors.content && (
            <p className="text-sm text-destructive">
              {errors.content.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-observation-context">
            Extra context <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="problem-observation-context"
            rows={2}
            placeholder="Anything that will help you remember the situation"
            {...register('context')}
          />
          {errors.context && (
            <p className="text-sm text-destructive">
              {errors.context.message}
            </p>
          )}
        </div>
      </section>

      {extractionStatus?.status === 'failed' && observation && (
        <section className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            We couldn’t organise the details last time. You can try again;
            any details you’ve already entered will be preserved.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleExtractDetails}
            disabled={isExtracting || isSaving || !content?.trim()}
            className="mt-3 gap-2"
          >
            {isExtracting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {isExtracting ? 'Looking for details…' : 'Try extraction again'}
          </Button>
          {extractionNotice && (
            <p role="status" className="mt-2 text-sm text-muted-foreground">
              {extractionNotice}
            </p>
          )}
          {extractionError && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {extractionError}
            </p>
          )}
        </section>
      )}

      <section className="space-y-5 border-t pt-5">
        <div>
          <h3 className="font-semibold">Details about the problem</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add what you know. These details help you decide whether this
            is a problem you can investigate and reach people about.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-who">Who experiences this?</Label>
          <Textarea
            id="problem-who"
            placeholder="Me, my family, people I work with, a particular group…"
            rows={2}
            {...register('problem_details.who')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-where">Where does it happen?</Label>
          <Input
            id="problem-where"
            placeholder="A place, situation, industry, or setting"
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
          <Label htmlFor="problem-is-existing">
            Is this a problem you personally experience?
          </Label>
          <select
            id="problem-is-existing"
            value={isExistingValue}
            onChange={(event) => updateBoolean('is_existing', event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Not answered</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-can-reach">
            Can you reach or talk to the people affected?
          </Label>
          <select
            id="problem-can-reach"
            value={canReachValue}
            onChange={(event) => updateBoolean('can_reach', event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Not answered</option>
            <option value="true">Yes</option>
            <option value="false">No / not yet</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-workaround">
            How do people deal with it now?
          </Label>
          <Textarea
            id="problem-workaround"
            rows={2}
            placeholder="Things people try, people they ask, or ways they work around it"
            {...register('problem_details.workaround')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-current-option">
            What options or solutions already exist?
          </Label>
          <Textarea
            id="problem-current-option"
            rows={2}
            placeholder="Tools, services, alternatives, or existing ways of doing things"
            {...register('problem_details.current_option')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-frequency">
            How often does it happen?
          </Label>
          <Input
            id="problem-frequency"
            placeholder="Daily, weekly, occasionally, every time…"
            {...register('problem_details.frequency')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-cost">
            What does it cost people?
          </Label>
          <Textarea
            id="problem-cost"
            rows={2}
            placeholder="Money, time, effort, missed opportunities, or frustration"
            {...register('problem_details.cost')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-why-unsolved">
            Why might it still be a problem?
          </Label>
          <Textarea
            id="problem-why-unsolved"
            rows={2}
            placeholder="What makes it difficult to solve or change?"
            {...register('problem_details.why_unsolved')}
          />
        </div>
      </section>

      <section className="space-y-5 border-t pt-5">
        <div>
          <h3 className="font-semibold">Your current understanding</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            These are early reflections, not a test. It’s fine to choose
            “Not sure yet.”
          </p>
        </div>

        {(
          [
            { field: 'understands', label: 'Do you understand this problem well?' },
            { field: 'cares', label: 'Does solving this problem matter to you?' },
            { field: 'can_solve', label: 'Could you imagine helping solve it?' },
          ] as const
        ).map(({ field, label }) => (
          <div key={field} className="space-y-2">
            <Label htmlFor={`problem-${field}`}>{label}</Label>
            <select
              id={`problem-${field}`}
              value={details?.[field] ?? ''}
              onChange={(event) => updateQualification(field, event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Not answered</option>
              {qualificationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </section>

      {extractionNotice && (
        <p role="status" className="text-sm text-muted-foreground">
          {extractionNotice}
        </p>
      )}
      {extractionError && (
        <p role="alert" className="text-sm text-destructive">
          {extractionError}
        </p>
      )}
      {saveError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {saveError}
        </p>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
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
              onClick={() => {
                if (observation) {
                  reset(getDefaultValues(focus, sourceNodeKey, observation));
                  setSaveError(null);
                  setIsEditing(false);
                }
                onCancel();
              }}
              disabled={isSaving || isExtracting}
            >
              <X className="mr-2 size-4" />
              Cancel
            </Button>
          )}

          <Button type="submit" disabled={isSaving || isExtracting}>
            {isSaving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            {isSaving
              ? 'Saving…'
              : observation
                ? 'Save changes'
                : 'Save observation'}
          </Button>
        </div>
      </footer>
    </form>
  );
}
