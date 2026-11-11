"use client";

import { VoiceTextarea } from "@/components/ui/custom/VoiceTextarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useForm } from "react-hook-form";

type FormValues = {
  notes: string;
};

// Fake STT provider: lets you test the MediaRecorder path without an API.
// Only fires in browsers using MediaRecorder mode (Firefox/Safari, or Chrome
// if you add the forceMediaRecorder prop to speech-input.tsx).
async function fakeTranscribe(blob: Blob): Promise<string> {
  await new Promise((r) => setTimeout(r, 1200));
  return `[fake transcript of ${Math.round(blob.size / 1024)}KB audio]`;
}

export default function VoiceTextareaTestPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { notes: "" } });

  const [controlled, setControlled] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-2xl space-y-12 p-6 py-12">
      <h1 className="font-heading text-2xl font-semibold">
        VoiceTextarea test page
      </h1>

      {/* 1. react-hook-form with register */}
      <section className="space-y-3">
        <h2 className="font-medium">1. react-hook-form (register)</h2>
        <form
          className="space-y-3"
          onSubmit={handleSubmit((v) => setSubmitted(v.notes))}
        >
          <VoiceTextarea
            {...register("notes", { required: "Notes are required" })}
            placeholder="Type or dictate..."
            aria-invalid={!!errors.notes}
            className="min-h-32"
            onAudioRecorded={fakeTranscribe}
          />
          {errors.notes && (
            <p className="text-sm text-destructive">{errors.notes.message}</p>
          )}
          <div className="flex justify-end">
            <Button type="submit">Submit</Button>
          </div>
        </form>
        <pre className="rounded-lg bg-muted p-3 text-xs">
          watch: {JSON.stringify(watch("notes"))}
          {"\n"}
          submitted: {JSON.stringify(submitted)}
        </pre>
      </section>

      {/* 2. Controlled with useState (like SituationExplorer) */}
      <section className="space-y-3">
        <h2 className="font-medium">2. Controlled (useState)</h2>
        <VoiceTextarea
          value={controlled}
          onChange={(e) => setControlled(e.target.value)}
          placeholder="Controlled example..."
          className="min-h-48"
          textareaClassName="text-base leading-7"
          onAudioRecorded={fakeTranscribe}
        />
        <pre className="rounded-lg bg-muted p-3 text-xs">
          state: {JSON.stringify(controlled)}
        </pre>
      </section>

      {/* 3. Disabled */}
      <section className="space-y-3">
        <h2 className="font-medium">3. Disabled</h2>
        <VoiceTextarea disabled defaultValue="Can't edit or dictate this." />
      </section>
    </main>
  );
}