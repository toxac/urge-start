
'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { saveObservation } from '@/actions/observations';

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

const qualificationOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'not_sure', label: 'Not sure yet' },
  { value: 'no', label: 'No' },
] as const;

function toNullableBoolean(value: string): boolean | null {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function toBooleanSelectValue(
  value: boolean | null | undefined,
): string {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return '';
}

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

  const form = useForm<ObservationFormValues>({
    resolver: zodResolver(
    validatedObservationSchema,
  ) as Resolver<ObservationFormValues>,
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

  const details = watch('problem_details');

  // Reset the form when switching between observations or focus types.
  useEffect(() => {
    reset(getDefaultValues(focus, sourceNodeKey, observation));
    setSaveError(null);
  }, [focus, sourceNodeKey, observation, reset]);

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

  function updateBoolean(
    field: 'is_existing' | 'can_reach',
    value: string,
  ) {
    setValue(`problem_details.${field}`, toNullableBoolean(value), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function updateQualification(
    field: 'understands' | 'cares' | 'can_solve',
    value: string,
  ) {
    setValue(
      `problem_details.${field}`,
      value === '' ? null : (value as 'yes' | 'not_sure' | 'no'),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  }

  const isExistingValue = toBooleanSelectValue(details?.is_existing);
  const canReachValue = toBooleanSelectValue(details?.can_reach);

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Problem observation
        </p>

        <h2 className="text-xl font-semibold">
          {observation ? 'Add details to your observation' : 'Record what you noticed'}
        </h2>

        <p className="text-sm text-muted-foreground">
          Capture what happened in your own words. You don't need to
          answer every question now. You can return and add details later.
        </p>
      </div>

      {/* Basic observation */}

      <section className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="problem-observation-title">
            Short title
          </Label>

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
            placeholder="Describe what you saw, heard, experienced, or someone told you."
            rows={5}
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
            Additional context (optional)
          </Label>

          <Textarea
            id="problem-observation-context"
            placeholder="Anything else that will help you remember the situation?"
            rows={3}
            {...register('context')}
          />

          {errors.context && (
            <p className="text-sm text-destructive">
              {errors.context.message}
            </p>
          )}
        </div>
      </section>

      {/* Understand the problem */}

      <section className="space-y-5 border-t pt-6">
        <div>
          <h3 className="font-semibold">Understand the problem</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add what you know. Leave anything you're unsure about blank.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-who">Who experiences this?</Label>
          <Textarea
            id="problem-who"
            placeholder="Who is affected?"
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
            onChange={(event) =>
              updateBoolean('is_existing', event.target.value)
            }
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
            onChange={(event) =>
              updateBoolean('can_reach', event.target.value)
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Not answered</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </section>

      {/* Existing alternatives and friction */}

      <section className="space-y-5 border-t pt-6">
        <div>
          <h3 className="font-semibold">What happens today?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            These details can help you understand how people deal with
            the problem right now.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-workaround">
            How do people work around it?
          </Label>
          <Textarea
            id="problem-workaround"
            placeholder="Do they improvise, ask someone for help, or put up with it?"
            rows={3}
            {...register('problem_details.workaround')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-current-option">
            What options or solutions already exist?
          </Label>
          <Textarea
            id="problem-current-option"
            placeholder="Tools, services, alternatives, or existing ways of doing things"
            rows={3}
            {...register('problem_details.current_option')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-cost">
            What does it cost people? (optional)
          </Label>
          <Textarea
            id="problem-cost"
            placeholder="Money, time, effort, missed opportunities, or frustration"
            rows={2}
            {...register('problem_details.cost')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-frequency">
            How often does it happen? (optional)
          </Label>
          <Input
            id="problem-frequency"
            placeholder="Daily, weekly, occasionally, every time..."
            {...register('problem_details.frequency')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-why-unsolved">
            Why might it still be a problem?
          </Label>
          <Textarea
            id="problem-why-unsolved"
            placeholder="What makes it difficult to solve, if you know?"
            rows={3}
            {...register('problem_details.why_unsolved')}
          />
        </div>
      </section>

      {/* Early qualification */}

      <section className="space-y-5 border-t pt-6">
        <div>
          <h3 className="font-semibold">Your current understanding</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            These are early reflections, not a test. It's fine to choose
            “Not sure yet.”
          </p>
        </div>

        {(
          [
            {
              field: 'understands',
              label: 'Do you understand this problem well?',
            },
            {
              field: 'cares',
              label: 'Does solving this problem matter to you?',
            },
            {
              field: 'can_solve',
              label: 'Could you imagine helping solve it?',
            },
          ] as const
        ).map(({ field, label }) => (
          <div key={field} className="space-y-2">
            <Label htmlFor={`problem-${field}`}>{label}</Label>

            <select
              id={`problem-${field}`}
              value={details?.[field] ?? ''}
              onChange={(event) =>
                updateQualification(field, event.target.value)
              }
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
