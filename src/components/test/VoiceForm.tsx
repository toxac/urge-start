"use client"

import { VoiceTextarea } from "@/components/ui/custom/VoiceTextarea"

export function TestForm() {
  return (
    <form
      className="mx-auto max-w-md space-y-4 p-8"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        console.log("submitted:", data.get("note"))
        alert(`Value: ${data.get("note")}`)
      }}
    >
      <VoiceTextarea name="note" rows={6} placeholder="Type or speak..." />
      <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
        Submit
      </button>
    </form>
  )
}