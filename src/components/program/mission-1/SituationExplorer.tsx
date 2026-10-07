'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import type { NodeComponentProps } from '@/components/program/componentRegistry';

import { $userContext, userContextActions } from '@/lib/stores/user-context';
import { updateUserProgramContext } from '@/actions/user-context';
import { analyzeSituation } from '@/actions/responses/mission1';

type SituationReflection = {
  acknowledgment: string;
  bridge: string;
};

export function SituationExplorer({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);

  const savedStartDrive =
    contextState.userContext?.start_drive ?? '';

  const savedReflection = progress.payload?.reflection as
    | SituationReflection
    | undefined;

  const [startDrive, setStartDrive] = useState(savedStartDrive);

  const [hasSaved, setHasSaved] = useState(
    Boolean(savedStartDrive.trim())
  );

  const [reflection, setReflection] =
    useState<SituationReflection | null>(
      savedReflection?.acknowledgment && savedReflection?.bridge
        ? savedReflection
        : null
    );

  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  /*
   * If the node already has an AI reflection saved in progress,
   * restore it when revisiting the node.
   */
  useEffect(() => {
    const saved = progress.payload?.reflection as
      | SituationReflection
      | undefined;

    if (saved?.acknowledgment && saved?.bridge) {
      setReflection(saved);
    }
  }, [progress.payload]);

  const canSave = startDrive.trim().length > 0;

  async function handleSave() {
    if (!canSave || isSaving || isAnalyzing) return;

    setIsSaving(true);
    setError(null);

    try {
      const value = startDrive.trim();

      /*
       * First save the user's own words.
       * This is the durable source of truth.
       */
      const result = await updateUserProgramContext({
        start_drive: value,
      });

      userContextActions.updateContextLocally(
        result.userContext
      );

      setStartDrive(result.userContext.start_drive ?? value);
      setHasSaved(true);

      /*
       * Then ask AI to reflect the context and create the
       * bridge into the investigation.
       */
      setIsAnalyzing(true);

      try {
        const aiResult = await analyzeSituation(
          value,
          nodeKey
        );

        setReflection({
          acknowledgment: aiResult.acknowledgment,
          bridge: aiResult.bridge,
        });
      } catch (aiError) {
        /*
         * AI is an enhancement, not a dependency.
         *
         * If the call fails, provide a grounded fallback so
         * the user can still continue.
         */
        console.error(
          '[SITUATION EXPLORER AI]',
          aiError
        );

        setReflection({
          acknowledgment:
            'Whatever brought you here, it is part of the context you are starting from.',
          bridge:
            'Now let’s look at the other side of that story: what has been keeping you from starting?',
        });
      }
    } catch (err) {
      console.error('[SITUATION EXPLORER]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your response.'
      );
    } finally {
      setIsSaving(false);
      setIsAnalyzing(false);
    }
  }

  async function handleComplete() {
    if (
      !hasSaved ||
      isCompleting ||
      !reflection
    ) {
      return;
    }

    setIsCompleting(true);
    setError(null);

    try {
      await onComplete({
        startDrive: startDrive.trim(),
        reflection,
        completed: true,
      });
    } catch (err) {
      console.error(
        '[SITUATION EXPLORER COMPLETE]',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong completing this step.'
      );

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
            disabled={isSaving || isAnalyzing}
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
              disabled={
                !canSave ||
                isSaving ||
                isAnalyzing
              }
              className="gap-2"
            >
              {isSaving || isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isAnalyzing
                    ? 'Listening...'
                    : 'Saving...'}
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
        /* CONTEXT + BRIDGE                                 */
        /* ------------------------------------------------ */

        <div className="max-w-3xl space-y-10">
          {/* User's own words */}
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

          {/* AI reflection */}
          {reflection && (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />

                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    What we're hearing
                  </p>
                </div>

                <p className="text-xl leading-9 text-foreground">
                  {reflection.acknowledgment}
                </p>
              </div>

              <div className="space-y-5 border-t border-border pt-8">
                <p className="text-lg leading-8 text-muted-foreground">
                  {reflection.bridge}
                </p>

                <div className="rounded-2xl bg-muted/50 p-6 sm:p-8">
                  <p className="text-2xl font-semibold leading-9 text-foreground">
                    Why haven't you started?
                  </p>

                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    We won't assume we know the answer.
                    Over the next few quests, we'll
                    investigate what has actually been
                    getting in your way.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading state while AI reflects */}
          {isAnalyzing && !reflection && (
            <div className="flex items-center gap-3 py-4 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />

              <span>
                Taking a moment to understand what brought
                you here...
              </span>
            </div>
          )}

          {error && (
            <p className="text-sm leading-6 text-destructive">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setHasSaved(false);
                setReflection(null);
              }}
              disabled={isCompleting}
            >
              Edit
            </Button>

            <Button
              onClick={handleComplete}
              disabled={
                isCompleting ||
                isAnalyzing ||
                !reflection
              }
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