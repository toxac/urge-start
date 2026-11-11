"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PauseIcon, PlayIcon, RotateCcwIcon, Volume2Icon } from "lucide-react";

export interface SpeechContentProps extends React.ComponentProps<"div"> {
  /** Optional explicit text to read. If omitted, extracts inner text from children automatically */
  textToRead?: string;
  /** Language for synthesis (default 'en-US') */
  lang?: string;
  /** Pitch multiplier (0.5 to 2) */
  pitch?: number;
  /** Playback speed (0.5 to 2) */
  rate?: number;
  /** Display mode for audio button: 'hover' shows on parent hover, 'always' stays visible */
  controlsPosition?: "top-right" | "bottom-right" | "inline";
  showControls?: "hover" | "always";
}

export const SpeechContent = ({
  children,
  className,
  textToRead,
  lang = "en-US",
  pitch = 1,
  rate = 1,
  controlsPosition = "top-right",
  showControls = "hover",
  ...props
}: SpeechContentProps) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
    }
  }, []);

  const stopPlayback = React.useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, []);

  const togglePlayback = React.useCallback(() => {
    if (!isSupported) return;

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // Determine text
    const text = textToRead || contentRef.current?.innerText || contentRef.current?.textContent || "";
    if (!text.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = lang;
    utterance.pitch = pitch;
    utterance.rate = rate;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }, [isSupported, isPlaying, isPaused, textToRead, lang, pitch, rate]);

  // Cancel speech on unmount
  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const positionClasses = {
    "top-right": "absolute top-2 right-2",
    "bottom-right": "absolute bottom-2 right-2",
    "inline": "relative my-2",
  }[controlsPosition];

  return (
    <div className={cn("group/speech-content relative", className)} {...props}>
      {isSupported && (
        <div
          className={cn(
            "z-20 flex items-center gap-1 rounded-md border border-border/40 bg-background/90 p-0.5 shadow-xs backdrop-blur-xs transition-opacity duration-200",
            positionClasses,
            showControls === "hover" && !isPlaying && "opacity-0 group-hover/speech-content:opacity-100",
            (isPlaying || showControls === "always") && "opacity-100"
          )}
        >
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={togglePlayback}
            className="size-7 text-muted-foreground hover:text-foreground"
            title={isPlaying && !isPaused ? "Pause reading" : "Read aloud"}
          >
            {isPlaying && !isPaused ? (
              <PauseIcon className="size-3.5 fill-current" />
            ) : isPaused ? (
              <PlayIcon className="size-3.5 fill-current" />
            ) : (
              <Volume2Icon className="size-3.5" />
            )}
          </Button>

          {isPlaying && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={stopPlayback}
              className="size-7 text-muted-foreground hover:text-destructive"
              title="Stop"
            >
              <RotateCcwIcon className="size-3.5" />
            </Button>
          )}
        </div>
      )}

      <div ref={contentRef} className="h-full w-full">
        {children}
      </div>
    </div>
  );
};