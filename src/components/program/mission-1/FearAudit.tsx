'use client';

import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Loader2,
  MessageCircle,
  NotebookPen,
  Target,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveCommitment } from '@/actions/commitments';

type FearAuditPayload = {
  commitment?: string;
  // Read earlier versions of this node's saved payload during revisits.
  customResponse?: string;
  selectedOption?: {
    title?: string;
    description?: string;
  };
  completed?: boolean;
};

export function FearAudit({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = (progress.payload ?? {}) as FearAuditPayload;
  const savedCommitment =
    saved.commitment ?? saved.customResponse ?? saved.selectedOption?.title ?? '';

  const [commitment, setCommitment] = useState(savedCommitment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCompleted = progress.completed || saved.completed === true;
  const canContinue = commitment.trim().length > 0;

  async function handleComplete() {
    if (!canContinue || isSubmitting) return;

    const statement = commitment.trim();
    setIsSubmitting(true);
    setError(null);

    try {
      await saveCommitment({
        statement,
        source_node_key: nodeKey,
      });

      await onComplete({
        commitment: statement,
        completed: true,
      });
    } catch (err) {
      console.error('[FEAR AUDIT ERROR]', err);
      setError('We could not save your commitment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-4xl space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Fear audit
        </p>
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'Build your rejection routine'}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Rejection is part of building a business. You can’t control every response,
          but you can decide how you handle it and what you do next.
        </p>
      </div>

      <div className="space-y-6">
        <ApproachRow
          icon={<Target className="h-5 w-5" />}
          title="Before you ask"
          description="Set a goal for the asks you make, not just the yeses you get."
        />
        <ApproachRow
          icon={<MessageCircle className="h-5 w-5" />}
          title="When you hear no"
          description="Thank them, ask for feedback if appropriate, and respect their answer."
        />
        <ApproachRow
          icon={<NotebookPen className="h-5 w-5" />}
          title="Afterward"
          description="Record what happened, look for patterns, and decide what to change—or whether to move on."
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-semibold">Keep the playbook handy</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Practical responses, simple routines, and a rejection log to use whenever you need them.
          </p>
        </div>
        <a
          href="/playbook/urge_rejection_playbook.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Download the guide
        </a>
      </div>

      <div className="space-y-4 border-t border-border pt-7">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">What will you do differently next time?</h3>
          <p className="text-muted-foreground">
            Choose one approach you’ll use the next time asking feels difficult.
          </p>
        </div>

        {isCompleted ? (
          <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
            <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <p className="text-base leading-7">{savedCommitment}</p>
          </div>
        ) : (
          <>
            <Textarea
              value={commitment}
              onChange={(event) => {
                setCommitment(event.target.value);
                setError(null);
              }}
              placeholder="The next time I hesitate to ask, I will…"
              className="min-h-[120px] resize-y text-base leading-7"
              disabled={isSubmitting}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end">
              <Button
                onClick={handleComplete}
                disabled={!canContinue || isSubmitting}
                className="h-12 gap-2 rounded-full px-7 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save my commitment
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type ApproachRowProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function ApproachRow({ icon, title, description }: ApproachRowProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
        {icon}
      </div>
      <div className="space-y-1 pt-0.5">
        <h3 className="font-semibold">{title}</h3>
        <p className="max-w-3xl leading-7 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
