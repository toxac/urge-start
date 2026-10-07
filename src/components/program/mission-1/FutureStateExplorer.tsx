'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

import { updateUserProgramContext } from '@/actions/user-context';
import {
  $userContext,
  userContextActions,
} from '@/lib/stores/user-context';

type DesiredFutureContext = {
  reflection?: string;
};

export function FutureStateExplorer({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);

  const savedContext =
    contextState.userContext?.desired_future as
      | DesiredFutureContext
      | null
      | undefined;

  const progressPayload = progress.payload ?? {};

  const [reflection, setReflection] = useState('');
  const [mode, setMode] = useState<'write' | 'review'>('write');

  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contextState.isHydrated) return;

    if (savedContext?.reflection) {
      setReflection(savedContext.reflection);
      setMode('review');
      return;
    }

    if (
      typeof progressPayload.reflection === 'string' &&
      progressPayload.reflection.trim()
    ) {
      setReflection(progressPayload.reflection);
    }
  }, [
    contextState.isHydrated,
    contextState.userContext?.desired_future,
  ]);

  const canContinue = reflection.trim().length >= 20;

  async function saveFuture() {
    if (!canContinue || isSaving) return;

    setIsSaving(true);
    setError(null);

    const value = reflection.trim();

    try {
      const result = await updateUserProgramContext({
        desired_future: {
          reflection: value,
        },
      });

      userContextActions.updateContextLocally(
        result.userContext
      );

      setReflection(value);
      setMode('review');

      await onComplete({
        reflection: value,
        completed: true,
      });
    } catch (err) {
      console.error('[FUTURE STATE EXPLORER]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your reflection.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleContinue() {
    if (isCompleting) return;

    setIsCompleting(true);
    setError(null);

    try {
      await onComplete({
        reflection: reflection.trim(),
        completed: true,
      });
    } catch (err) {
      console.error(
        '[FUTURE STATE EXPLORER COMPLETE]',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong completing this step.'
      );
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12">
      {mode === 'write' && (
        <>
          <div className="max-w-3xl space-y-5">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {node.title}
            </h1>

            <p className="text-lg leading-8 text-muted-foreground">
              You have looked at what gets in your way and
              what keeps bringing you back.
            </p>

            <p className="text-lg leading-8 text-muted-foreground">
              Now imagine that you actually make this happen.
              Not the business plan. Not the numbers. Your
              life.
            </p>

            <p className="text-lg leading-8 text-muted-foreground">
              What would be different?
            </p>
          </div>

          <div className="max-w-3xl space-y-5">
            <label className="text-lg font-medium text-foreground">
              If you make this happen, what changes for you?
            </label>

            <Textarea
              value={reflection}
              onChange={(event) =>
                setReflection(event.target.value)
              }
              placeholder={
                'My life or work would be different because...'
              }
              rows={10}
              autoFocus
              disabled={isSaving}
              className="resize-none text-base leading-7"
            />

            <div className="space-y-2">
              <p className="text-sm leading-6 text-muted-foreground">
                Think beyond the idea itself. What would
                change about your work, your time, your choices,
                the people you help, or how you feel about
                yourself?
              </p>

              <p className="text-sm leading-6 text-muted-foreground">
                Write what you actually want, not what you
                think you are supposed to want.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <Button
                onClick={saveFuture}
                disabled={!canContinue || isSaving}
                className="h-12 gap-2 rounded-full px-8 text-base"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {mode === 'review' && (
        <>
          <div className="max-w-3xl space-y-5">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              What would be different
            </p>

            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              This is the change you are trying to create.
            </h1>

            <p className="text-lg leading-8 text-muted-foreground">
              Keep this in your own words. You don't need to
              turn it into a plan yet.
            </p>
          </div>

          <div className="max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-8">
            <p className="whitespace-pre-wrap text-lg leading-8 text-foreground">
              {reflection}
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex max-w-3xl items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode('write')}
              disabled={isCompleting}
            >
              Edit
            </Button>

            <Button
              onClick={handleContinue}
              disabled={isCompleting}
              className="h-12 gap-2 rounded-full px-8 text-base"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Continuing...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}