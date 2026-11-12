"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { SpeechTextarea } from "@/components/ui/speech-textarea";
import { SpeechContent } from "@/components/ui/speech-content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Optional: Ensure you have your Whisper fallback defined in a utility file
// import { handleWhisperAudio } from "@/lib/speech";

// For testing without the API route setup yet, use this mock handler
const mockWhisperAudio = async (audioBlob: Blob): Promise<string> => {
  console.log("Audio blob recorded:", audioBlob.size, "bytes");
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return " This is a simulated whisper transcription from the media recorder fallback.";
};

interface FormData {
  feedback: string;
}

export default function SpeechTestingPage() {
  const { register, handleSubmit, watch, reset } = useForm<FormData>();
  const [submittedData, setSubmittedData] = useState<string | null>(null);

  // Watch the form state in real-time
  const currentFeedback = watch("feedback");

  const onSubmit = (data: FormData) => {
    setSubmittedData(data.feedback);
    reset();
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-8 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Speech Components Test</h1>
        <p className="text-muted-foreground mt-2">
          Verify Web Speech API functionality and MediaRecorder fallback (Firefox/Safari).
        </p>
      </div>

      {/* Test Case 1: SpeechTextarea with react-hook-form */}
      <Card>
        <CardHeader>
          <CardTitle>1. SpeechTextarea (react-hook-form)</CardTitle>
          <CardDescription>
            Tests real-time transcription appending and form validation state.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="feedback" className="text-sm font-medium">
                Your Feedback
              </label>
              <SpeechTextarea
                id="feedback"
                placeholder="Speak or type your feedback here..."
                rows={5}
                {...register("feedback", { required: true })}
                // Swap `mockWhisperAudio` with `handleWhisperAudio` when your API route is ready
                onAudioRecorded={mockWhisperAudio}
              />
              <p className="text-xs text-muted-foreground">
                Current form state length: {currentFeedback?.length || 0} characters
              </p>
            </div>
            <Button type="submit" disabled={!currentFeedback?.trim()}>
              Submit Feedback
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Test Case 2: SpeechContent TTS reading */}
      <Card>
        <CardHeader>
          <CardTitle>2. SpeechContent (TTS)</CardTitle>
          <CardDescription>
            Tests text extraction and browser-native Text-to-Speech synthesis. Hover over the card to reveal controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SpeechContent className="rounded-xl border bg-muted/50 p-6">
            <h3 className="mb-2 font-semibold">Project Urge Startup Phase</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Welcome to the Project Urge platform. Our goal is to streamline 
              operations and integrate AI seamlessly into daily workflows. 
              The speech components you are testing right now utilize advanced 
              browser APIs to make data entry entirely frictionless.
            </p>
            <ul className="list-inside list-disc text-sm">
              <li>Cross-browser support via MediaRecorder</li>
              <li>Zero-latency client-side synthesis</li>
              <li>React Hook Form compatibility</li>
            </ul>
          </SpeechContent>

          {/* Test Case 3: Read submitted form data */}
          {submittedData && (
            <div className="mt-8 space-y-2">
              <h3 className="text-sm font-medium">Read Submitted Data:</h3>
              <SpeechContent 
                className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"
                controlsPosition="top-right"
                showControls="always"
              >
                {submittedData}
              </SpeechContent>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}