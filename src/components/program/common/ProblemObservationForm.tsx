
'use client';

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit3, Loader2, Save, X } from 'lucide-react';

import {
  createObservation,
  updateObservation,
} from '@/actions/observations';

import {
  validatedObservationSchema,
  type ObservationFormValues,
} from '@/lib/schemas/observation';

import type {
  ObservationType,
  ProblemObservationFocus,
  UserObservation,
} from '@/lib/types/observations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  focus: ProblemObservationFocus;
  observation?: UserObservation | null;
  sourceNodeKey?: string;
  onSaved?: (observation: UserObservation) => void;
  onCancel?: () => void;
};

function getDefaults(
  focus: ProblemObservationFocus,
  sourceNodeKey?: string,
  observation?: UserObservation | null,
): ObservationFormValues {
  const details = observation?.problem_details;

  const problemDetails =
    details &&
    typeof details === 'object' &&
    !Array.isArray(details)
      ? (details as Record<string, unknown>)
      : {};

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
      who: typeof problemDetails.who === 'string'
        ? problemDetails.who
        : '',
      where: typeof problemDetails.where === 'string'
        ? problemDetails.where
        : '',
      when: typeof problemDetails.when === 'string'
        ? problemDetails.when
        : '',
    },
  };
}

export function ProblemObservationForm({
  focus,
  observation = null,
  sourceNodeKey,
  onSaved,
  onCancel,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!observation);

  const form = useForm<ObservationFormValues>({
    resolver: zodResolver(
      validatedObservationSchema,
    ) as Resolver<ObservationFormValues>,
    defaultValues: getDefaults(focus, sourceNodeKey, observation),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => {
    reset(getDefaults(focus, sourceNodeKey, observation));
    setSaveError(null);
    setIsEditing(!observation);
  }, [focus, sourceNodeKey, observation, reset]);

  async function handleSave(values: ObservationFormValues) {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = observation
        ? await updateObservation(observation.id, {
            title: values.title,
            content: values.content,
            context: values.context,
          })
        : await createObservation({
            title: values.title,
            content: values.content,
            context: values.context,
            observed_at: values.observed_at,
            type: 'observation',
            domain: 'problem',
            focus,
            source_node_key:
              values.source_node_key ?? sourceNodeKey ?? null,
            problem_details: {
              who: values.problem_details?.who || null,
              where: values.problem_details?.where || null,
              when: values.problem_details?.when || null,
            },
          });

      const savedObservation = result.observation as UserObservation;

      reset(getDefaults(focus, sourceNodeKey, savedObservation));
      onSaved?.(savedObservation);

      if (observation) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('[PROBLEM OBSERVATION FORM] Save failed', error);

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
    const details = observation.problem_details;
    const values =
      details &&
      typeof details === 'object' &&
      !Array.isArray(details)
        ? (details as Record<string, unknown>)
        : {};

    return (
      <div className="space-y-5">
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

          {Boolean(values.who || values.where || values.when) &&(
            <div className="space-y-1 border-t pt-3 text-sm">
              {typeof values.who === 'string' && values.who && (
                <p><strong>Who:</strong> {values.who}</p>
              )}
              {typeof values.where === 'string' && values.where && (
                <p><strong>Where:</strong> {values.where}</p>
              )}
              {typeof values.when === 'string' && values.when && (
                <p><strong>When:</strong> {values.when}</p>
              )}
            </div>
          )}
        </header>

        {saveError && (
          <p role="alert" className="text-sm text-destructive">
            {saveError}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
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
    <form
      onSubmit={handleSubmit(
        handleSave,
        (validationErrors) => {
          console.error(
            '[PROBLEM OBSERVATION FORM] Validation failed',
            validationErrors,
          );
          setSaveError(
            'Please check the highlighted fields before saving.',
          );
        },
      )}
      className="space-y-5"
    >
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Something you noticed
        </p>
        <h2 className="text-xl font-semibold">
          {observation ? 'Edit observation' : 'Record what you noticed'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Capture what you noticed in your own words. You don't need to
          understand the whole problem yet.
        </p>
      </header>

      <section className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="problem-observation-title">Short title</Label>
          <Input
            id="problem-observation-title"
            maxLength={120}
            placeholder="e.g. Restaurant menus are often out of date"
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
          <Label htmlFor="problem-observation-who">Who is affected?</Label>
          <Input
            id="problem-observation-who"
            placeholder="e.g. Restaurant owners and their customers"
            {...register('problem_details.who')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-observation-where">Where does it happen?</Label>
          <Input
            id="problem-observation-where"
            placeholder="e.g. Independent restaurants"
            {...register('problem_details.where')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-observation-when">
            When does it happen?
          </Label>
          <Input
            id="problem-observation-when"
            placeholder="e.g. When prices or dishes change"
            {...register('problem_details.when')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem-observation-context">
            Additional context <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="problem-observation-context"
            rows={2}
            placeholder="Anything else you want to remember about this observation."
            {...register('context')}
          />
          {errors.context && (
            <p className="text-sm text-destructive">
              {errors.context.message}
            </p>
          )}
        </div>
      </section>

      {saveError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
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
              disabled={isSaving}
              onClick={() => {
                if (observation) {
                  reset(getDefaults(focus, sourceNodeKey, observation));
                  setSaveError(null);
                  setIsEditing(false);
                }
                onCancel();
              }}
            >
              <X className="mr-2 size-4" />
              Cancel
            </Button>
          )}

          <Button type="submit" disabled={isSaving}>
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
