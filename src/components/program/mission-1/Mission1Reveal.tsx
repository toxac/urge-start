'use client';

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
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
    typeof saved.reflection === 'string' ? saved.reflection : '',
  );

  const [isComplete, setIsComplete] = useState(
    saved.completed === true || progress.completed === true,
  );

  const startDrive = getObjectField(userContext?.start_drive, 'reflection');

  const barriers = getArrayField<BarrierEntry>(
    userContext?.perceived_barriers,
    'barriers',
  );

  const motivations = getArrayField<MotivationEntry>(
    userContext?.motivations,
    'motivations',
  );

  const desiredFuture = getObjectField(
    userContext?.desired_future,
    'reflection',
  );

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

  const q3Experiment = getExperimentPayload(
    payloads['m1-q3-ask'],
  );

  const q4Warmup = getExperimentPayload(
    payloads['m1-q4-warmup'],
  );

  const q4Stretch = getExperimentPayload(
    payloads['m1-q4-stretch'],
  );

  const hasExperimentEvidence =
    Boolean(q3Experiment?.completed) ||
    Boolean(q4Warmup?.completed) ||
    Boolean(q4Stretch?.completed);

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
      <div className="w-full max-w-4xl space-y-10">
        <div className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-6 w-6" />
          </div>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You looked back at where you started and what happened when you
            moved.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What you know now
          </p>

          <p className="text-lg leading-8">{reflection}</p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => onComplete(saved)}
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-14">
      <div className="max-w-3xl space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>

        <p className="text-lg leading-8 text-muted-foreground">
          Look back at what you actually did, what you discovered, and what
          changed along the way.
        </p>
      </div>

      {/* LOOK BACK */}
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Look back
          </p>

          <h3 className="font-heading text-2xl font-semibold">
            When you started, you were here.
          </h3>
        </div>

        {startDrive ? (
          <EvidenceCard>{startDrive}</EvidenceCard>
        ) : (
          <EmptyEvidence>
            You started this journey without having everything figured out.
          </EmptyEvidence>
        )}
      </section>

      {/* WHAT YOU FOUND */}
      <section className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What you found
          </p>

          <h3 className="font-heading text-2xl font-semibold">
            You looked more closely at what was really going on.
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <EvidenceGroup
            title="What was holding you back"
            items={barriers.map((item) => ({
              title: item.title,
              detail: item.reflection,
            }))}
            empty="You put words to what was making it harder to start."
          />

          <EvidenceGroup
            title="What kept pulling you forward"
            items={motivations.map((item) => ({
              title: item.title,
              detail: item.reflection,
            }))}
            empty="You looked at what keeps bringing you back."
          />

          <EvidenceGroup
            title="What you wanted to change"
            items={
              desiredFuture
                ? [{ title: undefined, detail: desiredFuture }]
                : []
            }
            empty="You described the future you want to move toward."
          />

          <EvidenceGroup
            title="What could make you stop"
            items={[]}
            empty="You looked honestly at what might make you quit."
          />
        </div>
      </section>

      {/* WHAT YOU ALREADY HAD */}
      <section className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What you already had
          </p>

          <h3 className="font-heading text-2xl font-semibold">
            You were not starting from zero.
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <EvidenceGroup
            title="Resources"
            items={resources.map((item) => ({
              title: item.title,
              detail: item.detail,
            }))}
            empty="You identified resources already within reach."
          />

          <EvidenceGroup
            title="Capabilities"
            items={capabilities.map((item) => ({
              title: item.title,
              detail: item.evidence,
            }))}
            empty="You identified things you can already do."
          />

          <EvidenceGroup
            title="Experience"
            items={experiences.map((item) => ({
              title: item.title,
              detail: item.evidence,
            }))}
            empty="You looked at what you have already lived through."
          />

          <EvidenceGroup
            title="People and places within reach"
            items={network.map((item) => ({
              title: item.name,
              detail: item.access,
            }))}
            empty="You looked at who and what was already within reach."
          />
        </div>
      </section>

      {/* WHAT HAPPENED WHEN YOU MOVED */}
      <section className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What happened when you moved
          </p>

          <h3 className="font-heading text-2xl font-semibold">
            You stopped keeping everything inside your head.
          </h3>
        </div>

        {hasExperimentEvidence ? (
          <div className="space-y-6">
            {q3Experiment?.completed && (
              <ExperimentCard
                label="You made a real ask"
                experiment={q3Experiment}
              />
            )}

            {q4Warmup?.completed && (
              <ExperimentCard
                label="You made a low-stakes ask"
                experiment={q4Warmup}
              />
            )}

            {q4Stretch?.completed && (
              <ExperimentCard
                label="You made an ask you had been avoiding"
                experiment={q4Stretch}
              />
            )}
          </div>
        ) : (
          <EmptyEvidence>
            You started practising what it means to act instead of only
            thinking about acting.
          </EmptyEvidence>
        )}
      </section>

      {/* THE TRANSITION */}
      <section className="space-y-6 border-t border-border pt-10">
        <h3 className="font-heading text-3xl font-semibold tracking-tight">
          You didn&apos;t just think about starting. You moved.
        </h3>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          You looked at what was holding you back. You looked at what you
          already had. You involved other people. You asked. And you found
          out what actually happened.
        </p>
      </section>

      {/* FOUNDER REFLECTION */}
      <section className="max-w-4xl space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your turn
          </p>

          <h3 className="font-heading text-2xl font-semibold">
            What do you know now that you didn&apos;t know when you started?
          </h3>

          <p className="text-muted-foreground">
            There is no right answer. What matters is what you actually
            discovered by going through this.
          </p>
        </div>

        <Textarea
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder="Now I know..."
          className="min-h-[180px] resize-none text-lg leading-8"
        />

        <div className="flex justify-end">
          <Button
            onClick={handleComplete}
            disabled={!hasReflection}
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}

function EvidenceCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl rounded-2xl border border-border bg-card p-6">
      <p className="text-lg leading-8">{children}</p>
    </div>
  );
}

function EmptyEvidence({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl rounded-2xl border border-dashed border-border p-6">
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}

function EvidenceGroup({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{
    title?: string;
    detail?: string;
  }>;
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>

      {items.length > 0 ? (
        <div className="space-y-5">
          {items.map((item, index) => (
            <div key={`${item.title ?? 'item'}-${index}`} className="space-y-1">
              {item.title && (
                <p className="font-medium">{item.title}</p>
              )}

              {item.detail && (
                <p className="leading-7 text-muted-foreground">
                  {item.detail}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="leading-7 text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

function ExperimentCard({
  label,
  experiment,
}: {
  label: string;
  experiment: ExperimentPayload;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        {experiment.intention && (
          <div>
            <p className="mb-1 text-sm font-medium">What you asked</p>
            <p className="leading-7 text-muted-foreground">
              {experiment.intention}
            </p>
          </div>
        )}

        {experiment.prediction && (
          <div>
            <p className="mb-1 text-sm font-medium">What you expected</p>
            <p className="leading-7 text-muted-foreground">
              {experiment.prediction}
            </p>
          </div>
        )}

        {experiment.outcome && (
          <div>
            <p className="mb-1 text-sm font-medium">What happened</p>
            <p className="leading-7 text-muted-foreground">
              {experiment.outcome}
            </p>
          </div>
        )}

        {experiment.reflection && (
          <div>
            <p className="mb-1 text-sm font-medium">What you noticed</p>
            <p className="leading-7 text-muted-foreground">
              {experiment.reflection}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getObjectField(
  value: unknown,
  field: string,
): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return '';
  }

  const result = (value as Record<string, unknown>)[field];

  return typeof result === 'string' ? result : '';
}

function getArrayField<T>(
  value: unknown,
  field: string,
): T[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  const result = (value as Record<string, unknown>)[field];

  return Array.isArray(result) ? (result as T[]) : [];
}

function getExperimentPayload(
  value: unknown,
): ExperimentPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as ExperimentPayload;
}