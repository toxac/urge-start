"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { SpeechInput } from "@/components/ai-elements/speech-input"

type VoiceTextareaProps = React.ComponentProps<"textarea"> & {
  onAudioRecorded?: (audioBlob: Blob) => Promise<string>
  lang?: string
}

function VoiceTextarea({
  className,
  onAudioRecorded,
  lang,
  value,
  onChange,
  ...props
}: VoiceTextareaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleTranscriptionChange = (transcript: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Controlled mode uses value, uncontrolled mode reads DOM directly
    const currentValue = value !== undefined ? value : textarea.value
    const newValue = currentValue ? `${currentValue} ${transcript}` : transcript

    if (onChange) {
      // Controlled: trigger onChange, let React update value
      const event = {
        target: { value: newValue },
      } as React.ChangeEvent<HTMLTextAreaElement>
      onChange(event)
    } else {
      // Uncontrolled: write directly to DOM and trigger native input event
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set
      nativeSetter?.call(textarea, newValue)
      textarea.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        {...props}
        value={value}
        onChange={onChange}
        className={className}
        style={{ paddingRight: "2.5rem", ...props.style }}
      />
      <SpeechInput
        className="absolute right-2 bottom-2"
        onTranscriptionChange={handleTranscriptionChange}
        onAudioRecorded={onAudioRecorded}
        lang={lang}
      />
    </div>
  )
}

export { VoiceTextarea }
export type { VoiceTextareaProps }