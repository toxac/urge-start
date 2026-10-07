'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import type { NodeComponentProps } from '@/components/program/componentRegistry';

import { $userContext, userContextActions } from '@/lib/stores/user-context';
import { updateUserProgramContext } from '@/actions/user-context';

export function SituationExplorer({
  node,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);

  const savedStartDrive =
    contextState.userContext?.start_drive ?? '';

  const [startDrive, setStartDrive] =
    useState(savedStartDrive);

  const [hasSaved, setHasSaved] = useState(
    Boolean(savedStartDrive.trim())
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * Hydrate the local field from the unified user context.
   *
   * This matters when the store is hydrated after the component
   * has already mounted.
   */
  useEffect(() => {
    const value =
      contextState.userContext?.start_drive ?? '';

    setStartDrive(value);
    setHasSaved(Boolean(value.trim()));
  }, [
    contextState.isHydrated,
    contextState.userContext?.start_drive,
  ]);

  const canSave = startDrive.trim().length > 0;

  async function handleSave() {
    if (!canSave || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const value = startDrive.trim();

      const result = await updateUserProgramContext({
        start_drive: value,
      });

      /*
       * Keep the unified client-side context in sync with
       * the database immediately.
       */
      userContextActions.updateContextLocally(
        result.userContext
      );

      setStartDrive(result.userContext.start_drive ?? value);
      setHasSaved(true);
    } catch (err) {
      console.error('[SITUATION EXPLORER]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your response.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleComplete() {
    if (!hasSaved || isCompleting) return;

    setIsCompleting(true);
    setError(null);

    try {
      await onComplete({
        startDrive,
        completed: true,
      });
    } catch (err) {
      console.error('[SITUATION EXPLORER COMPLETE]', err);

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
    <div className="w-full space-y-12 pb-12">
      {/* ------------------------------------------------ */}
      {/* OPENING                                          */}
      {/* ------------------------------------------------ */}

      <div className="max-w-3xl space-y-5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'What brought you here?'}
        </h1>

        <p className="text-lg leading-8 text-muted-foreground">
          Before we start investigating why you haven't
          started, let's begin with something simpler.
        </p>

        <p className="text-lg leading-8 text-muted-foreground">
          What made you come to Urge and start this journey
          now?
        </p>
      </div>

      {/* ------------------------------------------------ */}
      {/* START DRIVE                                      */}
      {/* ------------------------------------------------ */}

      {!hasSaved ? (
        <div className="max-w-3xl space-y-5">
          <Textarea
            value={startDrive}
            onChange={(event) =>
              setStartDrive(event.target.value)
            }
            placeholder="Maybe I'm frustrated with my work... Maybe I've had an idea for years... Maybe I'm stuck and want to do something different..."
            rows={7}
            autoFocus
            disabled={isSaving}
            className="resize-none text-base leading-7"
          />

          <p className="text-sm leading-6 text-muted-foreground">
            There is no right answer. Tell us what actually
            brought you here.
          </p>

          {error && (
            <p className="text-sm leading-6 text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* ------------------------------------------------ */
        /* SAVED START DRIVE                                */
        /* ------------------------------------------------ */

        <div className="max-w-3xl space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                What brought you here
              </p>

              <p className="text-lg leading-8 text-foreground">
                {startDrive}
              </p>
            </div>
          </div>

          {/* -------------------------------------------- */}
          {/* TRANSITION                                   */}
          {/* -------------------------------------------- */}

          <div className="space-y-5 border-t border-border pt-8">
            <div className="space-y-3">
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Now let's investigate something different.
              </h2>

              <p className="text-lg leading-8 text-muted-foreground">
                Knowing what brought you here is one thing.
                Understanding what has kept you from starting
                is another.
              </p>
            </div>

            <div className="rounded-2xl bg-muted/50 p-6">
              <p className="text-xl font-medium leading-8">
                Why haven't you started?
              </p>

              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Over the next four quests, we'll investigate
                different possibilities. You won't have to
                guess. You'll look at what is actually getting
                in your way.
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm leading-6 text-destructive">
              {error}
            </p>
          )}

          {/* -------------------------------------------- */}
          {/* ACTIONS                                      */}
          {/* -------------------------------------------- */}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setHasSaved(false)}
              disabled={isCompleting}
            >
              Edit
            </Button>

            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className="gap-2"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  Begin the investigation
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}