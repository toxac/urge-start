'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  ArrowRight,
  Check,
  Eye,
  Hand,
  Loader2,
  Search,
  ShieldCheck,
} from 'lucide-react';

import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { Button } from '@/components/ui/button';
import { SpeechContent } from '@/components/ui/speech-content';
import { getMission1Artifacts } from '@/actions/responses/mission1';
import { $progress } from '@/lib/stores/progress';
import { $userContext } from '@/lib/stores/user-context';

type RevealPayload = {
  completed: boolean;
};

type Mission1Artifacts = {
  lineDrawn: string;
  leverage: string;
  socialRule: string;
  rejectionProtocol: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanArtifact(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'not recorded.') return '';
  return trimmed;
}

function truncateExcerpt(text: string, maxLength = 220): string {
  if (text.length <= maxLength) return text;
  const sliced = text.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 120 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

export function Mission1Reveal({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);
  const contextState = useStore($userContext);

  const saved = (progress.payload ?? {}) as Partial<RevealPayload>;
  const isComplete = saved.completed === true || progress.completed === true;

  const founderName =
    contextState.profile?.display_name?.trim() ||
    contextState.profile?.username?.trim() ||
    null;

  const [dbArtifacts, setDbArtifacts] = useState<Mission1Artifacts | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadArtifacts() {
      try {
        const result = await getMission1Artifacts();
        if (!cancelled && result) {
          setDbArtifacts(result);
        }
      } catch (err) {
        console.error('[MISSION 1 REVEAL ARTIFACTS]', err);
      }
    }

    void loadArtifacts();

    return () => {
      cancelled = true;
    };
  }, []);

  const journeyItems = useMemo(() => {
    const payloads = progressState.payloads ?? {};

    // 01: Quest 1 commitment / line drawn
    const q1Payload = isRecord(payloads['m1-q1-action'])
      ? payloads['m1-q1-action']
      : {};
    let q1Evidence =
      cleanArtifact(dbArtifacts?.lineDrawn) ||
      cleanArtifact(q1Payload.commitment);

    if (!q1Evidence && Array.isArray(q1Payload.habits)) {
      const titles = q1Payload.habits
        .map((h) =>
          isRecord(h) && typeof h.title === 'string'
            ? h.title.trim()
            : typeof h === 'string'
              ? h.trim()
              : '',
        )
        .filter(Boolean);
      if (titles.length > 0) {
        q1Evidence = titles.join(' · ');
      }
    }

    // 02: Quest 2 leverage synthesis
    const q2Payload = isRecord(payloads['m1-q2-reveal'])
      ? payloads['m1-q2-reveal']
      : {};
    const q2Evidence =
      cleanArtifact(q2Payload.synthesis) ||
      cleanArtifact(dbArtifacts?.leverage);

    // 03: Quest 3 prediction vs. reality takeaway
    const q3Payload = isRecord(payloads['m1-q3-reveal'])
      ? payloads['m1-q3-reveal']
      : {};
    const q3Synthesis = isRecord(q3Payload.synthesis)
      ? q3Payload.synthesis
      : {};
    const q3Evidence =
      cleanArtifact(q3Synthesis.headline) ||
      cleanArtifact(dbArtifacts?.socialRule);

    // 04: Quest 4 rejection routine / fear audit commitment
    const q4ActionPayload = isRecord(payloads['m1-q4-action'])
      ? payloads['m1-q4-action']
      : {};
    const q4RevealPayload = isRecord(payloads['m1-q4-reveal'])
      ? payloads['m1-q4-reveal']
      : {};
    const q4Synthesis = isRecord(q4RevealPayload.synthesis)
      ? q4RevealPayload.synthesis
      : {};
    const q4Evidence =
      cleanArtifact(dbArtifacts?.rejectionProtocol) ||
      cleanArtifact(q4ActionPayload.commitment) ||
      cleanArtifact(q4Synthesis.headline);

    return [
      {
        number: '01',
        icon: Eye,
        title: 'Look inward',
        text: 'You named what has been holding you back and what makes you want to begin.',
        evidenceLabel: 'Your line drawn',
        evidence: q1Evidence ? truncateExcerpt(q1Evidence) : '',
      },
      {
        number: '02',
        icon: Search,
        title: 'Look around',
        text: 'You took stock of the skills, experience, resources, and people you can already draw on.',
        evidenceLabel: 'Your starting leverage',
        evidence: q2Evidence ? truncateExcerpt(q2Evidence) : '',
      },
      {
        number: '03',
        icon: Hand,
        title: 'Ask and find out',
        text: 'You moved beyond guessing and took a real step to find out how someone might respond.',
        evidenceLabel: 'What reality showed you',
        evidence: q3Evidence ? truncateExcerpt(q3Evidence) : '',
      },
      {
        number: '04',
        icon: ShieldCheck,
        title: 'Face the fear',
        text: 'You practised asking, making room for a no, and learning from what actually happened.',
        evidenceLabel: 'Your rejection routine',
        evidence: q4Evidence ? truncateExcerpt(q4Evidence) : '',
      },
    ];
  }, [progressState.payloads, dbArtifacts]);

  const readAloudText = useMemo(() => {
    const stepSummaries = journeyItems
      .map((item) =>
        item.evidence
          ? `${item.title}. ${item.text} ${item.evidenceLabel}: ${item.evidence}`
          : `${item.title}. ${item.text}`,
      )
      .join(' ');

    return [
      'You moved.',
      'You did not have to solve everything before taking a step. You looked honestly at where you were, noticed what you already had, and started finding things out.',
      'Four things you practised.',
      stepSummaries,
      'A few things worth remembering.',
      'You do not need every answer before you begin.',
      'You are probably not starting from zero. Look for the skills, experience, resources, and people already within reach.',
      'An assumption becomes clearer when you test it in the real world.',
      'A response — including a no — is something to learn from, not a verdict on your worth.',
    ].join(' ');
  }, [journeyItems]);

  async function handleContinue() {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload: RevealPayload = { completed: true };
      await onComplete(payload);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-5xl space-y-14 pb-16 animate-in fade-in duration-300">
      <SpeechContent
        textToRead={readAloudText}
        showControls="always"
        controlsPosition="top-right"
        className="space-y-14"
      >
        <section className="max-w-3xl space-y-5 pr-16">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {node.title || 'Mission 1 reflection'}
          </p>
          <h2 className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl">
            You moved.
          </h2>
          <p className="max-w-2xl text-xl leading-9 text-muted-foreground">
            {founderName ? `${founderName}, you ` : 'You '}
            did not have to solve everything before taking a step. You looked
            honestly at where you were, noticed what you already had, and
            started finding things out.
          </p>
        </section>

        <section className="space-y-7">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Look back
            </p>
            <h3 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Four things you practised.
            </h3>
            <p className="text-lg leading-8 text-muted-foreground">
              This was not about becoming fearless or having all the answers. It
              was about practising a different way to begin.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {journeyItems.map(
              ({
                number,
                icon: Icon,
                title,
                text,
                evidenceLabel,
                evidence,
              }) => (
                <div
                  key={number}
                  className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 sm:p-7"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
                        {number}
                      </span>
                    </div>
                    <h4 className="mt-6 text-xl font-semibold">{title}</h4>
                    <p className="mt-3 leading-7 text-muted-foreground">
                      {text}
                    </p>
                  </div>

                  {evidence && (
                    <div className="mt-5 border-t border-border pt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                        {evidenceLabel}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-foreground">
                        {evidence}
                      </p>
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        </section>

        <section className="border-y border-border py-10 sm:py-12">
          <div className="max-w-3xl space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Keep this with you
            </p>
            <h3 className="font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              A few things worth remembering.
            </h3>
            <ul className="space-y-4">
              <RememberItem>
                You do not need every answer before you begin.
              </RememberItem>
              <RememberItem>
                You are probably not starting from zero. Look for the skills,
                experience, resources, and people already within reach.
              </RememberItem>
              <RememberItem>
                An assumption becomes clearer when you test it in the real
                world.
              </RememberItem>
              <RememberItem>
                A response — including a no — is something to learn from, not a
                verdict on your worth.
              </RememberItem>
            </ul>
          </div>
        </section>
      </SpeechContent>

      <div className="flex justify-end">
        <Button
          onClick={() => void handleContinue()}
          disabled={isSubmitting}
          className="h-12 shrink-0 gap-2 rounded-full px-7 text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {isComplete ? 'Continue to Mission 2' : 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function RememberItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-lg leading-7">
      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="h-4 w-4" />
      </span>
      <span>{children}</span>
    </li>
  );
}