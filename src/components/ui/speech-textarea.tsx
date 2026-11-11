"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { cn } from "@/lib/utils";

export interface SpeechTextareaProps
  extends React.ComponentProps<"textarea"> {
  /** Mode when inserting transcribed voice: append to end or overwrite */
  transcriptionMode?: "append" | "replace";
  /** Language for Web Speech API (defaults to 'en-US') */
  lang?: string;
  /** MediaRecorder fallback handler for Firefox/Safari or external Whisper STT */
  onAudioRecorded?: (audioBlob: Blob) => Promise<string>;
  /** Callback notifying completion of transcription */
  onTranscriptionChange?: (transcription: string) => void;
  /** Class styling for the outer wrapper container */
  containerClassName?: string;
  /** Class styling for the speech button inside */
  speechButtonClassName?: string;
  /** Hide the microphone button */
  hideSpeechButton?: boolean;
}

export const SpeechTextarea = React.forwardRef<
  HTMLTextAreaElement,
  SpeechTextareaProps
>(
  (
    {
      className,
      containerClassName,
      speechButtonClassName,
      transcriptionMode = "append",
      lang = "en-US",
      onAudioRecorded,
      onTranscriptionChange,
      hideSpeechButton = false,
      value,
      defaultValue,
      onChange,
      disabled,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Merge forwarded ref and internal ref
    const setRefs = React.useCallback(
      (element: HTMLTextAreaElement | null) => {
        internalRef.current = element;
        if (typeof forwardedRef === "function") {
          forwardedRef(element);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = element;
        }
      },
      [forwardedRef]
    );

    const handleSpeechTranscription = React.useCallback(
      (transcript: string) => {
        const textarea = internalRef.current;
        if (!textarea) return;

        const trimmed = transcript.trim();
        if (!trimmed) return;

        const currentValue = textarea.value || "";
        const nextValue =
          transcriptionMode === "replace" || !currentValue
            ? trimmed
            : `${currentValue} ${trimmed}`;

        // Trigger native React value setter to notify react-hook-form and state listeners
        const nativeValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        )?.set;
        nativeValueSetter?.call(textarea, nextValue);

        // Fire synthetic input and change events
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("change", { bubbles: true }));

        onTranscriptionChange?.(trimmed);
      },
      [transcriptionMode, onTranscriptionChange]
    );

    return (
      <div className={cn("relative flex w-full flex-col", containerClassName)}>
        <Textarea
          ref={setRefs}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            // Reserve bottom-right space so text never collides with speech button
            !hideSpeechButton && "pb-10 pr-10",
            className
          )}
          {...props}
        />

        {!hideSpeechButton && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
            <SpeechInput
              lang={lang}
              disabled={disabled}
              onTranscriptionChange={handleSpeechTranscription}
              onAudioRecorded={onAudioRecorded}
              className={cn("size-7 bg-background/80 shadow-xs hover:bg-muted", speechButtonClassName)}
            />
          </div>
        )}
      </div>
    );
  }
);

SpeechTextarea.displayName = "SpeechTextarea";