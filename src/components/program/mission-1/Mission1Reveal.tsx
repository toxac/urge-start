'use client';

import { useState } from 'react';
import { ArrowRight, Check, Eye, Hand, Search } from 'lucide-react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $progress } from '@/lib/stores/progress';
import { $userContext } from '@/lib/stores/user-context';

type RevealPayload = {
  reflection: string;
  completed: boolean;
};

type BarrierEntry = {
  id?: string;
  title?: string;
  reflection?: string;
};

type MotivationEntry = {
  id?: string;
  title?: string;
  reflection?: string;
};

type ResourceEntry = {
  id?: string;
  type?: string;
  title?: string;
  detail?: string;
};

type CapabilityEntry = {
  id?: string;
  title?: string;
  evidence?: string;
};

type ExperienceEntry = {
  id?: string;
  title?: string;
  evidence?: string;
};

type NetworkEntry = {
  id?: string;
  type?: string;
  name?: string;
  access?: string;
  possibleUses?: string[];
};

type ExperimentPayload = {
  target?: string;
  intention?: string;
  prediction?: string;
  actionTaken?: string;
  outcome?: string;
  reaction?: string;
  reflection?: string;
  completed?: boolean;
};

export function Mission1Reveal({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const progressState = useStore($progress);
  const userContextState = useStore($userContext);

  const saved = (progress.payload ?? {}) as Partial<RevealPayload>;

  const userContext = userContextState.userContext;
  const payloads = progressState.payloads ?? {};

  const [reflection, setReflection] = useState(
    typeof saved.reflection === 'string'
      ? saved.reflection
      : '',
  );

  const [isComplete, setIsComplete] = useState(
    saved.completed === true || progress.completed === true,
  );

  /*
   * STARTING POINT
   *
   * This is the founder's own reason for being here.
   * We show it rather than interpreting it.
   */
  const startDrive = getObjectField(
    userContext?.start_drive,
    'reflection',
  );

  /*
   * Q1 — LOOK INWARD
   */
  const barriers = getArrayField<BarrierEntry>(
    userContext?.perceived_barriers,
    'barriers',
  );

  const motivations = getArrayField<MotivationEntry>(
    userContext?.motivations,
    'motivations',
  );

  /*
   * Q2 — LOOK AROUND
   */
  const resources = getArrayField<ResourceEntry>(
    userContext?.resources,
    'items',
  );

  const capabilities = getArrayField<CapabilityEntry>(
    userContext?.capabilities,
    'items',
  );

  const experiences = getArrayField<ExperienceEntry>(
    userContext?.experience,
    'items',
  );

  const network = getArrayField<NetworkEntry>(
    userContext?.network_context,
    'items',
  );

  /*
   * Q3 / Q4 — ASK & FIND OUT
   */
  const q3Experiment = getExperimentPayload(
    payloads['m1-q3-ask'],
  );

  const q4Warmup = getExperimentPayload(
    payloads['m1-q4-warmup'],
  );

  const q4Stretch = getExperimentPayload(
    payloads['m1-q4-stretch'],
  );

  const experiments = [
    q3Experiment,
    q4Warmup,
    q4Stretch,
  ].filter(
    (experiment): experiment is ExperimentPayload =>
      Boolean(experiment?.completed),
  );

  /*
   * Select only a small amount of evidence.
   *
   * The reveal is deliberately not a report of everything the founder
   * entered during Mission 1.
   */
  const barrierLabels = barriers
    .map((item) => item.title)
    .filter(Boolean)
    .slice(0, 3) as string[];

  const motivationLabels = motivations
    .map((item) => item.title)
    .filter(Boolean)
    .slice(0, 3) as string[];

  const assetLabels = [
    ...resources
      .map((item) => item.title)
      .filter(Boolean),
    ...capabilities
      .map((item) => item.title)
      .filter(Boolean),
    ...experiences
      .map((item) => item.title)
      .filter(Boolean),
    ...network
      .map((item) => item.name)
      .filter(Boolean),
  ].slice(0, 5) as string[];

  const experimentHighlights = experiments
    .map((experiment) => {
      if (experiment.outcome) {
        return experiment.outcome;
      }

      if (experiment.reflection) {
        return experiment.reflection;
      }

      if (experiment.actionTaken) {
        return experiment.actionTaken;
      }

      return null;
    })
    .filter(Boolean)
    .slice(0, 2) as string[];

  const hasReflection = reflection.trim().length >= 10;

  function handleComplete() {
    if (!hasReflection) return;

    const payload: RevealPayload = {
      reflection: reflection.trim(),
      completed: true,
    };

    setIsComplete(true);
    onComplete(payload);
  }

  if (isComplete) {
    return (
      <div className="w-full max-w-4xl space-y-12">
        <div className="space-y-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-6 w-6" />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Mission 1 complete
            </p>

            <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              You moved.
            </h2>

            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              You came here thinking about starting. You looked more
              closely, involved other people, and found out what
              actually happened.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 sm:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            What you know now
          </p>

          <p className="text-2xl leading-relaxed">
            {reflection}
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => onComplete(saved)}
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            Continue to Mission 2
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-20">
      {/* ----------------------------------------------------------- */}
      {/* ARRIVAL                                                      */}
      {/* ----------------------------------------------------------- */}

      <section className="max-w-3xl space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Mission 1
        </p>

        <h2 className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl">
          You moved.
        </h2>

        <p className="max-w-2xl text-xl leading-9 text-muted-foreground">
          When you started, you did not need to have everything
          figured out. You needed to be willing to find out.
        </p>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* WHERE YOU STARTED                                            */}
      {/* ----------------------------------------------------------- */}

      <section className="relative">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <ArrowRight className="h-4 w-4 rotate-90" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Where you started
            </p>

            <h3 className="mt-1 text-xl font-semibold">
              This is what brought you here.
            </h3>
          </div>
        </div>

        {startDrive ? (
          <div className="rounded-3xl bg-muted/50 p-8 sm:p-10">
            <p className="max-w-3xl text-2xl leading-relaxed">
              “{startDrive}”
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border p-8">
            <p className="text-lg text-muted-foreground">
              You started without having everything figured out.
            </p>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------- */}
      {/* THE JOURNEY                                                  */}
      {/* ----------------------------------------------------------- */}

      <section className="space-y-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            What changed
          </p>

          <h3 className="font-heading text-3xl font-semibold tracking-tight">
            You stopped trying to solve everything in your head.
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <JourneyStep
            number="01"
            icon={<Eye className="h-5 w-5" />}
            title="Look inward"
            text="You put words to what was getting in your way — and what kept pulling you forward."
          />

          <JourneyStep
            number="02"
            icon={<Search className="h-5 w-5" />}
            title="Look around"
            text="You took stock of what was already within reach instead of assuming you were starting from zero."
          />

          <JourneyStep
            number="03"
            icon={<Hand className="h-5 w-5" />}
            title="Ask & find out"
            text="You stopped predicting what might happen and started finding out what actually happens."
          />
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* LIGHTWEIGHT EVIDENCE                                         */}
      {/* ----------------------------------------------------------- */}

      <section className="space-y-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Your evidence
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <EvidenceBlock
            label="What was in the way"
            items={barrierLabels}
            empty="You looked honestly at what was making it harder to start."
          />

          <EvidenceBlock
            label="What was already there"
            items={assetLabels}
            empty="You found resources, capabilities, experience, or people already within reach."
          />

          <EvidenceBlock
            label="What happened when you asked"
            items={experimentHighlights}
            empty="You started testing your assumptions in the real world."
          />
        </div>

        {motivationLabels.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-muted-foreground">
              And you kept coming back because:
            </span>

            {motivationLabels.map((label) => (
              <span
                key={label}
                className="rounded-full bg-muted px-3 py-1.5 text-sm"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------- */}
      {/* THE SHIFT                                                    */}
      {/* ----------------------------------------------------------- */}

      <section className="border-y border-border py-14">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            The shift
          </p>

          <h3 className="mt-5 font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            You don't need to feel ready to start finding things out.
          </h3>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            That is what this mission was about. Not becoming fearless.
            Not having all the answers. Learning that you can move,
            see what happens, and decide what to do next.
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* FOUNDER REFLECTION                                           */}
      {/* ----------------------------------------------------------- */}

      <section className="max-w-4xl space-y-7">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Make it yours
          </p>

          <h3 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            What do you know now that you didn&apos;t know when you started?
          </h3>

          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Use your own words. There is no right answer.
          </p>
        </div>

        <Textarea
          value={reflection}
          onChange={(event) =>
            setReflection(event.target.value)
          }
          placeholder="Now I know..."
          className="min-h-[190px] resize-none rounded-2xl p-6 text-lg leading-8"
        />

        <div className="flex justify-end">
          <Button
            onClick={handleComplete}
            disabled={!hasReflection}
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            Complete Mission 1
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}

function JourneyStep({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-7">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>

        <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
          {number}
        </span>
      </div>

      <h4 className="mt-8 text-xl font-semibold">
        {title}
      </h4>

      <p className="mt-3 leading-7 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

function EvidenceBlock({
  label,
  items,
  empty,
}: {
  label: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="min-h-[180px] rounded-3xl bg-muted/40 p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>

      {items.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full bg-background px-3 py-2 text-sm"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-6 leading-7 text-muted-foreground">
          {empty}
        </p>
      )}
    </div>
  );
}

function getObjectField(
  value: unknown,
  field: string,
): string {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return '';
  }

  const result = (value as Record<string, unknown>)[field];

  return typeof result === 'string' ? result : '';
}

function getArrayField<T>(
  value: unknown,
  field: string,
): T[] {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return [];
  }

  const result = (value as Record<string, unknown>)[field];

  return Array.isArray(result)
    ? (result as T[])
    : [];
}

function getExperimentPayload(
  value: unknown,
): ExperimentPayload | null {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as ExperimentPayload;
}