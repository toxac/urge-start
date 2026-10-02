'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Json } from '@/database.types';
import { completeNode } from '@/lib/progress/client';
import { updateProgressAfterCompletion, setProgressSaving } from '@/lib/stores/progress-store';
import { updateProgramAfterCompletion } from '@/lib/stores/program-store';
import { getSituationDraft, saveSituation } from '@/lib/program/situation/actions';
import { situationSchema, type SituationFormValues } from '@/lib/program/situation/schema';

const options = [
  { value: 'have-idea', title: 'I have an idea', description: 'There is something I keep thinking about.' },
  { value: 'exploring', title: 'I’m exploring', description: 'I want to do something, but don’t know what yet.' },
  { value: 'unsure', title: 'I’m not sure yet', description: 'I’m still working out what starting means for me.' },
] as const;

export function SituationExplorer() {
  const router = useRouter();
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register, handleSubmit, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm<SituationFormValues>({
    resolver: zodResolver(situationSchema),
    defaultValues: { startingPoint: 'exploring', whatBroughtYouHere: '', ideaDescription: '' },
    mode: 'onBlur',
  });

  const startingPoint = watch('startingPoint');

  useEffect(() => {
    let cancelled = false;
    async function loadDraft() {
      try {
        const draft = await getSituationDraft();
        if (!cancelled && draft) reset(draft);
      } catch {
        // Draft loading is best-effort; it must not block a first-time user.
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    }
    void loadDraft();
    return () => { cancelled = true; };
  }, [reset]);

  async function onSubmit(values: SituationFormValues) {
    setSubmitError(null);
    setProgressSaving(true);
    try {
      const saved = await saveSituation(values);
      const payload = {
        startingPoint: values.startingPoint,
        whatBroughtYouHere: values.whatBroughtYouHere,
        ideaDescription: values.ideaDescription ?? '',
        observationId: saved.observationId,
        opportunityId: saved.opportunityId,
      } satisfies Json;

      const snapshot = await completeNode('m1-setup', payload);
      updateProgressAfterCompletion(snapshot);
      updateProgramAfterCompletion(snapshot);
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong while saving. Your answers are still here; please try again.');
    } finally {
      setProgressSaving(false);
    }
  }

  const busy = isSubmitting || loadingDraft;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#FF502F]">Mission 1 · Move Before Ready</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">Where are you starting from?</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-neutral-600">
          So… where are you right now? There’s no right answer, and you don’t need to have a business idea figured out. Let’s start with what’s actually going on.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <fieldset disabled={busy} className="space-y-3">
          <legend className="mb-3 text-lg font-medium text-neutral-900">Which feels closest to where you are?</legend>
          {options.map((option) => {
            const selected = startingPoint === option.value;
            return (
              <label key={option.value} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${selected ? 'border-[#FF502F] bg-orange-50 ring-1 ring-[#FF502F]' : 'border-neutral-200 bg-white hover:border-neutral-400'}`}>
                <input type="radio" value={option.value} {...register('startingPoint')} className="mt-1 accent-[#FF502F]" />
                <span>
                  <span className="block font-medium text-neutral-950">{option.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-neutral-600">{option.description}</span>
                </span>
              </label>
            );
          })}
          {errors.startingPoint && <p role="alert" className="text-sm text-red-600">{errors.startingPoint.message}</p>}
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="whatBroughtYouHere" className="block text-lg font-medium text-neutral-900">What made you start thinking about this?</label>
          <p className="text-sm leading-6 text-neutral-600">It could be something that happened, something you’re tired of, or a thought that keeps coming back. Write it the way you’d say it.</p>
          <textarea id="whatBroughtYouHere" rows={4} {...register('whatBroughtYouHere')} aria-invalid={Boolean(errors.whatBroughtYouHere)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-[#FF502F] focus:ring-2 focus:ring-orange-100" placeholder="I’ve been thinking about…" />
          {errors.whatBroughtYouHere && <p role="alert" className="text-sm text-red-600">{errors.whatBroughtYouHere.message}</p>}
        </div>

        {startingPoint === 'have-idea' && (
          <div className="space-y-2 rounded-2xl bg-neutral-50 p-4 sm:p-5">
            <label htmlFor="ideaDescription" className="block text-lg font-medium text-neutral-900">Tell me about the idea</label>
            <p className="text-sm leading-6 text-neutral-600">Don’t worry about whether it’s good, practical, or ready. Just describe what’s been on your mind.</p>
            <textarea id="ideaDescription" rows={4} {...register('ideaDescription')} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-[#FF502F] focus:ring-2 focus:ring-orange-100" placeholder="The idea I keep coming back to is…" />
            <p className="text-xs leading-5 text-neutral-500">We’re recording it, not evaluating it.</p>
          </div>
        )}

        {submitError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{submitError}</div>}

        <div className="border-t border-neutral-200 pt-5">
          <p className="mb-4 text-sm leading-6 text-neutral-500">You can change your answers before continuing. We’ll save what you’ve shared as the starting point for the next part.</p>
          <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#FF502F] px-6 py-3 font-medium text-white transition hover:bg-[#e94729] focus:outline-none focus:ring-2 focus:ring-[#FF502F] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            {isSubmitting ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </form>
    </main>
  );
}