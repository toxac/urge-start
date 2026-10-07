'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $progress } from '@/lib/stores/progress';

type RevealPayload = {
  notice?: string;
  completed?: boolean;
};

export function FearEvidenceReveal({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);
  const saved = (progress.payload ?? {}) as RevealPayload;

  const fear = progressState.payloads['m1-q4-setup'] ?? {};
  const warmup = progressState.payloads['m1-q4-warmup'] ?? {};
  const stretch = progressState.payloads['m1-q4-stretch'] ?? {};

  const [notice, setNotice] = useState(
    typeof saved.notice === 'string'
      ? saved.notice
      : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canContinue = notice.trim().length > 0;

  async function handleComplete() {
    if (!canContinue || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onComplete({
        notice: notice.trim(),
        completed: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (progress.completed || saved.completed === true) {
    return (
      <div className="w-full max-w-4xl space-y-10">
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You have put the fear beside what actually happened.
          </p>
        </div>

        <div className="space-y-8">
          <Evidence
            label="What you feared"
            value={fear.fearedOutcome}
          />

          <Evidence
            label="What you did"
            value={stretch.actionTaken}
          />

          <Evidence
            label="What actually happened"
            value={stretch.outcome}
          />

          <Evidence
            label="What you noticed"
            value={notice}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => onComplete(saved)}
            className="h-12 gap-2 rounded-full px-8"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-12">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          We are not going to tell you what this experience means.
          Put the fear beside the evidence and decide what you notice.
        </p>
      </div>

      <div className="space-y-8">
        <Evidence
          label="What you feared"
          value={fear.fearedOutcome}
        />

        <Evidence
          label="What you did"
          value={stretch.actionTaken}
        />

        <Evidence
          label="What actually happened"
          value={stretch.outcome}
        />

        {warmup.outcome && (
          <Evidence
            label="What happened in the warmup"
            value={warmup.outcome}
          />
        )}
      </div>

      <div className="max-w-3xl space-y-4 border-t border-border pt-8">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            What do you notice?
          </h3>

          <p className="text-muted-foreground">
            Don't force a positive conclusion. A no is still useful
            evidence. So is a yes. So is something you did not expect.
          </p>
        </div>

        <Textarea
          value={notice}
          onChange={(event) => setNotice(event.target.value)}
          placeholder="What I notice..."
          className="min-h-[180px] resize-none text-lg leading-8"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex max-w-3xl justify-end">
        <Button
          onClick={handleComplete}
          disabled={!canContinue || isSubmitting}
          className="h-12 gap-2 rounded-full px-8"
        >
          {isSubmitting ? (
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
  );
}

function Evidence({
  label,
  value,
}: {
  label: string;
  value?: unknown;
}) {
  if (typeof value !== 'string' || !value.trim()) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="text-lg leading-8">
        {value}
      </p>
    </div>
  );
}