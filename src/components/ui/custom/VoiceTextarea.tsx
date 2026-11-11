"use client";

import { SpeechInput } from "@/components/ai-elements/speech-input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { useCallback, useRef } from "react";

export type VoiceTextareaProps = ComponentProps<typeof Textarea> & {
  /**
   * Optional STT hook. Receives the recorded audio and must return the
   * transcribed text. Used by SpeechInput's MediaRecorder path
   * (Firefox/Safari, or always, if you force it in speech-input.tsx).
   */
  onAudioRecorded?: (audioBlob: Blob) => Promise<string>;
  /** BCP-47 language for the browser Web Speech API. */
  speechLang?: string;
  /** Extra classes for the textarea element itself. `className` goes on the outer box. */
  textareaClassName?: string;
};

/**
 * Writes a value into a textarea the way a user would, so React's onChange
 * fires. This keeps it working with react-hook-form's register() (uncontrolled),
 * Controller / field.onChange (controlled), and plain useState.
 */
function setNativeValue(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value"
  )?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

export function VoiceTextarea({
  className,
  textareaClassName,
  ref,
  disabled,
  readOnly,
  onAudioRecorded,
  speechLang,
  ...props
}: VoiceTextareaProps) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  // Merge our ref with the one from the parent (react-hook-form's register ref, etc.)
  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  const handleTranscription = useCallback((text: string) => {
    const el = innerRef.current;
    if (!el) {
      return;
    }
    const current = el.value;
    const needsSpace = current.length > 0 && !/\s$/.test(current);
    const next = current + (needsSpace ? " " : "") + text.trim();

    setNativeValue(el, next);
    el.focus();
    el.setSelectionRange(next.length, next.length);
  }, []);

  const inactive = disabled || readOnly;

  return (
    <div
      data-slot="voice-textarea"
      className={cn(
        "flex min-h-24 w-full cursor-text flex-col rounded-2xl border border-input bg-input/30 transition-colors",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "has-[textarea[aria-invalid=true]]:border-destructive has-[textarea[aria-invalid=true]]:ring-[3px] has-[textarea[aria-invalid=true]]:ring-destructive/20",
        "dark:has-[textarea[aria-invalid=true]]:border-destructive/50 dark:has-[textarea[aria-invalid=true]]:ring-destructive/40",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onClick={(e) => {
        // Clicking empty space in the box focuses the textarea (like Claude's chat box)
        if (e.target === e.currentTarget) {
          innerRef.current?.focus();
        }
      }}
    >
      <Textarea
        {...props}
        ref={setRefs}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          // Strip the shadcn textarea chrome; the wrapper owns border/ring/background
          "min-h-12 max-h-60 flex-1 border-0 bg-transparent! px-4 pt-3 pb-1 shadow-none",
          "focus-visible:border-0 focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0",
          "field-sizing-content overflow-y-auto",
          textareaClassName
        )}
      />

      <div className="flex items-center justify-end px-2 pb-2">
        <SpeechInput
          type="button"
          size="icon"
          className="size-8"
          lang={speechLang}
          disabled={inactive}
          aria-label="Dictate"
          onTranscriptionChange={handleTranscription}
          onAudioRecorded={onAudioRecorded}
        />
      </div>
    </div>
  );
}