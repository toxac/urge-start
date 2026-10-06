'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  observationSchema,
  type ObservationFormValues,
} from '@/lib/schemas/observation';

import type {
  ObservationDomain,
  ObservationType,
  UserObservation,
} from '@/lib/types/observations';

import { saveObservation } from '@/actions/observations';

type ObservationLoggerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  type?: ObservationType;
  domain?: ObservationDomain;
  focus?: string;

  sourceNodeKey?: string;

  onSaved?: (observation: UserObservation) => void;
};

export function ObservationLogger({
  open,
  onOpenChange,
  type,
  domain,
  focus,
  sourceNodeKey,
  onSaved,
}: ObservationLoggerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const form = useForm<ObservationFormValues>({
    resolver: zodResolver(observationSchema),
    defaultValues: {
      title: '',
      content: '',
      context: '',
      observed_at: new Date().toISOString(),
      type,
      domain,
      focus,
      source_node_key: sourceNodeKey,
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const content = watch('content');

  /*
   * Keep contextual classification in sync if the caller changes
   * while the dialog is being reused.
   */
  useEffect(() => {
    setValue('type', type);
    setValue('domain', domain);
    setValue('focus', focus);
    setValue('source_node_key', sourceNodeKey);
  }, [type, domain, focus, sourceNodeKey, setValue]);

  /*
   * Browser speech recognition is deliberately treated as an
   * enhancement. Typed input remains the primary interaction.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    setVoiceSupported(Boolean(SpeechRecognition));
  }, []);

  /*
   * Clean up speech recognition if the component unmounts.
   */
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function startVoiceInput() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    /*
     * Avoid creating another recognition instance if one
     * is already running.
     */
    if (recognitionRef.current) return;

    const recognition = new SpeechRecognition();

    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();

      if (!transcript) return;

      const existing = content?.trim();

      setValue(
        'content',
        existing ? `${existing} ${transcript}` : transcript,
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      );
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  }

  function stopVoiceInput() {
    const recognition = recognitionRef.current;

    if (!recognition) {
      setIsListening(false);
      return;
    }

    recognition.stop();
  }

  async function handleSave(values: ObservationFormValues) {
    if (isSaving) return;

    /*
     * Make sure speech recognition isn't still running
     * when the observation is submitted.
     */
    recognitionRef.current?.stop();

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await saveObservation(values);

      onSaved?.(result.observation);

      reset({
        title: '',
        content: '',
        context: '',
        observed_at: new Date().toISOString(),
        type,
        domain,
        focus,
        source_node_key: sourceNodeKey,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('[OBSERVATION LOGGER]', error);

      setSaveError(
        error instanceof Error
          ? error.message
          : 'Something went wrong saving your observation.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving) return;

    if (!nextOpen) {
      recognitionRef.current?.abort();
      recognitionRef.current = null;

      setSaveError(null);
      setIsListening(false);
    }

    onOpenChange(nextOpen);
  }

  const observedAt = watch('observed_at');

  const formattedObservedAt = observedAt
    ? new Date(observedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Now';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record an observation</DialogTitle>

          <DialogDescription>
            Capture something you noticed. Don't turn it into an
            opportunity or solution yet. Just record what happened.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleSave)}
          className="space-y-6"
        >
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="observation-title">
              Give it a short title
            </Label>

            <Input
              id="observation-title"
              placeholder="e.g. Restaurant photos are hard to keep updated"
              {...register('title')}
              autoFocus
            />

            {errors.title && (
              <p className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              This is a memory hook. Keep it short enough to recognize
              later.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="observation-content">
                What did you observe?
              </Label>

              {voiceSupported && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={
                    isListening
                      ? stopVoiceInput
                      : startVoiceInput
                  }
                  className="gap-2"
                >
                  {isListening ? (
                    <>
                      <Square className="h-4 w-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Speak
                    </>
                  )}
                </Button>
              )}
            </div>

            <Textarea
              id="observation-content"
              placeholder="Describe what you actually noticed, heard, saw, or experienced."
              rows={6}
              {...register('content')}
            />

            {errors.content && (
              <p className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}

            {isListening && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
                Listening…
              </p>
            )}
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label htmlFor="observation-context">
              Where did you notice this?
              <span className="ml-1 font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>

            <Textarea
              id="observation-context"
              placeholder="A place, situation, conversation, website, workplace, or anything else that helps you remember the context."
              rows={3}
              {...register('context')}
            />

            {errors.context && (
              <p className="text-sm text-destructive">
                {errors.context.message}
              </p>
            )}
          </div>

          {/* When */}
          <div className="space-y-2">
            <Label htmlFor="observation-observed-at">
              When did you notice this?
            </Label>

            <Input
              id="observation-observed-at"
              type="datetime-local"
              value={
                observedAt
                  ? new Date(observedAt)
                      .toISOString()
                      .slice(0, 16)
                  : ''
              }
              onChange={(event) => {
                const value = event.target.value;

                setValue(
                  'observed_at',
                  value
                    ? new Date(value).toISOString()
                    : undefined,
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  }
                );
              }}
            />

            <p className="text-xs text-muted-foreground">
              Defaults to now. Use this when the observation happened
              earlier.
            </p>

            <p className="text-xs text-muted-foreground">
              Recorded as {formattedObservedAt}.
            </p>
          </div>

          {/* Contextual classification */}
          {(type || domain || focus) && (
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                Recording context
              </p>

              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {type && <span>{type}</span>}

                {domain && <span>· {domain}</span>}

                {focus && (
                  <span>
                    · {focus.replaceAll('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {saveError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {saveError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {isSaving ? 'Saving…' : 'Save observation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}